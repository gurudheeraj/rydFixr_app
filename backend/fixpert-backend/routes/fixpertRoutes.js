


const express = require('express');
const router = express.Router();
const fixpertController = require('../controllers/fixpertController');
const {verifyFixpert,authenticateJWT} = require('../middleware/authenticateFixpert');
const { getProfile } = require('../controllers/profile');
const { skipRequest } = require("../controllers/fixpertController");
const { acceptRequest } = require("../controllers/fixpertController");

// Register Fixpert (email and phone only)
router.post('/register', fixpertController.registerFixpert);

// Verify OTP (after which ID & password is generated and sent)
router.post('/verify-otp', fixpertController.verifyOTP);

// Resend OTP
router.post('/otp', fixpertController.generateOTP);

// Login using Fixpert ID and password
router.post('/login', fixpertController.loginFixpert);

// ✅ Update Fixpert Location
router.put('/update-location', verifyFixpert, fixpertController.updateFixpertLocation);

// ✅ NEW: Get Nearby Customer Requests (within 10km)
router.post('/nearby-requests', verifyFixpert, fixpertController.getNearbyRequests);

router.get('/profile', authenticateJWT, getProfile);

router.post("/skip-request", verifyFixpert, skipRequest);

router.post("/accept-request", verifyFixpert, acceptRequest);

module.exports = router;


