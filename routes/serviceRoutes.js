const express = require("express");
const serviceModel = require('../models/serviceModel')
const businessModel = require("../models/businessModel");
const isLoggedIn = require("../middlewares/isLoggedIn");
const upload = require("../config/multerConfig");
const router = express.Router();
const fs = require('fs')
const path = require('path')

// Add a new service
router.post("/add", isLoggedIn,
  (req, res, next) => {
    req.uploadType = "service"
    next()
  },
  upload.single("image"), async (req, res) => {

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

    const imagePath = req.file ? `uploads/services/${req.file.filename}` : null;

    // Body data
    const { title, price, description } = req.body




    try {
      const service = await serviceModel.create({
        title,
        price,
        description,
        sellerId: seller._id,
        businessId: foundBusiness._id,
        image: imagePath
      });

      res.status(201).json({
        sucess: true,
        message: "Service added sucessfully",
        service
      });
    } catch (err) {

      res.status(400).json({
        sucess: false,
        message: "Internal server error",

      });
    }
  });

// Update a service
router.put("/:id/edit", isLoggedIn,(req, res, next) => { req.uploadType = 'service', next() }, upload.single("image"), async (req, res) => {

  const { id } = req.params

  const seller = req.user
  try {
    // finding the service
    const foundservice = await serviceModel.findById(id)
    if (!foundservice) {
      return res.status(404).json({
        sucess: false,
        message: "service not found"
      })
    };
    // Authorizing the user
    if (foundservice.sellerId.toString() !== seller._id.toString()) {
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
         // Automatically deleting old images for memory saving
                if (req.file) {
                    const oldImagePath = foundBusiness.image;

                    // Delete old image if it exists
                    if (oldImagePath) {
                        const fullPath = path.join(process.cwd(), "uploads/services", path.basename(oldImagePath));
                        fs.unlink(fullPath, (err) => {
                            if (err) {
                                console.error("Error deleting old image:", err);
                            } else {
                                console.log("Old image deleted");
                            }
                        });
                    }
                }
    if (req.file) updates.image = `uploads/services/${req.file.filename}`;

    const service = await serviceModel.findByIdAndUpdate(id, updates, { returnDocument: 'after' });

    res.status(200).json({
      success: true,
      message: "service updated successfully",
      service
    });
  } catch (err) {

    res.status(400).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Change service view status (isActive toggle)
router.patch("/:id/:status",isLoggedIn, async (req, res) => {
  // Destructuring data from params
    const { id, status } = req.params

    // Getting the user
    const seller = req.user
  try {
    // finding the service
    const service = await serviceModel.findById(id);
    if (!service) return res.status(404).json({ error: "service not found" });


    // Authorizing the user
    if(service.sellerId.toString() !== seller._id.toString() ){
    return res.status(404).json({
        success: false,
        message: "Unauthorized action"
       });
    }

    if(status=="deactivate"){
      service.isActive = false ;
    }else{
      service.isActive = true ;
    }

    await service.save();

    res.json({
      success: true,
      message: "Status updated successfully",
       service });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Internal server error"
     });
  }
});

//  Get a service publicly
router.get("/:id/view", isLoggedIn, async (req, res) => {
  try {
    const service = await serviceModel.findById(req.params.id)
    .populate("businessId",'title description ownerName customId isActive')
    .populate('sellerId', 'username email')
    if (!service) return res.status(404).json({
      success: false,
       message: "service not found"
       });
       // Returning the service
    res.status(200).json({
      success: true,
      item: service,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: " Internal server error",
     });
  }
});
// Get all services for a specific business by customId
router.get('/:customId/view-all', async (req, res) => {
  try {
    const { customId } = req.params;

    // Find the business by customId
    const business = await businessModel.findOne({ customId });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    // Find all services belonging to this business
    const services = await serviceModel.find({ businessId: business._id })
      .populate("businessId", "title description ownerName customId isActive")
      .populate("sellerId", "username email");

    if (!services || services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No services found for this business"
      });
    }

    return res.status(200).json({
      success: true,
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


module.exports = router;