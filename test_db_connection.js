import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000 // 5 second timeout
});

console.log("Attempting to connect to:", process.env.DATABASE_URL);

pool.connect()
    .then(client => {
        console.log("Successfully connected to PostgreSQL!");
        client.release();
        return pool.end();
    })
    .catch(err => {
        console.error("Connection failed.");
        console.error("Error:", err.message);
        if (err.message.includes('getaddrinfo')) {
            console.log("\nNOTE: This looks like a DNS error. The hostname 'dpg-...' is likely an internal Render URL.");
            console.log("It will work when deployed to Render, but not from your local machine.");
            console.log("To test locally, you need the 'External Connection URL' from Render.");
        }
        process.exit(1);
    });
