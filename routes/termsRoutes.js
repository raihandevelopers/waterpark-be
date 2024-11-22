const express = require('express');
const router = express.Router();
const {
    getTerms,
    updateTerms
} = require('../controllers/termsController');

// Route to get the Terms and Conditions
router.get('/', getTerms);

// Route to update the Terms and Conditions
router.put('/', updateTerms);

module.exports = router;
