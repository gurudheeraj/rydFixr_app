const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  issue: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fixpert',
    default: null
  },
  skippedBy: [{ type: String }],
  expired: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

serviceRequestSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);