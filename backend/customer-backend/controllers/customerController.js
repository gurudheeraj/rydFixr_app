/*const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const ServiceRequest = require('../models/ServiceRequest');
const Fixpert = require('../../fixpert-backend/models/Fixpert');


// Utility function to generate numeric OTP
const generateNumericOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric OTP
};

// Registration
exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Customer.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = new Customer({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    await newCustomer.save();

    // Generate numeric OTP
    const otp = generateNumericOTP();

    newCustomer.otp = otp;
    newCustomer.otpExpire = Date.now() + 300000; // 5 minutes
    await newCustomer.save();

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
        res.status(201).json({ message: 'Customer registered successfully, please verify your email with OTP' });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration error', error: err.message });
  }
};

// Login
// Login Route
exports.loginCustomer = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Validate the inputs
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
  
      // Find the customer by email
      const customer = await Customer.findOne({ email });
      if (!customer) return res.status(400).json({ message: 'Invalid credentials' });
  
      // Compare password with the stored hashed password
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
  
      // Generate JWT token
      const token = jwt.sign(
        { id: customer._id, email: customer.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
  
      // Respond with the token
      res.status(200).json({ message: 'Login successful', token, name: customer.name });
    } catch (err) {
      console.error(err); // Log the error for debugging
      res.status(500).json({ message: 'Login error', error: err.message });
    }
  };
  

// Generate New OTP
exports.generateOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) return res.status(400).json({ message: 'Customer not found' });

    if (customer.otpExpire && customer.otpExpire > Date.now()) {
      return res.status(400).json({ message: 'OTP is still valid. Please verify it.' });
    }

    const otp = generateNumericOTP();

    customer.otp = otp;
    customer.otpExpire = Date.now() + 300000;
    await customer.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: 'Your New OTP Code',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending OTP', error: error.message });
      } else {
        res.status(200).json({ message: 'New OTP sent successfully' });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'OTP generation error', error: err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) return res.status(400).json({ message: 'Customer not found' });

    if (customer.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (customer.otpExpire < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    customer.otp = undefined;
    customer.otpExpire = undefined;
    await customer.save();

    res.status(200).json({ message: 'OTP verified successfully, registration completed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'OTP verification error', error: err.message });
  }
};

// Send Service Request (within 10km radius)
const sendRequest = async (req, res) => {
  const { name, phone, issue, location } = req.body;

  if (!name || !phone || !issue || !location?.lat || !location?.lng) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const request = await new ServiceRequest({
      customerName: name,
      customerPhone: phone,
      issue,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      }
    }).save();

    const nearbyFixperts = await Fixpert.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [location.lng, location.lat] },
          $maxDistance: 10000
        }
      }
    });

    // (Optional: send notifications to fixperts)

    return res.status(200).json({
      message: 'Request sent to nearby fixperts',
      requestId: request._id,
      fixpertsNotified: nearbyFixperts.length
    });

  } catch (err) {
    console.error('Error sending request:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  sendRequest
};
*/



const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const ServiceRequest = require('../models/ServiceRequest');
const Fixpert = require('../../fixpert-backend/models/Fixpert');
const secretKey = process.env.JWT_SECRET;
const axios = require("axios");

async function getRouteDistance(lat1, lng1, lat2, lng2) {
  try {
    const res = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        coordinates: [
          [lng1, lat1],
          [lng2, lat2]
        ]
      },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    if (!res.data.routes || res.data.routes.length === 0) {
      return 999;
    }

    return res.data.routes[0].summary.distance / 1000;

  } catch (err) {
    console.log("ORS ERROR:", err.message);
    return 999;
  }
}


// ✅ Add in-memory OTP store for development
const otpStore = new Map();

// Utility: Generate numeric 6-digit OTP
const generateNumericOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Configure nodemailer transporter
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Exists' : '❌ Missing');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper to send email
const sendEmail = async (to, text) => {
  const subject = 'Your OTP code for Customer Registration confirmation!';
  const html = `
    <p><big>Hello Customer, You have received One Time Verification Code for registration.</big></p>
    <br />
    <center>
    <p><big><strong>${text}</strong>.</big></p>
    </center>
    <br />
    <p><big>Regards,<br />Team RydFixr.</big></p>
  `;
  const mailOptions = {
    from: `"rydFixr Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };

  return transporter.sendMail(mailOptions);
};


const sendLoginCredentialsEmail = async (email,password) => {
  const subject = 'Your Customer Login Credentials :';
  const html = `
    <p><big>Hello Customer,</big></p>
    <p><big>🎉 Greetings from RydFixr! We are happy to invite you, into our RydFixr family!</big></p>
    <p><big>Kindly refer below to login into customer-portal.</big></p>
    <br />
    <h2><center>Customer Login! Credentials..</center></h2>
    <p><center><big><strong>Customer Mail-ID:</strong> ${email}</big></center></p>
    <p><center><big><strong>Password:</strong> ${password}</big></center></p>
    <br />
    <p><big>Regards,<br />Team RydFixr.</big></p>
  `;
  try {
    const mailOptions = {
      from: `"rydFixr Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Login credentials email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send login credentials email to ${email}: ${error.message}`);
    throw error;
  }
};







// Register Customer
const registerCustomer = async (req, res) => {
  try {
    let { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    email = email.toLowerCase().trim();

    const existing = await Customer.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateNumericOTP();

    const newCustomer = new Customer({
      name,
      email,
      phone,
      password: hashedPassword,
      plainpassword:password,
      otp,
      otpExpire: Date.now() + 300000
    });

    await newCustomer.save();

    await sendEmail(email, `OTP: ${otp}`);
    //if not get register delete it----------------------------------------------------------------------------------------------------
    const token = jwt.sign({ email }, secretKey, { expiresIn: '2h' });

    return res.status(201).json({ message: 'Customer registered. Check email for OTP.' ,token}); //removen token if get errorr --------
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration error', error: err.message });
  }
};

// Login Customer
const loginCustomer = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    email = email.toLowerCase().trim();

    const customer = await Customer.findOne({ email });
    if (!customer) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: customer._id, email: customer.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token, name: customer.name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};

// Generate New OTP
const generateOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (!customer) return res.status(400).json({ message: 'Customer not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 5 * 60 * 1000;

    // Store in-memory
    otpStore.set(email.toLowerCase().trim(), { otp, otpExpire });

    // Send OTP via email
    const mailOptions = {
      from: `"RydFixr Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error sending OTP:', error);
        return res.status(500).json({ message: 'Failed to send OTP email' });
      }

      return res.status(200).json({ message: 'OTP sent successfully' });
    });

  } catch (err) {
    console.error('OTP generation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    email = email.toLowerCase().trim();
    otp = otp.toString().trim();

    const customer = await Customer.findOne({ email }).select('+plainpassword');

    if (!customer || !customer.otp) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    if (Date.now() > customer.otpExpire) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (customer.otp.toString() !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }
    await sendLoginCredentialsEmail(customer.email,customer.plainpassword);

    // OTP is valid - clear it from DB
    customer.otp = undefined;
    customer.plainpassword=undefined;
    customer.otpExpire = undefined;
    await customer.save();

    return res.status(200).json({ message: 'OTP verified successfully, registration completed' });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Send Service Request
const sendRequest = async (req, res) => {
  const { issue, latitude, longitude } = req.body;

  if (!issue || !latitude || !longitude) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const customer = await Customer.findById(req.user.id);

    const request = await new ServiceRequest({
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      issue,
      status: "pending",
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    }).save();

    console.log("✅ Request saved:", request);

    res.status(200).json({
      message: 'Request created successfully',
      requestId: request._id
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// Get Fixpert Location for Live Tracking
const getFixpertLocation = async (req, res) => {
  try {
    const customerId = req.user.id;  // ✅ FIXED

    const request = await ServiceRequest.findOne({
      customerId,
      status: 'accepted'
    });

    if (!request || !request.fixpertId) {
      return res.status(404).json({ message: 'No fixpert currently assigned' });
    }

    const fixpert = await Fixpert.findById(request.fixpertId);

    if (!fixpert || !fixpert.location) {
      return res.status(404).json({ message: 'Fixpert location unavailable' });
    }

    // ✅ FIXED COORDINATES
    const lat = fixpert.location.coordinates[1];
    const lng = fixpert.location.coordinates[0];

    //res.status(200).json({ lat, lng });
    const customerLat = request.location.coordinates[1];
    const customerLng = request.location.coordinates[0];

    const distance = await getRouteDistance(
      lat,
      lng,
      customerLat,
      customerLng
    );

    if (distance === 999) {
      return res.status(200).json({ lat, lng, distance: null });
      console.log(distance)
    }

    res.status(200).json({
      lat,
      lng,
      distance
    });
    console.log(distance)

  } catch (err) {
    console.error('Error getting fixpert location:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({
      name: customer.name,
      phone: customer.phone,
      email: customer.email
    });

  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  verifyOTP,
  generateOTP,
  sendRequest,
  getFixpertLocation,
  getProfile
};