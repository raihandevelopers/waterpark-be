const Booking = require("../models/Booking");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const axios = require("axios");
const User = require("../models/User");
const { removeListener } = require("process");
const uniqid = require("uniqid");


// Email helper function
const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: Array.isArray(to) ? to.join(", ") : to, // Allow single or multiple recipients
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};


const PHONE_PE_HOST_URL = "https://api.phonepe.com/apis/hermes";

// Create Booking with PhonePe Integration
exports.createBooking = async (req, res) => {
  const { waterpark, name, email, phone, date, adults, children, advanceAmount, paymentType, waterparkName ,total} = req.body;

  try {
    // Save booking without a user ID for guest users
    const bookingData = {
      waterpark,
      waterparkName,
      name,
      email,
      phone,
      date,
      adults,
      children,
      advanceAmount,
      paymentStatus: "Pending",
      paymentType,
      bookingDate: new Date(),
      totalAmount : total
    };

    if (req.user) {
      // If user is logged in, associate the booking with the user
      bookingData.user = req.user.userId;
    }

    const booking = new Booking(bookingData);

    await booking.save();

    console.log("Booking created with ID:", booking._id);



    if (paymentType === "cash") {
      // Return booking details for cash payment
      return res.status(201).json({
        success: true,
        booking,
        message: "Booking created successfully with cash payment.",
      });
    }

    // PhonePe payment integration
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: booking._id.toString(),
      merchantUserId: req.user ? req.user.userId : "guest", // Use "guest" for non-logged-in users
      amount: advanceAmount * 100, // Amount in paise
      redirectUrl: `https://api.waterparkchalo.com/api/bookings/verify/${booking._id}`,
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

    const response = await axios.post(
      `${PHONE_PE_HOST_URL}/pg/v1/pay`,
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
      console.log("here", response.data);
      const transactionId = response.data.data.merchantTransactionId;

      // Log the transaction ID
      console.log("Transaction initiated with ID:", transactionId);
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
const { APP_BE_URL, PHONEPE_MERCHANT_ID, PHONEPE_MERCHANT_KEY, PHONEPE_SALT_INDEX } = process.env;


const sha256 = (string) => {
  return crypto.createHash('sha256').update(string).digest('hex');
};

// Verify Payment Status
exports.verifyPayment = async (req, res) => {
  const { id } = req.params;
  const merchantTransactionId = id;

  // Check the status of the payment using merchantTransactionId
  if (merchantTransactionId) {
    let statusUrl =
      `${PHONE_PE_HOST_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/` + merchantTransactionId;

    console.log("statusUrl", statusUrl);

    // Generate X-VERIFY
    let string =
      `/pg/v1/status/${PHONEPE_MERCHANT_ID}/` + merchantTransactionId + PHONEPE_MERCHANT_KEY;
    let sha256_val = sha256(string);
    let xVerifyChecksum = sha256_val + "###" + PHONEPE_SALT_INDEX;

    try {
      const response = await axios.get(statusUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
          accept: "application/json",
        },
      });

      console.log("response->", response.data);

      // If the payment was successful
      if (response.data && response.data.code === "PAYMENT_SUCCESS") {
        // Update booking status and payment type to 'Completed' and 'PhonePe'
        const booking = await Booking.findOne({ _id: merchantTransactionId });

        if (booking) {
          booking.paymentStatus = "Completed";
          booking.paymentType = "PhonePe";

          await booking.save(); // Save the updated booking to the database


          const frontendUrl = `https://waterparkchalo.com/ticket?bookingId=${booking._id}`;
          // Prepare email content
          const emailSubject = `Payment Confirmation for Booking at ${booking.waterparkName}`;
          const emailBody = `
            Dear ${booking.name},
          
            Your payment for booking at ${booking.waterparkName} has been successfully processed.
          
            Here are your booking details:
            • **Booking ID**: ${booking._id}
            • **Name**: ${booking.name}
            • **Email**: ${booking.email}
            • **Phone**: ${booking.phone}
            • **Date**: ${booking.date.toLocaleDateString()}
            • **Adults**: ${booking.adults}
            • **Children**: ${booking.children}
            • **Advance Amount**: ₹${booking.advanceAmount}
            • **Payment Status**: ${booking.paymentStatus}
            • **Payment Type**: ${booking.paymentType}
          
            **Additional Information**:
            • Please carry cash for the remaining payment.
            • Drinking is strictly prohibited in the waterpark.
            • Pickup and drop service is not included in this package.
            • In case of any dispute or misunderstanding, the waterpark holds the final decision.
            • For refund and cancellation, contact us 1 day before your check-in date.
          
            **You can view your ticket here**: [View Ticket](${frontendUrl})
          
            Thank you for choosing our service! We look forward to seeing you.
          
            Best regards,  
            **Waterpark Team**
          `;
          
          // Send confirmation email
// Send confirmation email
await sendEmail(
  [booking.email, "am542062@gmail.com"], // Add both recipients
  emailSubject,
  emailBody
);

          // Redirect user to the ticket page
          return res.redirect(frontendUrl);
        } else {
          return res.status(404).json({ success: false, message: "Booking not found." });
        }
      } else {
        // Handle payment failure or pending status
        return res.status(400).json({
          success: false,
          message: "Payment failed or is pending.",
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({ success: false, message: "Error verifying payment." });
    }
  } else {
    return res.status(400).json({ success: false, message: "Invalid transaction ID." });
  }
};
exports.getSingleBooking = async (req, res) => {
  const { id } = req.params; // Extract the booking ID from the request parameters

  console.log("Booking ID:", id);
  try {
    const booking = await Booking.findById(id); // Fetch the booking from the database

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }
    console.log("Booking found:", booking);
    res.status(200).json({
      success: true,
      message: "Booking retrieved successfully.",
      booking,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the booking.",
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
    console.log(req.user);
    const bookings = await Booking.find({ user: req.user.userId });
    const user = await User.findById(req.user.userId);
    console.log(user);
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this user.",
      });
    }

    res.status(200).json({
      success: true,
      role: user.role,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
