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
  item :{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'order_category'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  sellerId: {
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
  // Only for service orders
  date_approval: {
    type: Date
  },
  date_completion: {
    type: Date
  },
  paymentMethod: {
    type: String,
  },
  // Only for service orders
  customerNotes: {
    type: String,
    trim: true
  },
  // Only for product orders
  deliveryAddress: {
    type: String,
    trim: true
  },
  // Only for service orders
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