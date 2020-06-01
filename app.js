// Main module imports
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const knexConfig = require('./knexfile');
// eslint-disable-next-line import/order
const knex = require('knex')(knexConfig);

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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/stocks', stocksRouter);
app.use('/user', userRouter);

module.exports = app;
