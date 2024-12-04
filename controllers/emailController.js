const nodemailer = require("nodemailer");

const sendTicketEmail = async (req, res) => {
  try {
    const { email, subject, ticketImage, bookingData } = req.body;

    if (!email || !subject || !ticketImage || !bookingData) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify the connection to the SMTP server
    transporter.verify((error, success) => {
      if (error) {
        console.error("SMTP Server connection failed:", error);
      } else {
        console.log("SMTP Server is ready:", success);
      }
    });

    // Prepare booking details as HTML
    const bookingDetails = `
      <h2>Booking Details</h2>
      <p><strong>Name:</strong> ${bookingData.name}</p>
      <p><strong>Email:</strong> ${bookingData.email}</p>
      <p><strong>Phone:</strong> ${bookingData.phone}</p>
      <p><strong>Waterpark Name:</strong> ${bookingData.waterparkName}</p>
      <p><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
      <p><strong>Payment ID:</strong> ${bookingData.paymentId}</p>
      <p><strong>Booking Date:</strong> ${bookingData.bookingDate}</p>
      <p><strong>Visit Date:</strong> ${bookingData.visitDate}</p>
      <p><strong>Adults:</strong> ${bookingData.adults}</p>
      <p><strong>Children:</strong> ${bookingData.children}</p>
      <p><strong>Remaining Amount:</strong> ₹${bookingData.remainingAmount}</p>
    `;

    // Email content with attachment
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: subject,
      html: `
        <p>Dear ${bookingData.name},</p>
        <p>Your waterpark ticket and booking details are attached below:</p>
        ${bookingDetails}
      `,
      attachments: [
        {
          filename: "waterpark-ticket.png",
          content: ticketImage.split("base64,")[1],
          encoding: "base64",
        },
      ],
    };

    // Send email
    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully to:", email);
      res.status(200).json({ message: "Ticket and booking details sent successfully!" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email", error: error.message });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { sendTicketEmail };
