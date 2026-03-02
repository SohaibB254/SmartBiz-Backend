const express = require('express')
const businessModel = require('../models/businessModel')
const router = express.Router()
const { businessZodSchema, businessUpdateZodSchema } = require('../validations/businessInputValidation')
const upload = require('../config/multerConfig')
const isLoggedIn = require('../middlewares/isLoggedIn')
const generateBusinessId = require('../utils/generateBusinessId')
const { z } = require("zod")
//Business Profile Creation Route

router.post('/create-profile', isLoggedIn,
    (req, res, next) => {
        //Setting upload type
        req.uploadType = "business"
        next()
    }, upload.single('image'), async (req, res) => {

        let result = businessZodSchema.safeParse(req.body)
        if (!result.success) {
            return res.status(500).json(z.treeifyError(result.error))
        }
        try {
            const imagePath = req.file ? `uploads/business/${req.file.filename}` : null;
            //check if business with this title already exists
            const existingBusiness = await businessModel.findOne({ title: result.data.title })
            if (existingBusiness) {
                return res.status(500).json({
                    success: false,
                    message: "This title is taken, Please enter a unique business title"
                })
            }
            // Getting the user
            const owner = req.user
            //Generating a unique 6 figure id
            const customId = generateBusinessId()
            //Create a new business

            const newBusiness = await businessModel.create({
                ...result.data,
                owner: owner._id,
                customId,
                image: imagePath
            })

            return res.status(200).json({
                success: true,
                message: "Business Profile created successfully",
                newBusiness
            })

        } catch (error) {
            console.error(error)
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            })
        }
    })

// Deactivate or activate  Business Profile route
router.patch('/:businessId/:status', isLoggedIn, async (req, res) => {

    const ownerId = req.user
    const { businessId, status } = req.params
    try {

        // Dynamically setting status with single route
        let setStatus;
        if (status == "deactivate") {
            setStatus = false
        } else {
            setStatus = true
        }
        // Make sure only owner can deactivate
        const isAuthorized = await businessModel.findOne({ owner: ownerId })
        if (!isAuthorized) {
            return res.status(400).json({
                success: false,
                message: "You are not authorized for this action"
            })
        }
        // Update business
        const updatedBusiness = await businessModel.findOneAndUpdate(
            { customId: businessId }
            , { $set: { isActive: setStatus } }
            , { returnDocument: 'after' })

        if (!updatedBusiness) {
            return res.status(400).json({
                success: false,
                message: "Business Not found"
            })
        }
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: "Internal server error"
        })

    }

})

// Update Business Profile
router.put('/:businessId/update', isLoggedIn,
    (req, res, next) => {
        //Setting upload type
        req.uploadType = "business"
        next()
    }, upload.single('image'), async (req, res) => {

        // Getting user
        const ownerId = req.user
        // Getting Business Id
        const { businessId } = req.params;

        let result = businessUpdateZodSchema.safeParse(req.body)
        if (!result.success) {
            return res.status(500).json(z.treeifyError(result.error))
        }

        try {
            //check if business  exists
            const foundBusiness = await businessModel.findOne({ customId: businessId })
            if (!foundBusiness) {
                return res.status(500).json({
                    success: false,
                    message: "Busines not found"
                })
            }


            //Update the image only if there is a change
            const imagePath = req.file ? `uploads/business/${req.file.filename}` : foundBusiness.image;

            // Make sure only owner can deactivate
            const isAuthorized = await businessModel.findOne({ owner: ownerId })
            if (!isAuthorized) {
                return res.status(400).json({
                    success: false,
                    message: "You are not authorized for this action"
                })
            }


            //Update found business

            const updatedBusiness = await businessModel.findOneAndUpdate(
                { customId: businessId }
                , { $set:result.data, image: imagePath }
                , { returnDocument: 'after' }

            )

            return res.status(200).json({
                success: true,
                message: "Business Profile Updated successfully",
                updatedBusiness
            })

        } catch (error) {
            console.error(error)
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            })
        }
    })
module.exports = router