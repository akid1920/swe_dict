// PG import removed in favor of createRequire below
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = !!process.env.DATABASE_URL;

let db;
let pool;

if (isPostgres) {
    console.log("Using PostgreSQL database.");
    console.log("DB URL Length:", process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 'MISSING');

    try {
        const { Pool } = require('pg');
        pool = new Pool({
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
    // FALLBACK: Do NOT try to load sqlite3 on Vercel. 
    // It causes crashes if the native module is missing (which it is, in devDeps).
    console.warn("WARNING: No DATABASE_URL found. Running in headless mode (No DB).");
    const noDbError = () => Promise.reject(new Error("Database connection not configured (DATABASE_URL missing)."));

    db = {
        all: noDbError,
        get: noDbError,
        run: noDbError
    };
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
            if (!pool) throw new Error("Database pool not initialized");
            const res = await pool.query(convertQuery(sql), params);
            return res.rows;
        } else {
            return new Promise((resolve, reject) => {
                if (!db) return reject(new Error("SQLite DB not initialized"));
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
            if (!pool) throw new Error("Database pool not initialized");
            const res = await pool.query(convertQuery(sql), params);
            return res.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                if (!db) return reject(new Error("SQLite DB not initialized"));
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
            if (!pool) throw new Error("Database pool not initialized");
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
                if (!db) return reject(new Error("SQLite DB not initialized"));
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

        // Migration: try to add column if missing
        try {
            await database.run("ALTER TABLE terms ADD COLUMN formula_description TEXT");
            console.log("Migration: Added formula_description column.");
        } catch (e) {
            // Column likely exists
        }
    }
};

export default database;
