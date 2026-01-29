import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JSON_DATA_FILE = path.join(__dirname, 'src', 'data', 'terms.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Initialize Database
db.init().then(async () => {
    // Auto-Migration: Check if empty
    try {
        const row = await db.get("SELECT count(*) as count FROM terms");
        if (row && (row.count === 0 || row.count === '0')) {
            console.log("Database empty. Migrating from JSON...");
            migrateJsonData();
        }
    } catch (e) {
        console.error("Error checking db count", e);
    }
}).catch(err => {
    console.error("CRITICAL: Database initialization failed", err);
});

async function migrateJsonData() {
    if (fs.existsSync(JSON_DATA_FILE)) {
        try {
            const rawData = fs.readFileSync(JSON_DATA_FILE, 'utf8');
            const terms = JSON.parse(rawData);

            if (Array.isArray(terms) && terms.length > 0) {
                for (const term of terms) {
                    await db.run(
                        "INSERT INTO terms (term, definition, description, category, formula, formula_description) VALUES (?, ?, ?, ?, ?, ?)",
                        [term.term, term.definition, term.description, term.category, term.formula, term.formula_description || '']
                    );
                }
                console.log(`Migrated ${terms.length} terms to database.`);
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
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: isPostgres ? 'postgres' : 'sqlite' });
});

// GET terms
app.get('/api/terms', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM terms ORDER BY term ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new term
app.post('/api/terms', checkAuth, async (req, res) => {
    const { term, definition, description, category, formula, formula_description } = req.body;
    if (!term || !definition) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await db.run(
            "INSERT INTO terms (term, definition, description, category, formula, formula_description) VALUES (?, ?, ?, ?, ?, ?)",
            [term, definition, description, category, formula, formula_description]
        );
        res.json({ id: result.id, term, definition, description, category, formula, formula_description });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update term
app.put('/api/terms/:id', checkAuth, async (req, res) => {
    const { id } = req.params;
    const { term, definition, description, category, formula, formula_description } = req.body;

    if (!term || !definition) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await db.run(`
            UPDATE terms 
            SET term = ?, definition = ?, description = ?, category = ?, formula = ?, formula_description = ?
            WHERE id = ?
        `, [term, definition, description, category, formula, formula_description, id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Term not found' });
        }
        res.json({ id, term, definition, description, category, formula, formula_description });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST import
app.post('/api/import', checkAuth, async (req, res) => {
    const importedTerms = req.body;
    if (!Array.isArray(importedTerms)) {
        return res.status(400).json({ error: 'Input must be an array' });
    }

    try {
        let successCount = 0;
        for (const t of importedTerms) {
            await db.run(
                "INSERT INTO terms (term, definition, description, category, formula, formula_description) VALUES (?, ?, ?, ?, ?, ?)",
                [t.term, t.definition, t.description, t.category, t.formula, t.formula_description || '']
            );
            successCount++;
        }
        res.json({ message: `Imported ${successCount} terms.` });
    } catch (err) {
        console.error("Import error", err);
        res.status(500).json({ error: 'Failed to import some terms' });
    }
});

// DELETE term
app.delete('/api/terms/:id', checkAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.run("DELETE FROM terms WHERE id = ?", [id]);
        res.json({ message: 'Term deleted', changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIN check
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    console.log("Login attempt received.");
    // Do NOT log the actual password in production for security, but we can log lengths or a masked version for debugging if needed.
    // console.log(`Received password length: ${password ? password.length : 0}`);
    // console.log(`Expected password length: ${ADMIN_PASSWORD ? ADMIN_PASSWORD.length : 0}`);

    if (password === ADMIN_PASSWORD) {
        console.log("Login successful.");
        res.json({ success: true });
    } else {
        console.log("Login failed: Password mismatch.");
        res.status(401).json({ error: 'Invalid password' });
    }
});

// --- Serve Static Files (Production) ---
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    console.log("Serving static files from 'dist'");
    app.use(express.static(distPath));

    // Handle Client-side Routing (Catch-all)
    app.use((req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
