const Waterpark = require('../models/waterpark');


const BASE_URL = process.env.BASE_URL;
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
      adultPrice,
      childPrice,
      discountPercentage,
      advanceAmount,
      weekendPriceIncrease,
      faqs,
    } = req.body;


    const adultDiscountedPrice = adultPrice - (adultPrice * discountPercentage) / 100;
    const childDiscountedPrice = childPrice - (childPrice * discountPercentage) / 100;


    // Handle file uploads
    const images = req.files.map((file) => `${BASE_URL}/${file.path.replace(/\\/g, '/')}`);

    // Parse FAQs
    const faqsArray = JSON.parse(faqs);
    if (!Array.isArray(included) || !Array.isArray(excluded)) {
      return res.status(400).json({ message: '`included` and `excluded` should be arrays' });
    }

    const newWaterpark = new Waterpark({
      name,
      description,
      location,
      included: includedArray,
      excluded: excludedArray,
      map,
      adultPrice,
      childPrice,
      discountPercentage,
      adultDiscountedPrice,
      childDiscountedPrice,
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

exports.updateWaterpark = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const updatedWaterpark = await Waterpark.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedWaterpark) {
      return res.status(404).json({ error: "Waterpark not found" });
    }

    res.status(200).json(updatedWaterpark);
  } catch (error) {
    console.error("Error updating waterpark:", error);
    res.status(500).json({ error: "Failed to update waterpark" });
  }
};
exports.getWaterpark = async (req, res) => {
  const { id } = req.params;

  try {
    const waterpark = await Waterpark.findById(id);
    if (!waterpark) {
      return res.status(404).json({ error: "Waterpark not found" });
    }
    res.status(200).json(waterpark);
  } catch (error) {
    console.error("Error fetching waterpark:", error);
    res.status(500).json({ error: "Failed to fetch waterpark" });
  }
};
