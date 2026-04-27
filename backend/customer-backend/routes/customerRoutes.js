/*
const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const authMiddleware = require('../middleware/authenticateCustomer');
const customerController = require('../controllers/customerController');

// In-memory OTP store
let otpStore = {};

// Registration Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer = new Customer({ name, email, phone, password: hashedPassword });
    await newCustomer.save();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expireAt: Date.now() + 300000 };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"RydFixr Support" <${process.env.EMAIL_USER}>`,
      to: newCustomer.email,
      subject: 'Your OTP Code for Registration',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending OTP', error: error.message });
      } else {
        res.status(200).json({ message: 'Registered successfully. OTP sent to your email.', email });
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// OTP Verification Route
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = otpStore[email];

  if (!storedOtp) {
    return res.status(400).json({ message: 'OTP not generated or expired' });
  }

  if (Date.now() > storedOtp.expireAt) {
    delete otpStore[email];
    return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
  }

  if (otp === storedOtp.otp) {
    delete otpStore[email];
    return res.status(200).json({ message: 'OTP verified successfully' });
  }

  return res.status(400).json({ message: 'Invalid OTP' });
});

// OTP Resend Route
router.post('/otp', async (req, res) => {
  const { email } = req.body;

  try {
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expireAt: Date.now() + 300000 };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"RydFixr Support" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending OTP', error: error.message });
      } else {
        res.status(200).json({ message: 'OTP sent successfully to your email' });
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating OTP', error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: customer._id, email: customer.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token, name: customer.name });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

router.post('/send-request', authMiddleware, customerController.sendRequest);

module.exports = router;
*/

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const {verifyCustomer,authenticateJWT} = require('../middleware/verifyCustomer');
const { getProfile } = require('../controllers/profile');

router.post('/register', customerController.registerCustomer);
router.post('/login', customerController.loginCustomer);
router.post('/verify-otp', customerController.verifyOTP);
router.post('/otp', customerController.generateOTP);
router.post('/send-request', authenticateJWT, customerController.sendRequest);
router.get('/fixpert-location', authenticateJWT, customerController.getFixpertLocation);

router.get('/profile', authenticateJWT, getProfile);
module.exports = router;
