const mongoose = require('mongoose')

const dbConnect = async () => {
    const uri = process.env.MONGO_URI
    try {
        await mongoose.connect(uri)
        console.log("Database connected");
    } catch (error) {
        console.log("Database not connected", error);
    }
}

module.exports = dbConnect