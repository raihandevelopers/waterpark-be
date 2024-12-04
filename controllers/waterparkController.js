const Waterpark = require('../models/waterpark');
const fs = require('fs')
const path = require('path');


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
exports.deleteImage = async (req, res) => {
  const { id: waterparkId } = req.params; // Extract waterpark ID from route parameters

  const { imageUrl } = req.body; // Get `waterparkId` to identify the waterpark record

  try {
    // Extract the file name from the URL
    const fileName = imageUrl.split('/').pop(); // Extracts "1732701617681-4-1.jpg"

    // Construct the absolute file path on the server
    const filePath = path.join(__dirname, '..', 'uploads', fileName);

    console.log('Resolved file path:', filePath); // Debugging log

    // Delete the file from the server
    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).json({ error: 'Failed to delete image from server' });
      }

      console.log('File deleted successfully from server.');

      // Remove the image URL from the database
      try {
        const waterpark = await Waterpark.findById(waterparkId);
        if (!waterpark) {
          return res.status(404).json({ error: 'Waterpark not found' });
        }

        // Remove the specific image URL from the `images` array
        const updatedImages = waterpark.images.filter((img) => img !== imageUrl);

        // Update the document in the database
        waterpark.images = updatedImages;
        await waterpark.save();

        console.log('Image URL removed from database.');

        return res.status(200).json({ message: 'Image deleted successfully', images: updatedImages });
      } catch (dbError) {
        console.error('Error updating database:', dbError);
        return res.status(500).json({ error: 'Failed to update database' });
      }
    });
  } catch (error) {
    console.error('Error in delete-image endpoint:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
};
exports.addImage = async (req, res) => {
  const { id: waterparkId } = req.params; // Extract waterpark ID from route parameters
  console.log(req.body);
  try {
    // Find the waterpark by ID
    const waterpark = await Waterpark.findById(waterparkId);
    if (!waterpark) {
      return res.status(404).json({ error: 'Waterpark not found' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const imageUrl = `${BASE_URL}/${req.file.path.replace(/\\/g, '/')}`;


    // Add the new image URL to the `images` array
    waterpark.images.push(imageUrl);
    await waterpark.save();

    return res.status(200).json({ message: 'Image added successfully', images: waterpark.images });
  } catch (error) {
    console.error('Error in add-image endpoint:', error);
    return res.status(500).json({ error: 'Failed to add image' });
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

