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
      items: products
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
      items: services
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
// Unified search for services and products
router.get('/search', async (req, res) => {
  try {
    const { title, businessName } = req.query;

    // Build dynamic filter for title
    let filter = {};
    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }

    // Query services
    let servicesQuery = serviceModel.find(filter)
      .populate("businessId", "title description ownerName customId")
      .populate("sellerId", "username email");

    // Query products
    let productsQuery = productModel.find(filter)
      .populate("businessId", "title description ownerName customId")
      .populate("sellerId", "username email");

    // Run both queries in parallel
    let [services, products] = await Promise.all([servicesQuery, productsQuery]);

    // If businessName is provided, include items that match either title OR businessName
    if (businessName) {
      const lowerName = businessName.toLowerCase();

      services = services.filter(s =>
        (title && s.title?.toLowerCase().includes(title.toLowerCase())) ||
        s.businessId?.title?.toLowerCase().includes(lowerName)
      );

      products = products.filter(p =>
        (title && p.title?.toLowerCase().includes(title.toLowerCase())) ||
        p.businessId?.title?.toLowerCase().includes(lowerName)
      );
    }

    // Combine results
    const results = [...services, ...products];

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No services or products found matching search criteria"
      });
    }

    return res.status(200).json({
      success: true,
      items: results
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