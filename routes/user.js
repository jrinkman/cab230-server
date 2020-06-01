const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

/* POST user register endpoint. */
router.post('/register', async (req, res) => {
  // Retireve the email / password from the request body
  const { email, password } = req.body;

  // Ensure that the user entered in an email and password
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: 'Request body incomplete - email and password needed',
    });
  }

  // Define a query to retireve users with the supplied email
  const usersQuery = req
    .db.from('users').select('*')
    .where('email', '=', email);

  try {
    // Check whether the user already exists
    if ((await usersQuery).length > 0) {
      res.status(409).json({
        error: true,
        message: 'User already exists!',
      });

      return;
    }

    // Hash the supplied password with 10 salt round
    const hash = await bcrypt.hash(password, 10);

    // Insert the email and hash into the database
    await req.db.from('users').insert({ email, hash });

    res.status(201).json({
      success: true,
      message: 'User created',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

/* POST user login endpoint. */
router.post('/login', async (req, res) => {
  // Retireve the email / password from the request body
  const { email, password } = req.body;

  // Ensure that the user entered in an email and password
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: 'Request body incomplete - email and password needed',
    });
  }

  // Define a query to retireve users with the supplied email
  const usersQuery = req
    .db.from('users').select('*')
    .where('email', '=', email);

  try {
    // Run the user query
    const users = await usersQuery;

    // Check whether the user already exists
    if (users.length === 0) {
      res.status(401).json({
        error: true,
        message: 'Incorrect email or password',
      });

      return;
    }

    const [user] = users;

    // Compare the supplied password with the hashed one
    if (await bcrypt.compare(password, user.hash)) {
      // Create the JWT
      const secretKey = 'NWn7yEHMtyBz67PzdHal7znCokWEwI4TcVEvACLVXAfetBI0gfLss2ly4fnwYiu';
      const expires = 60 * 60 * 24;
      const exp = Math.floor(Date.now() / 1000) + expires;
      const token = jwt.sign({ email, exp }, secretKey);

      // Return the JWT
      res.status(200).json({
        token_type: 'Bearer',
        token,
        expires_in: expires,
      });
    } else {
      res.status(401).json({
        error: true,
        message: 'Incorrect email or password',
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

module.exports = router;
