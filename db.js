import sqlite3 from 'sqlite3';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = !!process.env.DATABASE_URL;

let db;
let pool;

if (isPostgres) {
    console.log("Using PostgreSQL database.");
    console.log("DB URL Length:", process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 'MISSING');

    try {
        pool = new pg.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        // Test connection immediately to fail fast
        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    } catch (err) {
        console.error("FAILED TO INITIALIZE POOL:", err);
    }
} else {
    console.log("Using local SQLite database.");
    const DB_FILE = path.join(__dirname, 'swes.db');
    db = new sqlite3.Database(DB_FILE);
}

// Helper to convert '?' params to '$1, $2' for Postgres
const convertQuery = (sql) => {
    if (!isPostgres) return sql;
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
};

const database = {
    // Run a query that returns multiple rows
    all: async (sql, params = []) => {
        if (isPostgres) {
            const res = await pool.query(convertQuery(sql), params);
            return res.rows;
        } else {
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    // Run a query that returns a single row or null
    get: async (sql, params = []) => {
        if (isPostgres) {
            const res = await pool.query(convertQuery(sql), params);
            return res.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
    },

    // Execute a command (INSERT, UPDATE, DELETE)
    // Returns { id: number, changes: number }
    run: async (sql, params = []) => {
        if (isPostgres) {
            // Postgres doesn't return lastID automatically like SQLite
            // We need to append RETURNING id if it's an INSERT
            let pSql = convertQuery(sql);
            const isInsert = /^\s*INSERT/i.test(pSql);

            if (isInsert) {
                pSql += ' RETURNING id';
            }

            const res = await pool.query(pSql, params);

            return {
                id: isInsert && res.rows[0] ? res.rows[0].id : null,
                changes: res.rowCount
            };
        } else {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, changes: this.changes });
                });
            });
        }
    },

    init: async () => {
        const createTableSql = isPostgres
            ? `CREATE TABLE IF NOT EXISTS terms (
                 id SERIAL PRIMARY KEY,
                 term TEXT,
                 definition TEXT,
                 description TEXT,
                 category TEXT,
                 formula TEXT,
                 formula_description TEXT
               )`
            : `CREATE TABLE IF NOT EXISTS terms (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 term TEXT,
                 definition TEXT,
                 description TEXT,
                 category TEXT,
                 formula TEXT,
                 formula_description TEXT
               )`;

        await database.run(createTableSql);
        console.log("Database initialized.");

        // Check if migration needed (add column)
        // Simplified check: select one row, see if formula_description exists
        // Or just try to ADD COLUMN and ignore error
        // A better cross-db way:
        try {
            await database.run("ALTER TABLE terms ADD COLUMN formula_description TEXT");
            console.log("Migration: Added formula_description column.");
        } catch (e) {
            // Column likely exists
        }
    }
};

export default database;
