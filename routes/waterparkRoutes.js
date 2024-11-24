const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const { addWaterpark, getAllWaterparks,updateWaterpark ,getWaterpark } = require('../controllers/waterparkController');

router.post('/add-waterpark', upload.array('images', 20), addWaterpark); // Allow up to 10 images
router.get('/', getAllWaterparks);
router.put('/:id',upload.array('images', 20), updateWaterpark);
router.get('/:id', getWaterpark);
module.exports = router;
