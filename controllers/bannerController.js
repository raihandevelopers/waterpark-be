const Banner = require('../models/banner');
const path = require('path');
const fs = require('fs');

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
    const banners = await Banner.find(); // Retrieve all documents in the collection
    const updatedBanners = banners.map((banner) => ({
      ...banner.toObject(),
      image: `${BASE_URL}/${banner.image.replace(/\\/g, '/')}`,
    }));
    res.status(200).json({ banners: updatedBanners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// Controller to delete a banner by ID
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params; // Get the banner ID from the request parameters

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    const bannerPath = path.join(__dirname, '..', banner.image); // Full path to the image file

    // Delete the banner from the database
    await Banner.findByIdAndDelete(id);

    // Remove the banner image from the server
    fs.unlink(bannerPath, (err) => {
      if (err) {
        console.error('Error deleting banner image:', err);
        return res.status(500).json({ message: 'Failed to delete banner image' });
      }

      res.status(200).json({ message: 'Banner deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


