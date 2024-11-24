require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
// Import Routes
const waterparkRoutes = require('./routes/waterparkRoutes');
const faqRoutes = require('./routes/faqRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes'); // Import authentication routes

const privacyPolicyRoutes = require('./routes/privacyPolicyRoutes');
const termsRoutes = require('./routes/termsRoutes');


const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to the database
connectDB();

// Middleware
app.use(cors({
    origin: '*',
}))
app.use(bodyParser.json());

// Routes
app.use('/api/waterparks', waterparkRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes); // Add authentication routes here
app.use('/api/privacy-policy', privacyPolicyRoutes);
app.use('/api/terms', termsRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
