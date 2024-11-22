const express = require('express');
const router = express.Router();
const {
    getPrivacyPolicy,
    updatePrivacyPolicy
} = require('../controllers/privacyPolicyController');

// Route to get the Privacy Policy
router.get('/', getPrivacyPolicy);

// Route to update the Privacy Policy
router.put('/', updatePrivacyPolicy);

module.exports = router;
