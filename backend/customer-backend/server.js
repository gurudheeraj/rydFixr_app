/*
// ...other requires
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const customerRoutes = require('./routes/customerRoutes');

// Initialize environment variables
dotenv.config();

// ✅ Middleware (should come before routes)
app.use(cors());
app.use(express.json()); // This is the key line for parsing JSON

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB for Customer Portal'))
.catch((err) => console.log('❌MongoDB connection error:', err));

// ✅ Mount routes AFTER middleware
app.use('/api/customers', customerRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 customer Server running on port http://localhost:${PORT}`);
});
*/

// ...other requires
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const customerRoutes = require('./routes/customerRoutes');

// Initialize environment variabl

// ✅ Middleware (should come before routes)
app.use(cors());
app.use(express.json()); // This is the key line for parsing JSON
app.use('/api', customerRoutes);

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB for Customer Portal'))
.catch((err) => console.log('❌MongoDB connection error:', err));

// ✅ Mount routes AFTER middleware
app.use('/api/customers', customerRoutes);

// ✅ Serve static frontend files (for development & production)
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// ✅ Serve the specific customer dashboard
app.get('/customer-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/public/customer-portal/customer-dashboard.html'));
});


// ✅ Production mode: Serve index.html for unknown routes (optional)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Customer Server running on http://localhost:${PORT}`);
});


