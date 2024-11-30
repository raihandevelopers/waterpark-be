const Booking = require("../models/Booking");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const axios = require("axios");


// Email helper function
const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
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

// Create Booking with PhonePe Integration
exports.createBooking = async (req, res) => {
  const { waterpark, name, email, phone, date, adults, children, totalPrice, paymentType, waterparkName } = req.body;

  try {
    // Save booking with the authenticated user's ID
    const booking = new Booking({
      user: req.user.userId, // Use only the userId from JWT
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

    // Send a confirmation email
    const emailSubject = `Booking Confirmation for ${waterpark}`;
    const emailBody =
      paymentType === "cash"
        ? `Dear ${name},\n\nYour booking at ${waterpark} has been confirmed. Payment will be collected at the venue.\nBooking ID: ${booking._id}\n\nThank you!`
        : `Dear ${name},\n\nYour booking at ${waterpark} has been confirmed. Payment is pending. Please complete the payment online.\nBooking ID: ${booking._id}\n\nThank you!`;

    await sendEmail(email, emailSubject, emailBody);

    if (paymentType === "cash") {
      // Return booking details for cash payment
      return res.status(201).json({
        success: true,
        booking,
        message: "Booking created successfully with cash payment.",
      });
    }

    // PhonePe payment payload
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: booking._id.toString(),
      merchantUserId: req.user, // Use userId from JWT
      amount: totalPrice * 100, // Amount in paise
      redirectUrl: `${process.env.APP_BE_URL}/payment/validate/${booking._id}`,
      redirectMode: "REDIRECT",
      mobileNumber: phone,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Generate checksum
    const payloadString = JSON.stringify(payload);
    const checksumString =
      Buffer.from(payloadString).toString("base64") +
      "/pg/v1/pay" +
      process.env.PHONEPE_MERCHANT_KEY;
    const checksum =
      crypto
        .createHash("sha256")
        .update(checksumString)
        .digest("hex") +
      "###" +
      process.env.PHONEPE_SALT_INDEX;

    // Make a request to PhonePe
    const response = await axios.post(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/pay`,
      { request: Buffer.from(payloadString).toString("base64") },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          accept: "application/json",
        },
      }
    );

    if (response.data.success) {
      // Redirect the user to PhonePe payment URL
      res.status(200).json({
        success: true,
        paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
        booking,
      });
    } else {
      throw new Error(response.data.message || "Payment initiation failed.");
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating booking.",
      error: error.message,
    });
  }
};

// Verify Payment Status
exports.verifyPayment = async (req, res) => {
  const { transactionId, bookingId } = req.body;

  try {
    // Payload for PhonePe verification
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      transactionId,
    };

    // Generate checksum
    const checksum = crypto
      .createHmac("sha256", process.env.PHONEPE_MERCHANT_KEY)
      .update(JSON.stringify(payload))
      .digest("base64");

    // Call PhonePe status API
    const response = await axios.post(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/status`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
      }
    );

    if (response.data.success && response.data.data.status === "SUCCESS") {
      // Update booking status
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
        message: "Payment verified and booking updated.",
        booking,
      });
    } else {
      throw new Error("Payment verification failed.");
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error verifying payment.",
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

// Fetch User's Bookings
exports.getUserBookings = async (req, res) => {
  try {
    // Find bookings for the authenticated user
    const bookings = await Booking.find({ user: req.user });

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this user.",
      });
    }

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
