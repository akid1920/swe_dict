import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'swes.db');
const EXPORT_FILE = path.join(__dirname, 'local_data_export.json');

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error("Could not open local database:", err.message);
        process.exit(1);
    }
    console.log("Connected to local SQLite database.");
});

db.all("SELECT term, definition, description, category, formula, formula_description FROM terms", [], (err, rows) => {
    if (err) {
        console.error("Error reading data:", err.message);
        process.exit(1);
    }

    if (rows.length === 0) {
        console.log("No data found in local database.");
    } else {
        const jsonContent = JSON.stringify(rows, null, 2);
        fs.writeFileSync(EXPORT_FILE, jsonContent);
        console.log(`Successfully exported ${rows.length} terms to ${EXPORT_FILE}`);
        console.log("\nINSTRUCTIONS:");
        console.log("1. Go to your deployed website.");
        console.log("2. Log in to the Admin Dashboard.");
        console.log("3. Use the 'Import Terms' section.");
        console.log(`4. Upload the file: ${EXPORT_FILE}`);
    }

    db.close();
});
