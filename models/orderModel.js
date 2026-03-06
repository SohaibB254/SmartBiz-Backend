const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customOrderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'business'
  },
  order_category: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  date_placed: {
    type: Date,
    default: Date.now
  },
  date_approval: {
    type: Date
  },
  date_completion: {
    type: Date
  },
  paymentMethod: {
    type: String,
    required: true
  },
  customerNotes: {
    type: String,
    trim: true
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  upload_files: [
    {
      type: String,
      trim: true
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('order', orderSchema);