import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'swes.db');
const db = new sqlite3.Database(dbPath);

console.log(`\n--- Connecting to Database at: ${dbPath} ---\n`);

db.all("SELECT * FROM terms", [], (err, rows) => {
    if (err) {
        console.error("Error reading database:", err);
        return;
    }

    if (rows.length === 0) {
        console.log("Database is empty.");
    } else {
        console.log(`Found ${rows.length} terms:\n`);
        rows.forEach(row => {
            console.log(`[${row.id}] ${row.term} (${row.category})`);
            // Console log a bit of definition if needed
            // console.log(`    ${row.definition.substring(0, 50)}...`);
        });
    }
    console.log("\n--- End of Dump ---\n");
});

db.close();
