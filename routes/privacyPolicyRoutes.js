const express = require('express');
const router = express.Router();
const {
    getPrivacyPolicy,
    updatePrivacyPolicy
} = require('../controllers/privacyPolicyController');
const authenticate = require('../middleware/authMiddleware'); // Import the middleware
// Route to get the Privacy Policy
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

router.get('/', getPrivacyPolicy);

// Route to update the Privacy Policy
router.put('/', authenticate,checkAdminRole, updatePrivacyPolicy);

module.exports = router;
