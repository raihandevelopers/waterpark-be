const Waterpark = require('../models/waterpark');

// Add Waterpark
exports.addWaterpark = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      included,
      excluded,
      map,
      price,
      discountPrice,
      advanceAmount,
      weekendPriceIncrease,
      faqs,
    } = req.body;

    // Handle file uploads
    const images = req.files.map((file) => file.path);

    // Parse FAQs
    const faqsArray = JSON.parse(faqs);

    const newWaterpark = new Waterpark({
      name,
      description,
      location,
      included: included.split(','),
      excluded: excluded.split(','),
      map,
      price,
      discountPrice,
      advanceAmount,
      weekendPriceIncrease,
      faqs: faqsArray,
      images,
    });

    await newWaterpark.save();
    res.status(201).json({ message: 'Waterpark added successfully', waterpark: newWaterpark });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add waterpark', error: error.message });
  }
};


exports.getAllWaterparks = async (req, res) => {
  try {
    const waterparks = await Waterpark.find();
    console.log(waterparks);
    res.status(200).json({
      message: 'All waterparks fetched successfully',
      waterparks,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
