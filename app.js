'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config.json');
const routes = require('./routes');
const { setupSwagger } = require('./swagger/swagger');
const CustomErrorMiddleware = require('./utils/errorHandlers/CustomErrorMiddleware');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: config.cors?.origins || true,
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/getFile', express.static(path.join(__dirname, 'assets')));

app.get('/', (_req, res) => {
  res.status(200).json({
    message: `${config.appName || 'Slotify'} API is running`,
    docs: '/api-docs',
  });
});

setupSwagger(app);
app.use('/api', routes);

app.use(CustomErrorMiddleware);

module.exports = app;
