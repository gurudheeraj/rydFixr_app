const Customer = require('../models/Customer'); // Adjust the path as needed

const getProfile = async (req, res) => {
  try {
    const { email } = req.user; // Extract email from JWT (authenticated)
    
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Send profile data (excluding password)
    return res.status(200).json({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      // don't send password for security
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    return res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

module.exports = { getProfile };
