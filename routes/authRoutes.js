const userModel = require("../models/userModel");
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const userZodSchema = require("../validations/userSignupValidation");
const userLoginSchema = require('../validations/userLoginValidation')
const express = require("express");
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const { z } = require("zod")
// Signup Route
router.post('/sign-up', async (req, res) => {
    const result = userZodSchema.safeParse(req.body);

    // If validation fails, return 400 (Bad Request)
    if (!result.success) {
        return res.status(400).json(z.treeifyError(result.error));
    }

    try {
        // Check if user already exists
        const existingUser = await userModel.findOne({ email: result.data.email });
        if (existingUser) {
            // Conflict: user with this email already exists
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(result.data.password, 10);

        // Create a new user record
        const newUser = await userModel.create({
            ...result.data,
            password: hashedPassword
        });

        // Generate an auth token
        const authToken = jwt.sign(newUser.email, JWT_SECRET);

        // Set token in cookie
        res.cookie('token', authToken);

        // Return 201 (Created) since a new resource was created
        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            newUser,
            token: authToken
        });
    } catch (error) {
        // Catch-all for unexpected errors
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});


// Login Route
router.post('/login', async (req, res) => {
    const result = userLoginSchema.safeParse(req.body);

    // If validation fails, return 400 (Bad Request)
    if (!result.success) {
        console.log(z.treeifyError(result.error));
        return res.status(400).json(z.treeifyError(result.error));
    }

    try {
        // Check if user exists
        const user = await userModel.findOne({ email: result.data.email });
        if (!user) {
            // 404 (Not Found) since user doesn't exist
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Verify password
        const isPasswordCorrect = await bcrypt.compare(result.data.password, user.password);
        if (!isPasswordCorrect) {
            // 401 (Unauthorized) since credentials are invalid
            return res.status(401).json({
                success: false,
                message: "Password is incorrect"
            });
        }

        // Generate auth token
        const authToken = jwt.sign(user.email, JWT_SECRET);

        // Set token in cookie
        res.cookie('token', authToken);

        // 200 (OK) since login succeeded
        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user,
            token: authToken
        });

    } catch (error) {
        // Catch-all for unexpected errors
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

module.exports = router