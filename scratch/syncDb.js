require('dotenv').config();
const { connectDatabase, sequelize } = require('../common/databaseConnection');
require('../models/definition');

(async () => {
  try {
    await connectDatabase();
    const [tables] = await sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    console.log('Tables:', tables.map((t) => t.tablename).join(', ') || '(none)');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
})();
