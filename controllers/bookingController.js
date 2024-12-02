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
const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

// Create Booking with PhonePe Integration
exports.createBooking = async (req, res) => {
  const { waterpark, name, email, phone, date, adults, children, totalPrice, paymentType, waterparkName } = req.body;

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
      totalPrice,
      paymentStatus: "Pending",
      paymentType,
      bookingDate: new Date(),
    };

    if (req.user) {
      // If user is logged in, associate the booking with the user
      bookingData.user = req.user.userId;
    }

    const booking = new Booking(bookingData);

    await booking.save();

    console.log("Booking created with ID:", booking._id);


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

    // PhonePe payment integration
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: booking._id.toString(),
      merchantUserId: req.user ? req.user.userId : "guest", // Use "guest" for non-logged-in users
      amount: totalPrice * 100, // Amount in paise
      redirectUrl: `http://localhost:5000/api/bookings/verify/${booking._id}`,
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
      console.log("here",response.data);
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

    axios
      .get(statusUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          "X-MERCHANT-ID": merchantTransactionId,
          accept: "application/json",
        },
      })
      .then(async function (response) {
        console.log("response->", response.data);

        // If the payment was successful
        if (response.data && response.data.code === "PAYMENT_SUCCESS") {
          // Update booking status and payment type to 'Completed' and 'PhonePe'
          const booking = await Booking.findOne({ _id: merchantTransactionId });

          if (booking) {
            booking.paymentStatus = "Completed";
            booking.paymentType = "PhonePe";

            await booking.save(); // Save the updated booking to the database

            // Return a successful response with the updated booking
            res.status(200).json({
              success: true,
              message: "Payment successful, booking status updated.",
              booking,
            });
          } else {
            res.status(404).json({ success: false, message: "Booking not found." });
          }
        } else {
          // Handle payment failure or pending status
          res.status(400).json({
            success: false,
            message: "Payment failed or is pending.",
          });
        }
      })
      .catch(function (error) {
        console.log("error->", error);
        // Handle error and redirect to payment failure/pending status page
        res.status(500).json({ success: false, message: "Error verifying payment." });
      });
  } else {
    res.status(400).json({ success: false, message: "Invalid transaction ID." });
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
