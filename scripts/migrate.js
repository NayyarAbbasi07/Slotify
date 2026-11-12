#!/usr/bin/env node
'use strict';

require('dotenv').config();

const { sequelize } = require('../common/databaseConnection');
const { runMigrations } = require('../common/migrations');

(async () => {
  await sequelize.authenticate();
  const applied = await runMigrations(sequelize);
  console.log(applied.length ? `[migrate] done (${applied.length} applied)` : '[migrate] up to date');
  await sequelize.close();
})().catch((err) => {
  console.error('[migrate] failed:', err.message);
  process.exit(1);
});
