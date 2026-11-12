'use strict';

const fs = require('fs');
const path = require('path');
const { QueryTypes } = require('sequelize');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

/**
 * Applies every migrations/*.sql file that is not yet recorded in schema_migrations, in filename order.
 * Each file runs in its own transaction, so a failed file leaves no partial change behind.
 * Returns the names of the files applied in this call.
 */
async function runMigrations(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const rows = await sequelize.query('SELECT name FROM schema_migrations', {
    type: QueryTypes.SELECT,
  });
  const applied = new Set(rows.map((r) => r.name));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const newlyApplied = [];
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await sequelize.transaction(async (transaction) => {
      await sequelize.query(sql, { transaction });
      await sequelize.query('INSERT INTO schema_migrations (name) VALUES (:name)', {
        replacements: { name: file },
        transaction,
      });
    });

    console.log(`[migrate] applied ${file}`);
    newlyApplied.push(file);
  }

  return newlyApplied;
}

module.exports = { runMigrations };
