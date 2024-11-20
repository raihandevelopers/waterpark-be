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

// Create booking and Razorpay order
exports.createBooking = async (req, res) => {
  const { waterpark, name, email, phone, date, adults, children, totalPrice,paymentType,waterparkName } = req.body;
  console.log(req.body);
  try {
    // Save booking details with "Pending" payment status
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
      paymentStatus:"Pending",
      paymentType
    });

    await booking.save();
    console.log(booking);

    const emailSubject = `Booking Confirmation for ${waterpark}`;
    const emailBody = paymentType === "cash"
      ? `Dear ${name},\n\nYour booking at ${waterpark} has been confirmed. Payment will be collected at the venue.\nBooking ID: ${booking._id}\n\nThank you!`
      : `Dear ${name},\n\nYour booking at ${waterpark} has been confirmed. Payment is pending. Please complete the payment online.\nBooking ID: ${booking._id}\n\nThank you!`;

    await sendEmail(email, emailSubject, emailBody);
    if (paymentType === "cash") {
      console.log("cash");
      // If it's cash on delivery, just return the booking details
      return res.status(201).json({
        success: true,
        booking,
        message: "Booking created successfully with cash on delivery option.",
      });
    }

    // Create Razorpay order  
    const options = {
      amount: totalPrice * 100, // Razorpay requires amount in paise
      currency: "INR",
      receipt: booking._id.toString(),
    };

    const order = await razorpay.orders.create(options);

    res.status(201).json({
      success: true,
      booking,
      orderId: order.id,
      razorpayOrder: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating booking",
      error: error.message,
    });
  }
};


// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

  try {
    // Verify the Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Update the booking with payment details
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentId: razorpayPaymentId,
        paymentStatus: "Completed",
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment verified and booking updated",
      booking,
    });
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
