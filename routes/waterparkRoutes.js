const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const { addWaterpark, getAllWaterparks  } = require('../controllers/waterparkController');

router.post('/add-waterpark', upload.array('images', 10), addWaterpark); // Allow up to 10 images
router.get('/', getAllWaterparks);

module.exports = router;
