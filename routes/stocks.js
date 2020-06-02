/* eslint-disable no-restricted-globals */
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Create the token virification middleware
const verifyToken = (req, res, next) => {
  const { authorization } = req.headers;

  // Check whether an authorization token was supplied
  if (!authorization
    || !authorization.startsWith('Bearer ')
  ) {
    res.status(403).json({
      error: true,
      message: 'Authorization header not found',
    });

    return;
  }

  // Retrieve the token from the authorization header
  const secretKey = 'NWn7yEHMtyBz67PzdHal7znCokWEwI4TcVEvACLVXAfetBI0gfLss2ly4fnwYiu';
  jwt.verify(authorization.split('Bearer ')[1], secretKey, (err) => {
    // If an error occured
    if (err) {
      res.status(403).json({
        error: true,
        message: 'Invalid JWT token',
      });

      return;
    }

    // Run the next middleware function
    next();
  });
};

/* GET symbols */
router.get('/symbols', async (req, res) => {
  // Ensure that our query params are valid
  if (Object.keys(req.query).filter((key) => key !== 'industry').length > 0) {
    res.status(400).json({
      error: true,
      message: 'Invalid query parameter: only \'industry\' is permitted',
    });

    return;
  }

  // Grab the industry value from the query parameters
  const { industry } = req.query;

  // Define a base query to retireve basic stock information
  let baseQuery = req
    .db.from('stocks')
    .select('name', 'symbol', 'industry').groupBy('name', 'symbol', 'industry');

  try {
    // If we recieved an industry parameter, update the query with it
    if (industry) {
      baseQuery = baseQuery.where('industry', 'like', `%${industry}%`);
    }

    // Retrieve the query results
    const results = await baseQuery;

    // Respond with an error if no results were returned
    if (results.length === 0) {
      res.status(404).json({
        error: true,
        message: 'Industry sector not found',
      });
      return;
    }

    // Just return the complete list of stocks.
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get('/:symbol', async (req, res) => {
  // Ensure that our query params are valid
  if (Object.keys(req.query).length > 0) {
    res.status(400).json({
      error: true,
      message: 'Date parameters only available on authenticated route /stocks/authed',
    });

    return;
  }

  // Grab the symbol value from the parameters
  const { symbol } = req.params;

  // Validate the symbol query parameter
  if (symbol !== symbol.toUpperCase() || symbol.length > 5) {
    res.status(400).json({
      error: true,
      message: 'Stock symbol incorrect format - must be 1-5 capital letters',
    });
  }

  // Define a base query to retireve the latest stock values
  const baseQuery = req
    .db.from('stocks')
    .select('*').orderBy('timestamp', 'desc').limit(1)
    .where('symbol', '=', symbol);

  try {
    // Retrieve the query results
    const results = await baseQuery;

    // Respond with an error if no results were returned
    if (results.length === 0) {
      res.status(404).json({
        error: true,
        message: 'No entry for symbol in stocks database',
      });
      return;
    }

    // Return the latest stock
    res.status(200).json(results[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get('/authed/:symbol', verifyToken, async (req, res) => {
  // Grab the symbol value and from, to values from the parameters
  const { symbol } = req.params;
  const { from, to } = req.query;

  // Ensure that our query params are valid
  if ((from && isNaN(Date.parse(from)))
      || (to && isNaN(Date.parse(to)))
      || Object.keys(req.query).filter((key) => !['from', 'to'].includes(key)).length > 0) {
    res.status(400).json({
      error: true,
      message: 'Parameters allowed are \'from\' and \'to\', example: /stocks/authed/AAL?from=2020-03-15',
    });

    return;
  }

  // Validate the symbol query parameter
  if (symbol !== symbol.toUpperCase() || symbol.length > 5) {
    res.status(400).json({
      error: true,
      message: 'Stock symbol incorrect format - must be 1-5 capital letters',
    });
  }

  // Define a base query to retireve the latest stock values
  let baseQuery = req
    .db.from('stocks')
    .select('*').where('symbol', '=', symbol);

  // If a 'from' query parameter was provided, add it to the query.
  if (from) {
    baseQuery = baseQuery.where('timestamp', '>=', from);
  }

  // If a 'to' query parameter was provided, add it to the query.
  if (to) {
    baseQuery = baseQuery.where('timestamp', '<=', to);
  }

  try {
    // Retrieve the query results
    const results = await baseQuery;

    // Respond with an error if no results were returned
    if (results.length === 0) {
      res.status(404).json({
        error: true,
        message: 'No entry for symbol in stocks database',
      });
      return;
    }

    // Return the latest stock
    if (from || to) {
      res.status(200).json(results);
    } else {
      res.status(200).json(results[0]);
    }
  } catch (error) {
    if (error.errno && error.errno === 1525) {
      res.status(400).json({
        error: true,
        message: 'Parameters allowed are \'from\' and \'to\', example: /stocks/authed/AAL?from=2020-03-15',
      });

      return;
    }

    console.log(error);
    res.status(500).json(error);
  }
});

module.exports = router;
