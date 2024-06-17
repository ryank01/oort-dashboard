const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { DynamoDB } = require('aws-sdk');

const app = express();
const port = process.env.PORT || 3000;
const dynamoDB = new DynamoDB.DocumentClient();
const tableName = 'EC2Instances';
const secretKey = process.env.AWS_SECRET_KEY;

app.use(bodyParser.json());

// Dynamo Tables
const usersTable = 'Users'; // store users
const instancesTable = 'EC2Instances'; // store ec2 metadata

// user signup
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8); // use bcrypt to has the password
  
    const params = {
      TableName: usersTable,
      Item: {
        username,
        password: hashedPassword, // only stored hashed passwords in db
      },
    };
  
    try {
      await dynamoDB.put(params).promise();
      res.status(201).send({ message: 'User registered successfully' });
    } catch (err) {
      console.error('Error registering user:', err);
      res.status(500).send({ message: 'Error registering user' });
    }
});

// user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body; // pass username and password
  
    const params = {
      TableName: usersTable,
      Key: { username },
    };
  
    try {
      const result = await dynamoDB.get(params).promise();
      const user = result.Item;
  
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).send({ message: 'Invalid credentials' }); // check username and password if there is a mismatch in either return 401
      }
  
      const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' }); // else we sign the jwt using our secret key
      res.cookie('token', token, { httpOnly: true }).send({ message: 'Logged in successfully' }); // send the token in http only cookie
    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).send({ message: 'Error logging in' });
    }
});


// Fetch EC2 instances from Dynamodb
app.get('/instances', async (req, res) => {
    const token = req.cookies.token; // get the token from cookie
    if (!token) return res.status(401).send({ message: 'Not authenticated' }); // if no token then user is not authenticated
  
    jwt.verify(token, secretKey, async (err, decoded) => { // if token exists check to see if it's valid
      if (err) return res.status(401).send({ message: 'Token invalid or expired' });
  
      try {
        const instances = await dynamoDB.scan({ TableName: instancesTable }).promise();
        res.send(instances.Items);
      } catch (err) {
        console.error('Error fetching instances:', err);
        res.status(500).send({ message: 'Error fetching instances' });
      }
    });
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });