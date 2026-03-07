const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
});

const inquirySchema = new mongoose.Schema({
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
  itemType: {
    type: String,
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'itemType',
    required: true
  },
  messages: [messageSchema], // embedded for faster retrieval
  status: {
    type: String,
    enum: ['open', 'closed', 'replied'],
    default: 'open'
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  orderPlaced: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'order',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('inquiry', inquirySchema);