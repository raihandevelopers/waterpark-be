const express = require('express');
const { addFAQ, getAllFAQs } = require('../controllers/faqController');
const router = express.Router();

router.post('/add', addFAQ);
router.get('/', getAllFAQs);

module.exports = router;
