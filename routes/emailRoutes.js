const express = require("express");
const { sendTicketEmail } = require("../controllers/emailController");

const router = express.Router();

// POST route to send ticket email
router.post("/send-ticket", sendTicketEmail);

module.exports = router;
