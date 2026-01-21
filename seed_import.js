import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'swes.db');
const jsonPath = path.resolve(__dirname, 'large_terms_seed.json');

if (!fs.existsSync(jsonPath)) {
    console.error("Seed file not found!");
    process.exit(1);
}

const terms = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const db = new sqlite3.Database(dbPath);

console.log(`Importing ${terms.length} terms into ${dbPath}...`);

db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("INSERT INTO terms (term, definition, description, category, formula) VALUES (?, ?, ?, ?, ?)");

    terms.forEach(t => {
        stmt.run(t.term, t.definition, t.description, t.category, t.formula);
    });

    stmt.finalize();
    db.run("COMMIT", (err) => {
        if (err) console.error("Error committing:", err);
        else console.log("Success! Database populated.");
        db.close();
    });
});
