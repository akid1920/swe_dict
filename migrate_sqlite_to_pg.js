import 'dotenv/config';
import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'swes.db');
const DATABASE_URL = 'postgresql://postgres.akqsmybactqgeemoztox:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'; // Placeholder

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error("Please set DATABASE_URL environment variable.");
        return;
    }

    console.log("Reading from SQLite...");
    const sqliteDb = new sqlite3.Database(DB_FILE);

    const rows = await new Promise((resolve, reject) => {
        sqliteDb.all("SELECT * FROM terms", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    console.log(`Found ${rows.length} terms in SQLite.`);

    console.log("Connecting to Postgres...");
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        for (const row of rows) {
            await pool.query(
                `INSERT INTO terms (term, definition, description, category, formula, formula_description) 
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO NOTHING`, // Assuming ID conflict handling is needed, or just insert
                [row.term, row.definition, row.description, row.category, row.formula, row.formula_description]
            );
        }
        console.log("Migration complete.");
    } catch (e) {
        console.error("Migration failed", e);
    } finally {
        await pool.end();
        sqliteDb.close();
    }
}

migrate();
