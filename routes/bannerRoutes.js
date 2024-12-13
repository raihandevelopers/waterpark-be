const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer'); // Multer config
const bannerController = require('../controllers/bannerController');
const authenticate = require('../middleware/authMiddleware'); // Import the middleware

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



// Route for uploading banner
router.post('/upload',authenticate,checkAdminRole, upload.single('bannerImage'), bannerController.uploadBanner);

router.get('/', bannerController.getBanner);

router.delete('/:id', bannerController.deleteBanner); // This line is the new one for deleting a banner


module.exports = router;
