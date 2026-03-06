const mongoose = require('mongoose')

const businessSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    businessType: {
        type: String,
        required: true
    },
    customId: {
        type: String,
        unique: true,
        required: true,
        sparse: true
    },
    ownerName: {
        type: String,
        require: true
    },
    description: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    image: String,
    // For future use
    rating: {
        type: Number,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
})

module.exports = mongoose.model('business', businessSchema)