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
            { returnDocument: 'after' }
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
        await inquiry.save();

        res.status(201).json({
            success: true,
            message: 'Message added successfully',
            inquiry
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
// Get all inquiries for the logged-in seller
router.get('/seller/inquiries', isLoggedIn, async (req, res) => {
    try {
        const sellerId = req.user._id;

        // Find all inquiries where this user is the seller
        const inquiries = await inquiryModel.find({ sellerId })
            .sort({ createdAt: -1 })
            .populate('customerId', 'username email')
            .populate('sellerId', 'username email')
            .populate({
                path: 'item',
                select: 'title price businessId',   // only include these fields from Item
                populate: {
                    path: 'businessId',
                    select: 'title ownerName',        // only include these fields from Business
                    model: 'business'
                }
            }) // newest inquiries first

        return res.status(200).json({
            success: true,
            message: "Seller inquiries retrieved successfully",
            inquiries
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
// Get all inquiries for the logged-in customer
router.get('/customer/inquiries', isLoggedIn, async (req, res) => {
    try {
        const customerId = req.user._id;

        // Find all inquiries where this user is the customer
        const inquiries = await inquiryModel.find({ customerId })
            .sort({ createdAt: -1 })
            .populate('customerId', 'username email')
            .populate('sellerId', 'username email')
            .populate({
                path: 'item',
                select: 'title price businessId',   // only include these fields from Item
                populate: {
                    path: 'businessId',
                    select: 'title ownerName',        // only include these fields from Business
                    model: 'business'
                }
            })
            ; // newest inquiries first

        return res.status(200).json({
            success: true,
            message: "Customer inquiries retrieved successfully",
            inquiries
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
// Get all messages in a specific inquiry, sorted by date
router.get('/:inquiryId/messages', isLoggedIn, async (req, res) => {
    try {
        const { inquiryId } = req.params;

        // Find inquiry and return messages sorted by sentAt
        const inquiry = await inquiryModel.findById(inquiryId);

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: "Inquiry not found"
            });
        }

        // Sort messages so oldest at top, newest at bottom
        const sortedMessages = inquiry.messages.sort((a, b) => a.sentAt - b.sentAt);

        return res.status(200).json({
            success: true,
            message: "Messages retrieved successfully",
            messages: sortedMessages
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
module.exports = router