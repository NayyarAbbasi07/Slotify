'use strict';

const { Sequelize } = require('sequelize');
const config = require('../config.json');

const dbConfig = {
  host: process.env.DB_HOST || config.db.host,
  port: Number(process.env.DB_PORT || config.db.port),
  database: process.env.DB_NAME || config.db.database,
  username: process.env.DB_USER || config.db.username,
  password: process.env.DB_PASSWORD,
  dialect: config.db.dialect || 'postgres',
  logging: config.db.logging ? console.log : false,
  timezone: '+05:00',
  define: {
    underscored: true,
    timestamps: true,
    paranoid: true,
  },
};

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    timezone: dbConfig.timezone,
    define: dbConfig.define,
  }
);

async function connectDatabase() {
  await sequelize.authenticate();
  console.log('[db] PostgreSQL connected');

  if (config.db.sync === true && process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('[db] sequelize.sync completed');
  }

  return sequelize;
}

module.exports = {
  sequelize,
  connectDatabase,
};
