import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { Client } = pg;

// Remove sslmode from query string to let config object handle it
const connectionString = process.env.DATABASE_URL.split('?')[0];

const client = new Client({
    connectionString: connectionString,
    ssl: true, // Try simple 'true' first, implying rejectUnauthorized: false in some versions or strict in others
    connectionTimeoutMillis: 5000,
});

console.log('Connecting to:', connectionString.replace(/:[^:@]*@/, ':****@')); // Log masked URL
console.log('Using ssl: true');

client.connect()
    .then(() => {
        console.log('Connected successfully!');
        return client.end();
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
