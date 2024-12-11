const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'main', // To identify the banner type
  },
});

module.exports = mongoose.model('Banner', bannerSchema);
