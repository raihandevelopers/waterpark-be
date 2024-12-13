const Banner = require('../models/banner');
const path = require('path');

const BASE_URL = 'https://api.waterparkchalo.com'; // Change this to your actual base URL

// Controller to upload a new banner image
exports.uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const bannerImagePath = path.join('uploads', req.file.filename);

    const bannerData = { image: bannerImagePath, type: 'main' }; // Keep 'type: main' if needed

    const banner = await Banner.create(bannerData); // Always create a new banner

    res.status(200).json({
      message: 'Banner uploaded successfully',
      banner,
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Controller to get the current banner
exports.getBanner = async (req, res) => {
  try {
    const banner = await Banner.find({}); // Fetch all banners

    if (!banner) {
      return res.status(404).json({ message: 'No banner found' });
    }

    // Construct the full URL for the image
    const bannerImageUrl = `${BASE_URL}/${banner.image.replace(/\\/g, '/')}`;

    res.status(200).json({ banner: { ...banner.toObject(), image: bannerImageUrl } });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
