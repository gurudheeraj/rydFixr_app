/*const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  customerName: String,
  customerPhone: String,
  issue: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [lng, lat]
  },
  isAccepted: { type: Boolean, default: false },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Fixpert', default: null },
  createdAt: { type: Date, default: Date.now },
});

serviceRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
*/

const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: String,
  customerPhone: {
    type: String,
    select: false // 🔐 Prevents phone number from being returned by default
  },
  customerEmail: {
    type: String,
    required: true   // ✅ CRITICAL FIX
  },
  issue: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [lng, lat]
  },
  isAccepted: { type: Boolean, default: false },
  acceptedBy: { type: String, default: null },
  skippedBy: [String],
  expired: { type: Boolean, default: false }, // 🔄 Add this field to expire unaccepted requests
  createdAt: { type: Date, default: Date.now },
},{timestamps:true});

serviceRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.ServiceRequest || mongoose.model('ServiceRequest', serviceRequestSchema);
