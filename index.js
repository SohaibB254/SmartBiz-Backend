const express = require('express')
const dbConnect = require('./config/dbConnect')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const path = require('path')

//Configuring Enviornment Variables
dotenv.config()
// Conneting database
dbConnect()

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(cookieParser())

// Serve static files from "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', require('./routes/authRoutes'))

app.use('/business', require('./routes/businessRoutes'))

app.use('/products', require('./routes/productRoutes'))

app.use('/services', require('./routes/serviceRoutes'))

app.use('/orders', require('./routes/orderRoutes'))

app.use('/inquiry', require('./routes/inquiryRoutes'))

app.use('/marketplace', require('./routes/publicMarketPlaceRoutes'))

app.listen(3000, (req, res) => {
    console.log("Bakend firedd...");

})