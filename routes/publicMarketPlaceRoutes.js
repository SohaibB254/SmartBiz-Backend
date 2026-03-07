const productModel = require("../models/productModel");
const serviceModel = require("../models/serviceModel");
const express = require('express')
const router = express.Router()

// Get all products and services together (marketplace view)
router.get('/all', async (req, res) => {
  try {
    // Fetch products and services in parallel
    const [products, services] = await Promise.all([
      productModel.find()
        .populate("businessId", "title description ownerName customId")
        .populate("sellerId", "username email")
        .sort({ createdAt: -1 }),
      serviceModel.find()
        .populate("businessId", "title description ownerName customId")
        .populate("sellerId", "username email")
        .sort({ createdAt: -1 })
    ]);

    // Merge into one array and sort by date
    const combined = [...products, ...services].sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({
      success: true,
      message: "All products and services retrieved successfully",
      items: combined
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get all products (marketplace view)
router.get('/products', async (req, res) => {
  try {
    const products = await productModel.find()
      .populate("businessId", "title description ownerName customId")
      .populate("sellerId", "username email")
      .sort({ createdAt: -1 }); // newest first

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      products
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
// Get all services (marketplace view)
router.get('/services', async (req, res) => {
  try {
    const services = await serviceModel.find()
      .populate("businessId", "title description ownerName customId")
      .populate("sellerId", "username email")
      .sort({ createdAt: -1 }); // newest first

    if (!services || services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No services found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Services retrieved successfully",
      services
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router