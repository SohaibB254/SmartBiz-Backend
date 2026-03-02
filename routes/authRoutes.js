const userModel = require("../models/userModel");
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const userZodSchema = require("../validations/userSignupValidation");
const userLoginSchema = require('../validations/userLoginValidation')
const express = require("express");
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const { z } = require("zod")
//Signup Route
router.post('/sign-up', async (req,res)=>{
    const result = userZodSchema.safeParse(req.body)

    if(!result.success){
        return res.status(500).json(z.treeifyError(result.error))
    }
    try {
        //check if user already exist
        const existingUser = await userModel.findOne({email: result.data.email})
        if(existingUser){
            return res.status(500).json({
                success: false,
                message: "User with this email already exists"})
        }
        //Hash the password
        const hashedPassword = await bcrypt.hash(result.data.password,10)

        //Create a new user
        const newUser = await userModel.create({
            ...result.data,
            password: hashedPassword
        })
        //generate a token
        const authToken = jwt.sign(newUser.email,JWT_SECRET)
        res.cookie('token', authToken)
        return res.json({
            success: true,
            message: "Account created successfully",
            newUser,
            token: authToken
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:"Internal server error",
        })
    }
})


//Login Route...
router.post('/login', async (req,res)=>{
    const result = userLoginSchema.safeParse(req.body)

    if(!result.success){
        console.log(z.treeifyError(result.error));

        return res.status(500).json(z.treeifyError(result.error))
    }

    try {
        //Checking if user exists
        const user = await userModel.findOne({email: result.data.email})
        if(!user){
            return res.status(500).json({
                success: false,
                message:"User not found"
            })
        }
        //Checking password
        const isPasswordCorrect = await bcrypt.compare(result.data.password,user.password)
        if(!isPasswordCorrect){
            return res.status(500).json({
                success: false,
                message:"Password is incorrect"
            })
        }
        //Generating a token
        const authToken = jwt.sign(user.email,JWT_SECRET)

        res.cookie('token', authToken)
        return res.status(200).json({
            success: true,
            message:"User logged in successfully",
            user,
            token: authToken
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
})

module.exports = router