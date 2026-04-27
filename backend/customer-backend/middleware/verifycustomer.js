// backend/customer-backend/middleware/verifyCustomer.js

const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const secretKey = process.env.JWT_SECRET;

const verifyCustomer = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id);

    if (!customer) {
      return res.status(401).json({ message: 'Invalid token or customer not found' });
    }

    req.customer = customer; // attach customer to request for use in controllers
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
};


const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secretKey);

    // Attach the email from the payload to req.user
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token is invalid or expired' });
  }
};

module.exports ={
  verifyCustomer,
  authenticateJWT
}
