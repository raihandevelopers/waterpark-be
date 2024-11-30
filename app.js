require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const authenticateToken = require('./middleware/authMiddleware'); // Import the JWT middleware

// Import Routes
const waterparkRoutes = require('./routes/waterparkRoutes');
const faqRoutes = require('./routes/faqRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes'); // Import authentication routes
const privacyPolicyRoutes = require('./routes/privacyPolicyRoutes');
const termsRoutes = require('./routes/termsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to the database
connectDB();

// Middleware
app.use(cors({
    origin: '*',
}));
app.use(bodyParser.json());

// Public Routes (No JWT required)
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/privacy-policy', privacyPolicyRoutes);
app.use('/api/terms', termsRoutes);

app.use("/api/reviews", reviewRoutes);

// Protected Routes (Require JWT)
app.use('/api/waterparks', waterparkRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/bookings', authenticateToken, bookingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
