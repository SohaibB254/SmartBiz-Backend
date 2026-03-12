const express = require('express')
const businessModel = require('../models/businessModel')
const router = express.Router()
const { businessZodSchema, businessUpdateZodSchema } = require('../validations/businessInputValidation')
const upload = require('../config/multerConfig')
const isLoggedIn = require('../middlewares/isLoggedIn')
const generateBusinessId = require('../utils/generateBusinessId')
const { z } = require("zod")
const userModel = require('../models/userModel')
const fs = require('fs')
const path = require('path')

// Create a new Business Profile
router.post('/create-profile', isLoggedIn,
    (req, res, next) => {
        // Setting upload type for multer
        req.uploadType = "business";
        next();
    }, upload.single('image'), async (req, res) => {

        let result = businessZodSchema.safeParse(req.body);
        // Get the logged-in user
        const owner = req.user;

        if (owner.role === 'seller') {
            return res.status(501).json({
                success: false,
                message: "You already have a business profile"
            })
        }

        // Validation failed → 400 Bad Request
        if (!result.success) {
            return res.status(400).json(z.treeifyError(result.error));
        }

        try {
            // Save uploaded image path if provided
            const imagePath = req.file ? `uploads/business/${req.file.filename}` : null;

            // Check if business with this title already exists
            const existingBusiness = await businessModel.findOne({ title: result.data.title });
            if (existingBusiness) {
                // Conflict → 409
                return res.status(409).json({
                    success: false,
                    message: "This title is taken, Please enter a unique business title"
                });
            }


            // Generate a unique 6-digit business ID
            let customId = generateBusinessId(6);

            // Ensure uniqueness of customId
            const duplicateCustomIdBusiness = await businessModel.findOne({ customId });
            if (duplicateCustomIdBusiness) {
                customId = generateBusinessId();
            }

            // Create new business profile
            const newBusiness = await businessModel.create({
                ...result.data,
                owner: owner._id,
                customId,
                image: imagePath
            });

            // Update user role to seller
            const updatedUser = await userModel.findByIdAndUpdate(owner._id, { role: 'seller' }, { returnDocument: 'after' });
            await updatedUser.save();

            // 201 Created → new resource
            return res.status(201).json({
                success: true,
                message: "Business Profile created successfully",
                newBusiness
            });

        } catch (error) {
            // 500 Internal Server Error
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

// Activate or Deactivate Business Profile
router.patch('/:businessId/:status', isLoggedIn, async (req, res) => {
    const ownerId = req.user;
    const { businessId, status } = req.params;

    try {
        // Dynamically set status
        let setStatus = status === "deactivate" ? false : true;

        // Ensure only owner can change status
        const isAuthorized = await businessModel.findOne({ owner: ownerId });
        if (!isAuthorized) {
            // 403 Forbidden
            return res.status(403).json({
                success: false,
                message: "You are not authorized for this action"
            });
        }

        // Update business status
        const updatedBusiness = await businessModel.findOneAndUpdate(
            { customId: businessId },
            { $set: { isActive: setStatus } },
            { returnDocument: 'after' }
        );

        if (!updatedBusiness) {
            // 404 Not Found
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        // 200 OK
        return res.status(200).json({
            success: true,
            message: "Status updated successfully",
            updatedBusiness
        });

    } catch (error) {
        // 500 Internal Server Error
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Update Business Profile
router.put('/:businessId/update', isLoggedIn,
    (req, res, next) => {
        // Setting upload type for multer
        req.uploadType = "business";
        next();
    }, upload.single('image'), async (req, res) => {

        const ownerId = req.user;
        const { businessId } = req.params;

        let result = businessUpdateZodSchema.safeParse(req.body);

        // Validation failed → 400 Bad Request
        if (!result.success) {
            return res.status(400).json(z.treeifyError(result.error));
        }

        try {
            // Check if business exists
            const foundBusiness = await businessModel.findOne({ customId: businessId });
            if (!foundBusiness) {
                // 404 Not Found
                return res.status(404).json({
                    success: false,
                    message: "Business not found"
                });
            }

            // Automatically deleting old images for memory saving
            if (req.file) {
                const oldImagePath = foundBusiness.image;

                // Delete old image if it exists
                if (oldImagePath) {
                    const fullPath = path.join(process.cwd(), "uploads/business/", path.basename(oldImagePath));
                    fs.unlink(fullPath, (err) => {
                        if (err) {
                            console.error("Error deleting old image:", err);
                        } else {
                            console.log("Old image deleted");
                        }
                    });
                }
            }

            // Update image only if new file uploaded
            const imagePath = req.file ? `uploads/business/${req.file.filename}` : foundBusiness.image;

            // Ensure only owner can update
            const isAuthorized = await businessModel.findOne({ owner: ownerId });
            if (!isAuthorized) {
                // 403 Forbidden
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized for this action"
                });
            }

            // Update business profile
            const updatedBusiness = await businessModel.findOneAndUpdate(
                { customId: businessId },
                { $set: { ...result.data, image: imagePath } },
                { returnDocument: 'after' }
            );

            // 200 OK
            return res.status(200).json({
                success: true,
                message: "Business Profile updated successfully",
                updatedBusiness
            });

        } catch (error) {
            console.log(error.message);

            // 500 Internal Server Error
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });
// View Business Profile by ID
router.get('/:ownerId/view', async (req, res) => {
    const { ownerId } = req.params;

    try {
        // Find business by customId
        const business = await businessModel.findOne({ owner: ownerId })
            .populate('owner', 'username email role'); // populate owner details for context

        if (!business) {
            // 404 Not Found → business doesn’t exist
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        // 200 OK → return business profile
        return res.status(200).json({
            success: true,
            message: "Business profile retrieved successfully",
            business
        });

    } catch (error) {
        console.error(error);
        // 500 Internal Server Error → unexpected issue
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
module.exports = router