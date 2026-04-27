const Fixpert = require('../models/Fixpert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const ServiceRequest = require('../models/ServiceRequest');
const secretKey = process.env.JWT_SECRET;
const {customerSockets} = require("../../websocket/socketHandler");
//const haversine = require('haversine-distance'); // optional helper or custom function
const axios = require("axios");
require('dotenv').config();

async function getRouteDistance(lat1, lng1, lat2, lng2) {
  try {
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      console.log("❌ Invalid coords");
      return 999;
    }

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

    const data = res.data;

    // 🔥 CORRECT FIX (IMPORTANT)
    if (!data.routes || data.routes.length === 0) {
      console.log("❌ No route:", data);
      return 999;
    }

    return data.routes[0].summary.distance / 1000;

  } catch (err) {
    console.log("❌ ORS ERROR:", err.response?.data || err.message);
    return 999;
  }
}

// Utility functions
const generateNumericOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateFixpertId = () => 'RF' + Math.floor(100000 + Math.random() * 900000);

// Email config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// Send OTP email for Fixpert registration
const sendOtpEmail = async (email, otp) => {
  const subject = 'Your OTP code for Fixpert Registration confirmation!';
  const html = `
    <p><big>Hello Fixpert,</big></p>
    <center>
    <p><big>Your One Time Verification Code is: <strong>${otp}</strong>.</big></p>
    </center>
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
    console.log(`✅ OTP email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}: ${error.message}`);
    throw error;
  }
};

// Send Fixpert login credentials after OTP verification
const sendLoginCredentialsEmail = async (email, fixpertId, password) => {
  const subject = 'Your Fixpert Login Credentials :';
  const html = `
    <p><big>Hello Fixpert,</big></p>
    <p><big>🎉 Greetings from RydFixr! We are happy to invite you, into our RydFixr family!</big></p>
    <p><big>Kindly refer below to login into fixpert-portal.</big></p>
    <br />
    <h2><center>Fixpert Login! Credentials..</center></h2>
    <p><center><big><strong>Fixpert ID:</strong> ${fixpertId}</big></center></p>
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

// Register Fixpert
exports.registerFixpert = async (req, res) => {
  try {
    const { name, email, phone, password, latitude, longitude } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Fixpert.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Fixpert already registered' });

    const otp = generateNumericOTP();
    const fixpertId = generateFixpertId();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use passed coordinates or fallback to [0, 0]
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location required" });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];

    const fixpert = new Fixpert({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      plainPassword: password,
      mechanicId: fixpertId,
      otp,
      location: {
        type: 'Point',
        coordinates: coordinates
      }
    });

    await fixpert.save();

    // Send OTP email
    await sendOtpEmail(fixpert.email, otp);

    res.status(201).json({ message: 'Fixpert registered. OTP sent to email.', email: fixpert.email});
  } catch (err) {
    console.error('Fixpert registration error:', err);
    res.status(500).json({ message: 'Something went wrong during registration.', error: err.message });
  }
};



exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const fixpert = await Fixpert.findOne({ email: email.toLowerCase() }).select('+plainPassword');

    if (!fixpert || !fixpert.otp) {
      return res.status(400).json({ message: 'OTP verification failed' });
    }

    if (fixpert.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Send login credentials using the plainPassword
    await sendLoginCredentialsEmail(fixpert.email, fixpert.mechanicId, fixpert.plainPassword);

    // Clear sensitive fields
    fixpert.otp = undefined;
    fixpert.plainPassword = undefined;
    await fixpert.save();

    res.status(200).json({
      message: 'OTP verified. Login credentials sent via email.',
      redirectToLoginPage: true
    });
  } catch (err) {
    res.status(500).json({ message: 'OTP verification error', error: err.message });
  }
};



// Resend OTP
exports.generateOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const fixpert = await Fixpert.findOne({ email: email.toLowerCase() });
    if (!fixpert) return res.status(400).json({ message: 'Fixpert not found' });

    const otp = generateNumericOTP();
    fixpert.otp = otp;
    await fixpert.save();

    // Send OTP email
    await sendOtpEmail(fixpert.email, otp);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'OTP generation error', error: err.message });
  }
};

// Login with Fixpert ID and password
exports.loginFixpert = async (req, res) => {
  try {
    const { mechanicId, password } = req.body;

    if (!mechanicId || !password) {
      return res.status(400).json({ message: 'Fixpert ID and password are required' });
    }

    const fixpert = await Fixpert.findOne({ mechanicId });
    if (!fixpert) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, fixpert.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: fixpert._id, mechanicId: fixpert.mechanicId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token,
      fixpert: {   // if not login remove this -----------------------------------------------------------------------
        name: fixpert.name,
        mechanicId: fixpert.mechanicId,
        email: fixpert.email,
        phone: fixpert.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};

exports.updateFixpertLocation = async (req, res) => {
  
  const { latitude, longitude } = req.body;
  const fixpertId = req.fixpert.mechanicId;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  try {
    await Fixpert.findOneAndUpdate(
      { mechanicId: fixpertId },
      {
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)] // GeoJSON: [lng, lat]
        }
      }
    );

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating fixpert location:', error.message);
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
};


exports.getNearbyRequests = async (req, res) => {

  const fixpert = req.fixpert;

  if (!fixpert.location || !fixpert.location.coordinates) {
    return res.status(400).json({ message: 'Fixpert location not found' });
  }

  const [longitude, latitude] = fixpert.location.coordinates;

  try {
    // 🔥 DEBUG START
    console.log("🔥 Fetching ServiceRequests...");
    console.log("📍 Fixpert coords:", { latitude, longitude });

    const nearbyRequests = await ServiceRequest.find({
      isAccepted: false,
      expired: false,
      skippedBy: { $ne: fixpert.mechanicId }, // ✅ KEY FIX
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: 10000
        }
      }
    })

    console.log("📦 Raw requests:", nearbyRequests);

    /*
    const response = nearbyRequests.map(request => {
      console.log("REQUEST EMAIL:", request.customerEmail);
      const distanceInMeters = haversine(
        { lat: latitude, lon: longitude },
        {
          lat: request.location.coordinates[1],
          lon: request.location.coordinates[0]
        }
      );
      console.log("REQUEST EMAIL:", request.customerEmail);
      return {
        requestId: request._id,
        name: request.customerName,
        phone: request.customerPhone,
        email: request.customerEmail,
        issue: request.issue,
        location: {
          latitude: request.location.coordinates[1],
          longitude: request.location.coordinates[0]
        },
        distance: (distanceInMeters / 1000).toFixed(2)
      };
    }); */

    const response = [];

    for (const request of nearbyRequests) {
      if (latitude === 0 || longitude === 0) {
        console.log("❌ Skipping invalid fixpert location");
        continue;
      }

      const customerLat = request.location.coordinates[1];
      const customerLng = request.location.coordinates[0];

      if (!customerLat || !customerLng) {
        console.log("❌ Invalid customer coords");
        continue;
      }

      // 🔥 REAL DISTANCE USING ORS
      const distance = await getRouteDistance(
        latitude,
        longitude,
        customerLat,
        customerLng
      );

      if (distance === 999) continue;
      // ✅ FILTER AGAIN (IMPORTANT)
      if (distance > 10) continue;

      response.push({
        requestId: request._id,
        name: request.customerName,
        phone: request.customerPhone,
        email: request.customerEmail,
        issue: request.issue,
        location: {
          latitude: customerLat,
          longitude: customerLng
        },
        distance: (Math.round(distance * 10) / 10).toFixed(1)
      });
    }

    console.log("✅ Final response:", response);

    res.json(response);

  } catch (err) {
    console.error("❌ ERROR:", err);   // 🔥 VERY IMPORTANT
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.skipRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const fixpertId = req.fixpert.mechanicId; // comes from middleware

    await ServiceRequest.findByIdAndUpdate(
      requestId,
      {
        $addToSet: { skippedBy: fixpertId }
      }
    );

    console.log(`⏭ ${fixpertId} skipped ${requestId}`);

    res.json({ message: "Skipped successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error skipping request" });
  }
};

/*exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const fixpertId = req.fixpert.mechanicId;

    await ServiceRequest.findByIdAndUpdate(
      requestId,
      {
        isAccepted: true,
        acceptedBy: fixpertId,
        fixpertId: fixpertId
      }
    );

    console.log(`✅ ${fixpertId} accepted ${requestId}`);

    res.json({ message: "Accepted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error accepting request" });
  }
}; */

exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const fixpertId = req.fixpert.mechanicId;

    const request = await ServiceRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // 🔥 GET FIXPERT LOCATION
    const fixpert = await Fixpert.findOne({ mechanicId: fixpertId });

    if (!fixpert) {
      return res.status(404).json({ message: "Fixpert not found" });
    }

    request.isAccepted = true;
    request.acceptedBy = fixpert._id;
    request.fixpertId = fixpertId;
    await request.save();

    const [fixLng, fixLat] = fixpert.location.coordinates;
    const customerLat = request.location.coordinates[1];
    const customerLng = request.location.coordinates[0];

    // 🔥 CALCULATE DISTANCE AGAIN (IMPORTANT)
    const distance = await getRouteDistance(
      fixLat,
      fixLng,
      customerLat,
      customerLng
    );

    const finalDistance = (Math.round(distance * 10) / 10).toFixed(1);

    console.log("🔥 FINAL DISTANCE SENT:", finalDistance);

    // 🔥 SEND TO SOCKET (IMPORTANT)

    const customerSocket = customerSockets.get(
      request.customerEmail.toLowerCase().trim()
    );

    if (customerSocket) {
      console.log("📤 Sending to customer:", request.customerEmail);

      customerSocket.emit("fixpert-assigned", {
        assignedAt: Date.now(),

        fixpert: {
          name: fixpert.name,
          phone: fixpert.phone,
          mechanicId: fixpert.mechanicId,
          location: {
            lat: fixLat,
            lng: fixLng
          }
        },

        customerLocation: {
          lat: customerLat,
          lng: customerLng
        },

        distance: finalDistance
      });

    } else {
      console.log("❌ Customer socket NOT FOUND");
    }


    res.json({ message: "Accepted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error accepting request" });
  }
};
