const Booking = require("../models/Booking");
const Razorpay = require("razorpay");
const nodemailer = require('nodemailer');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

exports.createBooking = async (req, res) => {
  const { waterpark, name, email, phone, date, adults, children, totalPrice, paymentType, waterparkName } = req.body;

  try {
    // Save booking with "Pending" payment status
    const booking = new Booking({
      waterpark,
      waterparkName,
      name,
      email,
      phone,
      date,
      adults,
      children,
      totalPrice,
      paymentStatus: "Pending",
      paymentType,
      bookingDate: new Date(),
    });

    await booking.save();

    const emailSubject = `Booking Confirmation for ${waterpark}`;
    const emailBody = paymentType === "cash"
      ? `Dear ${name},\n\nYour booking at ${waterpark} has been confirmed. Payment will be collected at the venue.\nBooking ID: ${booking._id}\n\nThank you!`
      : `Dear ${name},\n\nYour booking at ${waterpark} has been confirmed. Payment is pending. Please complete the payment online.\nBooking ID: ${booking._id}\n\nThank you!`;

    await sendEmail(email, emailSubject, emailBody);

    if (paymentType === "cash") {
      // If it's cash on delivery, return booking details
      return res.status(201).json({
        success: true,
        booking,
        message: "Booking created successfully with cash on delivery option.",
      });
    }

    // Initiate PhonePe payment
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      transactionId: booking._id.toString(),
      amount: totalPrice * 100, // Amount in paise
      merchantOrderId: booking._id.toString(),
      redirectUrl: process.env.PHONEPE_CALLBACK_URL,
    };

    // Generate the checksum
    const checksum = crypto
      .createHmac("sha256", process.env.PHONEPE_MERCHANT_KEY)
      .update(JSON.stringify(payload))
      .digest("base64");

    // Send request to PhonePe API
    const response = await axios.post(`${process.env.PHONEPE_BASE_URL}/pg/v1/pay`, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
    });

    if (response.data.success) {
      return res.status(201).json({
        success: true,
        booking,
        paymentRequest: response.data,
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating booking",
      error: error.message,
    });
  }
};


exports.verifyPayment = async (req, res) => {
  const { transactionId, bookingId } = req.body;

  try {
    // Prepare payload for PhonePe payment verification
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      transactionId,
    };

    // Generate the checksum
    const checksum = crypto
      .createHmac("sha256", process.env.PHONEPE_MERCHANT_KEY)
      .update(JSON.stringify(payload))
      .digest("base64");

    // Call PhonePe payment status API
    const response = await axios.post(`${process.env.PHONEPE_BASE_URL}/pg/v1/status`, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
    });

    if (response.data.success && response.data.data.status === "SUCCESS") {
      // Update booking with payment status
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          paymentId: transactionId,
          paymentStatus: "Completed",
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified and booking updated",
        booking,
      });
    } else {
      throw new Error("Payment verification failed.");
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find(); // Fetch all bookings from the database
    res.status(200).json(bookings); // Return bookings as a JSON response
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Assuming the email is sent in the request body
exports.getUserBookings = async (req, res) => {
  const { email } = req.body;  // Get the email from the request body

  try {
    // Fetch all bookings for the specific user by email
    const bookings = await Booking.find({ email: email });  // Find bookings with the provided email

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this email.",
      });
    }

    // Return the bookings as a JSON response
    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
