/* eslint-disable import/order */
// Main module imports
const express = require('express');
const path = require('path');
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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Add app middleware
app.use(helmet());
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Implement our routers
app.use('/stocks', stocksRouter);
app.use('/user', userRouter);
app.use('/docs', swagger.serve, swagger.setup(yaml.load('./docs/swagger.yaml')));

module.exports = app;
