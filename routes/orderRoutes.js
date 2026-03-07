const express = require('express');
const router = express.Router();
const orderModel = require('../models/orderModel'); // adjust path as needed
const isLoggedIn = require('../middlewares/isLoggedIn'); // your auth middleware
const productModel = require('../models/productModel');
const serviceModel = require('../models/serviceModel');
const generateOrderId = require('../utils/generateOrderId');
const businessModel = require('../models/businessModel');



// 1. Create a new order route
router.post('/:id/create-order', isLoggedIn, async (req, res) => {

    // product or service id
    const { id } = req.params
    // Destructure fields from req.body
    const {
        paymentMethod,
        deliveryAddress,
        upload_files,
        customerNotes
    } = req.body;
    try {


        // finding if the item is a product or service
        const product = await productModel.findById(id);
        const service = await serviceModel.findById(id);
        if (product) {
            order_category = "product"
        } else if (service) {
            order_category = "service"
        }
        // Dynamic amount setting
        const amount = product ? product.price : service.price
        // Dynamic seller  setting
        const sellerId = product ? product.sellerId : service.sellerId
        // Dynamic item type  setting
        const item = product ? product._id : service._id
        // Dynamic BusinessId  setting
        const business = await businessModel.findOne({ owner: sellerId })
        const businessId = business._id
        // Dynamic customerId  setting
        const customer = req.user
        const customerId = customer._id
        // Genarating an order no
        const customOrderId = generateOrderId({ type: 'random', size: 6 })
        // Make sure the order No is uniqe
        const foundOrder = await orderModel.findOne({ customOrderId })
        if (foundOrder) {
            customOrderId++;
        }
        // Base order data
        let orderData = {
            customOrderId,
            amount,
            order_category,
            customerId,
            sellerId,
            businessId,
            item,
            paymentMethod
        };

        // Dynamically include fields based on category
        if (order_category === 'product') {
            orderData.deliveryAddress = deliveryAddress;
            // Skip service-only fields
        } else if (order_category === 'service') {
            orderData.upload_files = upload_files;
            orderData.customerNotes = customerNotes;
            // Skip product-only fields
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: newOrder
        });
    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            success: false,
            message: " Internal server error"
        });
    }
});

//  Approve / Complete / Cancel order route
router.patch('/:id/:status', isLoggedIn, async (req, res) => {
    try {
        const { id, status } = req.params;

        // Authorizing the user
        const seller = req.user;

        if (seller.role !== "seller") {
            return res.status(501).json({
                success: false,
                message: "Unauthorized action"
            })
        }

        // Validate status
        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const updatedOrder = await orderModel.findOneAndUpdate(
            { customOrderId: id },
            { status },
            { returnDocument: "after" }
        );

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        return res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            order: updatedOrder
        });
    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

//  View complete order details
router.get('/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;

        const order = await orderModel.findOne({ customOrderId: id })
            .populate('customerId', 'username email') // populate user fields
            .populate('sellerId', 'username email')
            .populate('businessId', 'title ownerName')
            .populate('item');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        return res.status(200).json({ order });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;