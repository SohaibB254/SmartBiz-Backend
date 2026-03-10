const express = require("express");
const productModel = require("../models/productModel");
const businessModel = require("../models/businessModel");
const isLoggedIn = require("../middlewares/isLoggedIn");
const upload = require("../config/multerConfig");
const userModel = require("../models/userModel");
const router = express.Router();


// Add a new product
router.post("/add", isLoggedIn,
  (req, res, next) => {
    req.uploadType = "product"
    next()
  },
  upload.single("image"), async (req, res) => {

    const imagePath = req.file ? `uploads/products/${req.file.filename}` : null;

    // Body data
    const { title, price, description } = req.body

    // Getting the user / seller
    const seller = req.user

    if (seller.role !== "seller") {
      return res.status(501).json({
        success: false,
        message: "Unauthorized action",
      })
    }

    //finding the right business
    const foundBusiness = await businessModel.findOne({ owner: seller._id })
    if (!foundBusiness) {
      return res.status(501).json({
        success: false,
        message: "Unauthorized action",
      })
    }

    try {
      const product = await productModel.create({
        title,
        price,
        description,
        sellerId: seller._id,
        businessId: foundBusiness._id,
        image: imagePath
      });

      res.status(201).json({
        sucess: true,
        message: "Product added sucessfully",
        product
      });
    } catch (err) {

      res.status(400).json({
        sucess: false,
        message: "Internal server error",

      });
    }
  });

//  Update a product
router.put("/:id/edit", isLoggedIn, (req, res, next) => { req.uploadType = 'product', next() }, upload.single("image"), async (req, res) => {

  const { id } = req.params

  const seller = req.user
  try {
    // finding the product
    const foundProduct = await productModel.findById(id)
    if (!foundProduct) {
      return res.status(404).json({
        sucess: false,
        message: "Product not found"
      })
    };
    // Authorizing the user
    if (foundProduct.sellerId.toString() !== seller._id.toString()) {
      return res.status(401).json({
        sucess: false,
        message: "Unauthorized action"
      })
    }
    const updates = {
      title: req.body.title,
      price: req.body.price,
      description: req.body.description,
    };
    if (req.file) updates.image = `uploads/products/${req.file.filename}`;

    const product = await productModel.findByIdAndUpdate(id, updates, { returnDocument: 'after' });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product
    });
  } catch (err) {

    res.status(400).json({
      success: false,
      message: "Internal server error",
      err: err.message
    });
  }
});

// Change product view status (isActive toggle)
router.patch("/:id/:status", isLoggedIn, async (req, res) => {
  // Destructuring data from params
  const { id, status } = req.params

  // Getting the user
  const seller = req.user
  try {
    // finding the product
    const product = await productModel.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });


    // Authorizing the user
    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(404).json({
        success: false,
        message: "Unauthorized action"
      });
    }

    if (status == "deactivate") {
      product.isActive = false;
    } else {
      product.isActive = true;
    }

    await product.save();

    res.json({
      success: true,
      message: "Status updated successfully",
      product
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Internal server error"
    });
  }
});

//  Get a product publicly
router.get("/:id/view", isLoggedIn, async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id)
      .populate("businessId", 'title ownerName description customId isActive')
      .populate("sellerId", "username email ")
    if (!product) return res.status(404).json({
      success: false,
      message: "Product not found"
    });

    // Returning the product
    res.status(200).json({
      success: true,
      item: product,
    });
  } catch (err) {

    res.status(400).json({
      success: false,
      message: " Internal server error"
    });
  }
});
// Get all products for a specific business by customId
router.get('/:customId/view-all', async (req, res) => {
  try {
    const { customId } = req.params;

    // Find all products belonging to this business
    const products = await productModel.find({ businessId: await businessModel.findOne({ customId }).then(b => b?._id) })
      .populate("businessId", "title ownerName description customId isActive")
      .populate("sellerId", "username email");

    if (!products || products.length === 0) {
      // 404 Not Found → no products for this business
      return res.status(404).json({
        success: false,
        message: "No products found for this business"
      });
    }

    // 200 OK → return array of products
    return res.status(200).json({
      success: true,
      items: products
    });

  } catch (err) {
    console.error(err);
    // 500 Internal Server Error
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;