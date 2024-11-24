const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const { 
  addWaterpark, 
  getAllWaterparks, 
  updateWaterpark, 
  getWaterpark, 
  deleteWaterpark // Import the delete controller
} = require('../controllers/waterparkController');

router.post('/add-waterpark', upload.array('images', 20), addWaterpark); // Allow up to 20 images
router.get('/', getAllWaterparks);
router.put('/:id', upload.array('images', 20), updateWaterpark);
router.get('/:id', getWaterpark);

// Add the delete route
router.delete('/:id', deleteWaterpark);

module.exports = router;
