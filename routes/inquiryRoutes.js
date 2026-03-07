const orderModel = require("../models/orderModel");
const userModel = require("../models/userModel");
const inquiryModel = require('../models/inquiryModel')
const express = require('express');
const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/productModel");
const serviceModel = require("../models/serviceModel");
const businessModel = require("../models/businessModel");
const generateOrderId = require("../utils/generateOrderId");
const router = express.Router()
// Create a new inquiry
router.post('/:itemId/create-inquiry', isLoggedIn, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { text } = req.body;

        // finding if the item is a product or service
        const product = await productModel.findById(itemId);
        const service = await serviceModel.findById(itemId);
        if (product) {
            itemType = "product"
        } else if (service) {
            itemType = "service"
        }

        // Dynamic seller  setting
        const sellerId = product ? product.sellerId : service.sellerId

        // Auto setting customerId
        const customerId = req.user._id;

        const inquiry = await inquiryModel.create({
            customerId,
            sellerId,
            itemType,
            item: itemId,
            messages: [{ senderId: customerId, text }]
        });


        res.status(201).json({
            success: true,
            message: 'Inquiry created successfully',
            inquiry
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Change inquiry status
router.patch('/:inquiryId/:status', isLoggedIn, async (req, res) => {
    try {
        const { inquiryId, status } = req.params;

        if (!['open', 'closed', 'replied'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const inquiry = await inquiryModel.findByIdAndUpdate(
            inquiryId,
            { status },
            { new: true }
        );

        res.json({ success: true, inquiry });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Create an order from inquiry and mark as resolved
router.post('/:inquiryId/create-order', isLoggedIn, async (req, res) => {
    try {
        const { inquiryId } = req.params;
        const { paymentMethod, deliveryAddress, upload_files,
            customerNotes } = req.body;

        const inquiry = await inquiryModel.findById(inquiryId).populate('item');
        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

  // Genarating an order no
        const customOrderId = generateOrderId({ type: 'random', size: 6 })
        // dynamic order creation
        const amount = inquiry.item.price;
        const orderData = {
            customOrderId,
            customerId: inquiry.customerId,
            sellerId: inquiry.sellerId,
            businessId: await businessModel.findOne({ owner: inquiry.sellerId }).then(b => b._id),
            order_category: inquiry.itemType,
            item: inquiry.item,
            paymentMethod,
            deliveryAddress,
            amount
        };
        // Dynamically include fields based on category
        if (inquiry.itemType === 'product') {
            orderData.deliveryAddress = deliveryAddress;
            // Skip service-only fields
        } else if (inquiry.itemType === 'service') {
            orderData.upload_files = upload_files;
            orderData.customerNotes = customerNotes;
            // Skip product-only fields
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();


        inquiry.isResolved = true;
        inquiry.orderPlaced = newOrder._id;
        await inquiry.save();

        res.status(201).json({
            success: true,
            message: 'Order created from inquiry',
            newOrder,
            inquiry
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Add a new message to an inquiry
router.post('/:inquiryId/message', isLoggedIn, async (req, res) => {
    try {
        const { inquiryId } = req.params;
        const { text } = req.body;
        const senderId = req.user._id;

        if (!text || text.trim() === '') {
            return res.status(400).json({ success: false, message: 'Message text is required' });
        }

        const inquiry = await inquiryModel.findById(inquiryId);
        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

        // Push new message into messages array
        inquiry.messages.push({ senderId, text });
        inquiry.status = 'replied'; // auto-update status when a new message is added
        await inquiry.save();

        res.status(201).json({
            success: true,
            message: 'Message added successfully',
            inquiry
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router