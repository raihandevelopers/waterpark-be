const Waterpark = require('../models/waterpark');


const BASE_URL = process.env.BASE_URL;
// Add Waterpark
exports.addWaterpark = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      map,
      adultPrice,
      childPrice,
      discountedPrice,
      discountPercentage,
      advanceAmount,
      weekendPriceIncrease,
      faqs,
      included,
      excluded,
    } = req.body;

    console.log(req.body);

    // Calculate discounted prices
    const adultDiscountedPrice = adultPrice - (adultPrice * discountPercentage) / 100;
    const childDiscountedPrice = childPrice - (childPrice * discountPercentage) / 100;

    // Handle file uploads
    const images = req.files.map((file) => `${BASE_URL}/${file.path.replace(/\\/g, '/')}`);

    // Parse `faqs`, `included`, and `excluded` or default to null
    const faqsArray = faqs && faqs.trim() !== "" ? JSON.parse(faqs) : null;
    const includedArray = included && included.trim() !== "" ? JSON.parse(included) : null;
    const excludedArray = excluded && excluded.trim() !== "" ? JSON.parse(excluded) : null;

    // Validate `included` and `excluded` if present
    if (includedArray && !Array.isArray(includedArray)) {
      return res.status(400).json({ message: '`included` should be an array' });
    }

    if (excludedArray && !Array.isArray(excludedArray)) {
      return res.status(400).json({ message: '`excluded` should be an array' });
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
      discountedPrice,
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
  const {
    name,
    description,
    location,
    included,
    excluded,
    map,
    adultPrice,
    discountedPrice,
    childPrice,
    discountPercentage,
    advanceAmount,
    weekendPriceIncrease,
    // faqs,
  } = req.body;

  try {
    // Calculate discounted prices if prices and discount are provided
    const adultDiscountedPrice =
      adultPrice && discountPercentage
        ? adultPrice - (adultPrice * discountPercentage) / 100
        : undefined;

    const childDiscountedPrice =
      childPrice && discountPercentage
        ? childPrice - (childPrice * discountPercentage) / 100
        : undefined;

    // Prepare the updated data
    const updatedData = {
      name,
      description,
      location,
      included,
      excluded,
      map,
      adultPrice,
      childPrice,
      discountPercentage,
      discountedPrice,
      adultDiscountedPrice,
      childDiscountedPrice,
      advanceAmount,
      weekendPriceIncrease,
      // faqs: faqs ? JSON.parse(faqs) : undefined,
    };

    // Filter out undefined values to avoid overwriting fields with `undefined`
    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] === undefined) {
        delete updatedData[key];
      }
    });

    // Update the waterpark
    const updatedWaterpark = await Waterpark.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

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


// Delete Waterpark
exports.deleteWaterpark = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedWaterpark = await Waterpark.findByIdAndDelete(id);

    if (!deletedWaterpark) {
      return res.status(404).json({ error: "Waterpark not found" });
    }

    res.status(200).json({ message: "Waterpark deleted successfully" });
  } catch (error) {
    console.error("Error deleting waterpark:", error);
    res.status(500).json({ error: "Failed to delete waterpark" });
  }
};

