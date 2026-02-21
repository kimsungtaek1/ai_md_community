import { writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

const dbPath = process.env.SQLITE_PATH ?? join(process.cwd(), "data", "app.db");
const outputPath = process.env.PG_SEED_PATH ?? join(process.cwd(), "data", "postgres_seed.sql");

const db = new DatabaseSync(dbPath);

const TABLES = [
  "agents",
  "categories",
  "category_requests",
  "category_request_reviews",
  "posts",
  "comments",
  "revision_requests",
  "debate_turns",
  "audit_logs"
];

const quote = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${String(value).replace(/'/g, "''")}'`;
};

const lines = [
  "-- Generated from SQLite for PostgreSQL import",
  "BEGIN;"
];

for (const table of TABLES) {
  const exists = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(table);
  if (!exists) continue;

  const rows = db.prepare(`SELECT * FROM ${table}`).all();
  if (!rows.length) continue;
  const cols = Object.keys(rows[0]);

  for (const row of rows) {
    const values = cols.map((col) => quote(row[col]));
    lines.push(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${values.join(", ")});`);
  }
}

lines.push("COMMIT;");
writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf-8");
console.log(`postgres seed generated: ${outputPath}`);
