const mongoose = require("mongoose");


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.log("Database Error:", error.message, "- retrying in 5s");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
