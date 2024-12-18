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
const emailRoutes = require("./routes/emailRoutes");
const bannerRoutes = require('./routes/bannerRoutes');


const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to the database
connectDB();

// Middleware
app.use(cors({
    origin: ['https://waterparkchalo.com','https://waterparkchalo.netlify.app', 'http://localhost:5173','https://waterparkfinall.vercel.app'], // Replace with your production frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify headers
    credentials: true
}));

app.use(bodyParser.json());

// Public Routes (No JWT required)
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/privacy-policy', privacyPolicyRoutes);
app.use('/api/terms', termsRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api", emailRoutes);

app.use('/api/banners', bannerRoutes);


// Protected Routes (Require JWT)
app.use('/api/waterparks', waterparkRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
