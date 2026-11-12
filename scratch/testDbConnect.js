require('dotenv').config();
const { Client } = require('pg');

// Uses only the DB_* values from .env. No credentials are hard-coded here.
(async () => {
  if (!process.env.DB_PASSWORD) {
    console.log('FAIL: DB_PASSWORD is not set in .env');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'slotify',
  });

  try {
    await client.connect();
    const result = await client.query('SELECT current_user AS usr, current_database() AS db');
    console.log('SUCCESS', JSON.stringify(result.rows[0]));
    process.exitCode = 0;
  } catch (err) {
    console.log('FAIL', err.message.split('\n')[0]);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})();
