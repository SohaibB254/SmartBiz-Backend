const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // assuming you have a User model
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or Seller model if separate
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  messages: [
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: {
        type: String,
        trim: true
      },
      sentAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
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
    ref: 'Order', // link to an Order if resolution leads to purchase
    default: null
  }
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Inquiry', inquirySchema);