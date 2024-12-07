const express = require('express');
const router = express.Router();
const { signup, login, forgotPassword, resetPassword } = require('../controllers/authController');
// console.log({ signup, login, forgotPassword, resetPassword }); // This should log all imported functions


// Signup route
router.post('/signup', signup);

// Login route
router.post('/login', login);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


module.exports = router;
