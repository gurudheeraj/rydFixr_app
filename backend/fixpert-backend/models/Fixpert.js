const mongoose = require('mongoose');

const fixpertSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Fixpert name is required']
  },
  email: {
    type: String,
    required: [true, 'Fixpert email is required'],
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  plainPassword: {
    type: String,
    select: false
  },
  mechanicId: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    default: ""
  },
  otpExpire: {
    type: Date,
    default: ""
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]  // <- ✅ Safe default to prevent validation error
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Enable geospatial queries on location
fixpertSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Fixpert || mongoose.model('Fixpert', fixpertSchema);
