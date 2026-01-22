import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'swes.db');
const JSON_DATA_FILE = path.join(__dirname, 'src', 'data', 'terms.json');
const ADMIN_PASSWORD = 'admin';

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Initialize & Connect to Database
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Create Table
        db.run(`CREATE TABLE IF NOT EXISTS terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT,
      definition TEXT,
      description TEXT,
      category TEXT,
      formula TEXT,
      formula_description TEXT
    )`, (err) => {
            if (err) {
                console.error("Error creating table", err);
                return;
            }

            // Migration: Add formula_description column if missing (for existing dbs)
            db.all("PRAGMA table_info(terms)", (err, rows) => {
                if (!err) {
                    const hasCol = rows.some(r => r.name === 'formula_description');
                    if (!hasCol) {
                        console.log("Migrating: Adding formula_description column...");
                        db.run("ALTER TABLE terms ADD COLUMN formula_description TEXT", (err) => {
                            if (err) console.error("Migration failed:", err);
                        });
                    }
                }
            });

            // Auto-Migration: Check if empty
            db.get("SELECT count(*) as count FROM terms", (err, row) => {
                if (!err && row.count === 0) {
                    console.log("Database empty. Migrating from JSON...");
                    migrateJsonData();
                }
            });
        });
    });
}

function migrateJsonData() {
    if (fs.existsSync(JSON_DATA_FILE)) {
        try {
            const rawData = fs.readFileSync(JSON_DATA_FILE, 'utf8');
            const terms = JSON.parse(rawData);

            if (Array.isArray(terms) && terms.length > 0) {
                const stmt = db.prepare("INSERT INTO terms (term, definition, description, category, formula, formula_description) VALUES (?, ?, ?, ?, ?, ?)");

                db.serialize(() => {
                    terms.forEach(term => {
                        stmt.run(term.term, term.definition, term.description, term.category, term.formula, term.formula_description || '');
                    });
                    stmt.finalize();
                    console.log(`Migrated ${terms.length} terms to SQLite.`);
                });
            }
        } catch (e) {
            console.error("Migration failed:", e);
        }
    }
}

// Middleware
const checkAuth = (req, res, next) => {
    const password = req.headers['x-admin-password'];
    if (password === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// --- API Endpoints ---

// GET terms
app.get('/api/terms', (req, res) => {
    db.all("SELECT * FROM terms ORDER BY term ASC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST new term
app.post('/api/terms', checkAuth, (req, res) => {
    const { term, definition, description, category, formula, formula_description } = req.body;
    if (!term || !definition) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare("INSERT INTO terms (term, definition, description, category, formula, formula_description) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(term, definition, description, category, formula, formula_description, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, term, definition, description, category, formula, formula_description });
    });
    stmt.finalize();
});

// PUT update term
app.put('/api/terms/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    const { term, definition, description, category, formula, formula_description } = req.body;

    if (!term || !definition) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare(`
        UPDATE terms 
        SET term = ?, definition = ?, description = ?, category = ?, formula = ?, formula_description = ?
        WHERE id = ?
    `);

    stmt.run(term, definition, description, category, formula, formula_description, id, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Term not found' });
        }
        res.json({ id, term, definition, description, category, formula, formula_description });
    });
    stmt.finalize();
});

// POST import
app.post('/api/import', checkAuth, (req, res) => {
    const importedTerms = req.body;
    if (!Array.isArray(importedTerms)) {
        return res.status(400).json({ error: 'Input must be an array' });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare("INSERT INTO terms (term, definition, description, category, formula, formula_description) VALUES (?, ?, ?, ?, ?, ?)");

        let errorOccurred = false;
        importedTerms.forEach(t => {
            stmt.run(t.term, t.definition, t.description, t.category, t.formula, t.formula_description || '', (err) => {
                if (err) errorOccurred = true;
            });
        });

        stmt.finalize(() => {
            if (errorOccurred) {
                db.run("ROLLBACK");
                res.status(500).json({ error: 'Failed to import some terms' });
            } else {
                db.run("COMMIT");
                res.json({ message: `Imported ${importedTerms.length} terms.` });
            }
        });
    });
});

// DELETE term
app.delete('/api/terms/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM terms WHERE id = ?", id, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Term deleted', changes: this.changes });
    });
});

// LOGIN check
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// --- Serve Static Files (Production) ---
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    console.log("Serving static files from 'dist'");
    app.use(express.static(distPath));

    // Handle Client-side Routing (Catch-all)
    // Using app.use() as the last middleware to catch unmatched requests
    app.use((req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
