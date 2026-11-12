'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config.json');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: `${config.appName || 'Slotify'} API`,
      version: '1.0.0',
      description: 'Groomly / Slotify barber & salon booking marketplace backend',
    },
    servers: [{ url: `http://localhost:${config.PORT || 3008}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./swagger/*.docs.js', './routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = { setupSwagger, swaggerSpec };
