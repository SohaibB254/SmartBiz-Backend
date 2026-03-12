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
        // Dynamic paymentStatus setting
        if(paymentMethod === 'COD'){
            paymentStatus = 'Pending'
        }else{
            paymentStatus = "Paid"
        }
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
            paymentMethod,
            paymentStatus
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
        const user = req.user;
        // Validate status
        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        const updatedOrder = await orderModel.findOneAndUpdate(
            { customOrderId: id },
            { status },
            { returnDocument: "after" }
        );
        if(status === 'completed'){
            updatedOrder.date_completion = Date.now()
            updatedOrder.paymentStatus = "Paid"
        }
        await updatedOrder.save()

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        return res.status(200).json({
            success: true,
            message: `Order has been ${status}`,
            order: updatedOrder
        });
    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

//  View complete order details
router.get('/view/:id', isLoggedIn, async (req, res) => {
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

// Get all orders for the logged-in customer
router.get('/customer/orders', isLoggedIn, async (req, res) => {
    try {
        const customerId = req.user._id;
        const { page = 1, limit = 10, status = 'all' } = req.query;

        // Build filter dynamically
        let filter = { customerId };
        if (status !== 'all') {
            filter.status = status; // pending, completed, cancelled
        }
        const totalCount = (await orderModel.find(filter)).length
        const orders = await orderModel.find(filter)
            .sort({ createdAt: -1 }) // newest first
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('item','title price')
            .populate('customerId','username email')
            .populate('sellerId','username email')
            .populate('businessId', 'title ownerName');

        return res.status(200).json({
            success: true,
            message: "Customer orders retrieved successfully",
            totalCount,
            orders

        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Get all orders for the logged-in seller
router.get('/seller/orders', isLoggedIn, async (req, res) => {
    try {
        const sellerId = req.user._id;
        const { page = 1, limit = 10, status = 'all' } = req.query;

        let filter = { sellerId };
        if (status !== 'all') {
            filter.status = status;
        }
         const totalCount = (await orderModel.find(filter)).length
        const orders = await orderModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('item','title price')
            .populate('customerId','username email')
            .populate('sellerId','username email')
            .populate('businessId', 'title');

        return res.status(200).json({
            success: true,
            message: "Seller orders retrieved successfully",
            orders,
            totalCount
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
// Get orders by status for logged-in user (customer or seller)
router.get('/status/:status', isLoggedIn, async (req, res) => {
    try {
        const { status } = req.params; // pending, completed, cancelled, all
        const { page = 1, limit = 10, role = 'customer' } = req.query;

        // Decide whether to filter by customer or seller
        const userId = req.user._id;
        let filter = role === 'seller' ? { sellerId: userId } : { customerId: userId };

        if (status !== 'all') {
            filter.status = status;
        }

        const orders = await orderModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            message: `Orders with status '${status}' retrieved successfully`,
            orders
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
// Get orders sorted by date for logged-in user
router.get('/sorted', isLoggedIn, async (req, res) => {
    try {
        const { page = 1, limit = 10, role = 'customer', status = 'all' } = req.query;

        const userId = req.user._id;
        let filter = role === 'seller' ? { sellerId: userId } : { customerId: userId };

        if (status !== 'all') {
            filter.status = status;
        }

        const orders = await orderModel.find(filter)
            .sort({ createdAt: -1 }) // newest first
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            message: "Orders retrieved and sorted by date",
            orders
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;