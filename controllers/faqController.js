const FAQ = require('../models/FAQ');

// Add FAQ
exports.addFAQ = async (req, res) => {
  try {
    const faq = await FAQ.create(req.body);
    res.status(201).json(faq);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all FAQs
exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.status(200).json(faqs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
