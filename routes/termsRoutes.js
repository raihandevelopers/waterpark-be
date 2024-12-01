const express = require('express');
const router = express.Router();
const {
    getTerms,
    updateTerms
} = require('../controllers/termsController');
const User = require('../models/User');
const authenticate = require('../middleware/authMiddleware'); // Import the middleware
// Route to get the Terms and Conditions
router.get('/', getTerms);

const checkAdminRole = async (req, res, next) => {
    console.log(req.user);
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
        return res.status(403).json({ message: "Permission denied. Admin role required." });
    }
    console.log('Admin role verified');
    next(); // Proceed to the next route handler
};


// Route to update the Terms and Conditions
router.put('/', authenticate, checkAdminRole,updateTerms);

module.exports = router;
