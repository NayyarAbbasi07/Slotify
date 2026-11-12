'use strict';

require('dotenv').config();

const { connectDatabase } = require('../common/databaseConnection');
const { seedPlatformSettings } = require('./platformSettings/platformSettingsSeeder');

async function run() {
  try {
    await connectDatabase();
  } catch (err) {
    console.warn('[seed] DB not available:', err.message);
  }

  await seedPlatformSettings();
  console.log('[seed] done');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
