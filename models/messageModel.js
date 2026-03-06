const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  inquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'inquiry'
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('message', messageSchema);