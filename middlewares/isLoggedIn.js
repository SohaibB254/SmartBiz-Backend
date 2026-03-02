const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')
let JWT_SECRET = process.env.JWT_SECRET
module.exports = async (req, res, next) => {

   try {
     let token = req.cookies.token ||
      (req.headers.authorization &&
        req.headers.authorization.split(" ")[1]);

     if (!token) {
         return res.status(500).json({
             success: false,
             message: "Please login first",
         })
     }
     let decodedData = jwt.verify(token, JWT_SECRET)
     let user = await userModel
         .findOne({ email: decodedData })
         .select('-password')
       req.user = user

     if (!decodedData) {
         return res.status(500).json({
             success: false,
             message: "Please login first"
         })
     }
     next()
   } catch (error) {
    console.error(error)
    return res.status(500).json({
        sucess: false,
        message: "Internal server error"
    })
   }
}