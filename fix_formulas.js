import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'swes.db');
const db = new sqlite3.Database(dbPath);

console.log(`Connecting to: ${dbPath}`);

db.serialize(() => {
    // 1. List current formatting
    db.all("SELECT id, term, formula FROM terms WHERE formula IS NOT NULL AND formula != ''", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("\n--- Current Formulas ---");
        rows.forEach(r => console.log(`[${r.id}] ${r.term}: ${r.formula}`));

        // 2. Apply Fixes
        const fixStmt = db.prepare("UPDATE terms SET formula = ? WHERE id = ?");

        rows.forEach(r => {
            let newFormula = null;

            // Fix Bulk Density
            if (r.term.includes("Bulk Density")) {
                newFormula = "\\rho_b = \\frac{\\text{mass of soil solid}}{\\text{total volume of soil}}";
            }
            // Fix Porosity (common issue: f = 1 - (rho_b / rho_p))
            else if (r.term.includes("Porosity")) {
                newFormula = "f = 1 - \\frac{\\rho_b}{\\rho_p}";
            }
            // Fix BOD
            else if (r.term.includes("Biochemical Oxygen Demand")) {
                newFormula = "BOD_t = D_0 - D_t";
            }
            // Fix Darcy
            else if (r.term.includes("Darcy")) {
                newFormula = "Q = \\frac{-kA(P_b - P_a)}{\\mu L}";
            }

            if (newFormula && newFormula !== r.formula) {
                console.log(`\nUpdating [${r.term}]...`);
                console.log(` FROM: ${r.formula}`);
                console.log(`   TO: ${newFormula}`);
                fixStmt.run(newFormula, r.id);
            }
        });

        fixStmt.finalize(() => {
            // Verify
            console.log("\n--- Updates Complete. Verifying... ---");
            db.all("SELECT id, term, formula FROM terms WHERE term LIKE 'Bulk%'", (err, checkRows) => {
                checkRows.forEach(r => console.log(`[${r.id}] ${r.term}: ${r.formula}`));
            });
        });
    });
});
