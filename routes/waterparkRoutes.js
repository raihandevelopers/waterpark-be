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
const authenticateToken = require('../middleware/authMiddleware'); // Import the authentication middleware
const User = require('../models/User');

const checkAdminRole = async (req, res, next) => {
  console.log(req.user);
  const user = await User.findById(req.user.userId);
  if (user.role !== 'admin') {
      return res.status(403).json({ message: "Permission denied. Admin role required." });
  }
  console.log('Admin role verified');
  next(); // Proceed to the next route handler
};


router.post('/add-waterpark',authenticateToken,checkAdminRole, upload.array('images', 20), addWaterpark); // Allow up to 20 images
router.get('/', getAllWaterparks);
router.put('/:id', authenticateToken ,checkAdminRole,upload.array('images', 20), updateWaterpark);
router.get('/:id', getWaterpark);

// Add the delete route
router.delete('/:id', authenticateToken,checkAdminRole,deleteWaterpark);

module.exports = router;
