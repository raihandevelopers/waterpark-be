const Banner = require('../models/banner');
const path = require('path');


// Controller to upload a new banner image
exports.uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const bannerImagePath = path.join('uploads', req.file.filename);

    const bannerData = { image: bannerImagePath };

    const banner = await Banner.findOneAndUpdate(
      { type: 'main' },
      bannerData,
      { new: true, upsert: true }
    );

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
    const banner = await Banner.findOne({ type: 'main' });

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
