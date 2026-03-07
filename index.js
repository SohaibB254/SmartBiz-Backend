const express = require('express')
const dbConnect = require('./config/dbConnect')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')

//Configuring Enviornment Variables
dotenv.config()

dbConnect()

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(cookieParser())

app.use('/auth',require('./routes/authRoutes'))
app.use('/business',require('./routes/businessRoutes'))
app.use('/products',require('./routes/productRoutes'))
app.use('/services',require('./routes/serviceRoutes'))
app.use('/orders', require('./routes/orderRoutes'))
app.listen(3000, (req, res) => {
    console.log("Bakend firedd...");

})