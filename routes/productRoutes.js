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

// 2️⃣ Update a product
router.put("/:id/edit", isLoggedIn, upload.single("image"), async (req, res) => {

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

    const product = await productModel.findByIdAndUpdate(id, updates, { new: true });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product
    });
  } catch (err) {

    res.status(400).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Change product view status (isActive toggle)
router.patch("/:id/:status",isLoggedIn, async (req, res) => {
  // Destructuring data from params
    const { id, status } = req.params

    // Getting the user
    const seller = req.user
  try {
    // finding the product
    const product = await productModel.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });


    // Authorizing the user
    if(product.sellerId.toString() !== seller._id.toString() ){
    return res.status(404).json({
        success: false,
        message: "Unauthorized action"
       });
    }

    if(status=="deactivate"){
      product.isActive = false ;
    }else{
      product.isActive = true ;
    }

    await product.save();

    res.json({
      success: true,
      message: "Status updated successfully",
       product });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Internal server error"
     });
  }
});

//  Get a product publicly
router.get("/:id", isLoggedIn, async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id).populate("businessId")
    if (!product) return res.status(404).json({
      success: false,
       message: "Product not found"
       });
       // Seller information
       const seller = await userModel.findById(product.sellerId).select('-password  -wallet');
          if (!seller) return res.status(404).json({
       success: false,
       message: "Seller information not found",
       product
       });

       // Returning the product
    res.status(200).json({
      success: true,
      product,
      seller
    });
  } catch (err) {

    res.status(400).json({
      success: false,
      message: " Internal server error"
     });
  }
});

module.exports = router;