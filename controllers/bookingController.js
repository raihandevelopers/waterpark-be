const Booking = require("../models/Booking");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create booking and Razorpay order
exports.createBooking = async (req, res) => {
  const { waterpark, name, email, phone, date, adults, children, totalPrice } = req.body;
  console.log(req.body);
  try {
    // Save booking details with "Pending" payment status
    const booking = new Booking({
      waterpark,
      name,
      email,
      phone,
      date,
      adults,
      children,
      totalPrice,
      paymentStatus: "Pending",
    });

    await booking.save();
    console.log(booking);
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
