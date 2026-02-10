import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function migrate() {
    console.log('DB URL loaded:', !!process.env.DATABASE_URL);
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing');
        process.exit(1);
    }

    console.log('Connecting to database...');
    // Rely on connection string for SSL configuration
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected.');

        const sqlPath = path.join(__dirname, '../lib/schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration completed successfully.');

        const res = await client.query("SELECT to_regclass('public.users');");
        if (res.rows[0].to_regclass) {
            console.log('Verification: Table "users" exists.');
        } else {
            console.error('Verification FAILED: Table "users" does not exist.');
        }

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
