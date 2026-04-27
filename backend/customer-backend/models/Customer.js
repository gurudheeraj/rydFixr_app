const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  plainpassword: {
    type: String,
    select: false
  },
  otp: {
    type: String
  },
  otpCreatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
