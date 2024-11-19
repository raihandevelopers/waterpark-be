const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error(`Error: ${error.message}`); // Short message
    console.error('Full Error Details:', error); // Complete error object
    console.error('Formatted Error Details:', JSON.stringify(error, null, 2)); // Optional: JSON formatted details
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
