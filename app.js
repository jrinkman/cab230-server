/* eslint-disable import/order */
// Main module imports
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const yaml = require('yamljs');
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig);

// Import the swagger functionality and yaml
const swagger = require('swagger-ui-express');

// Import our routes
const stocksRouter = require('./routes/stocks');
const userRouter = require('./routes/user');

// Define a new express app
const app = express();

// Implement knex middleware
app.use((req, res, next) => {
  req.db = knex;
  next();
});

// Improve morgan logging output
logger.token('req', (req) => JSON.stringify(req.headers, null, 2));
logger.token('res', (req, res) => {
  const headers = {};

  // Update the headers object with each header name and value
  res.getHeaderNames().forEach((h) => {
    headers[h] = res.getHeader(h);
  });

  return JSON.stringify(headers, null, 2);
});

// Add app middleware
app.use(helmet());
app.use(cors());
app.use(logger(':method :url :status :response-time ms\n\n-- REQUEST --\n:req\n\n-- RESPONSE --\n:res'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Create our hello-world route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Stocks API!',
    version: '1.0.0',
  });
});

// Implement our routers
app.use('/stocks', stocksRouter);
app.use('/user', userRouter);
app.use('/docs', swagger.serve, swagger.setup(yaml.load('./docs/swagger.yaml')));

module.exports = app;
