const Fixpert = require('../models/Fixpert'); // Adjust the path as needed

const getProfile = async (req, res) => {
  try {
    const { email } = req.user; // Extract email from JWT (authenticated)
    
    const fixpert = await Fixpert.findOne({ email });
    if (!fixpert) {
      return res.status(404).json({ message: 'Fixpert not found' });
    }
    
    // Send profile data (excluding password)
    return res.status(200).json({
      name: fixpert.name,
      email: fixpert.email,
      phone: fixpert.phone,
      mechanicId:   fixpert.mechanicId
      // don't send password for security
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    return res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

module.exports = { getProfile };
