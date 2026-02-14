// db.ts

import { Client } from 'pg';

// Database connection configuration
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Function to connect to the database
export const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Database connection error:', error);
  }
};

// Function to disconnect from the database
export const disconnectDatabase = async () => {
  try {
    await client.end();
    console.log('Disconnected from the database');
  } catch (error) {
    console.error('Database disconnection error:', error);
  }
};
