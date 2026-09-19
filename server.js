import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// Middleware
// =====================================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =====================================================
// Nodemailer
// =====================================================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// =====================================================
// Simple webpage
// =====================================================

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">

  <title>Send Email</title>

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      font-family: Arial, sans-serif;
    }

    .box {
      width: 100%;
      max-width: 420px;
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    }

    h2 {
      margin-top: 0;
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 7px;
      font-size: 14px;
      font-weight: 600;
    }

    input,
    textarea {
      width: 100%;
      padding: 11px;
      margin-bottom: 16px;
      border: 1px solid #d1d5db;
      border-radius: 7px;
      font-size: 14px;
      outline: none;
    }

    textarea {
      min-height: 140px;
      resize: vertical;
    }

    input:focus,
    textarea:focus {
      border-color: #2563eb;
    }

    button {
      width: 100%;
      padding: 12px;
      border: 0;
      border-radius: 7px;
      background: #2563eb;
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }

    button:hover {
      background: #1d4ed8;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    #status {
      margin-top: 15px;
      font-size: 14px;
    }

    .success {
      color: #15803d;
    }

    .error {
      color: #dc2626;
    }
  </style>
</head>

<body>

  <div class="box">

    <h2>Send Email</h2>

    <form id="emailForm">

      <label>Email</label>

      <input
        type="email"
        id="email"
        placeholder="client@example.com"
        required
      >

      <label>Message</label>

      <textarea
        id="message"
        placeholder="Write your message..."
        required
      ></textarea>

      <button
        type="submit"
        id="sendButton"
      >
        Send Email
      </button>

    </form>

    <div id="status"></div>

  </div>

<script>
  const form =
    document.getElementById("emailForm");

  const email =
    document.getElementById("email");

  const message =
    document.getElementById("message");

  const button =
    document.getElementById("sendButton");

  const status =
    document.getElementById("status");

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    button.disabled = true;
    button.textContent = "Sending...";

    status.textContent = "";
    status.className = "";

    try {

      const response = await fetch("/send-email", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email: email.value,
          message: message.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to send email"
        );
      }

      status.textContent =
        "Email sent successfully.";

      status.className = "success";

      message.value = "";

    } catch (error) {

      status.textContent =
        error.message;

      status.className = "error";

    } finally {

      button.disabled = false;
      button.textContent = "Send Email";

    }

  });
</script>

</body>
</html>
  `);
});

// =====================================================
// Send email
// =====================================================

app.post("/send-email", async (req, res) => {

  try {

    const email =
      String(req.body.email || "").trim();

    const message =
      String(req.body.message || "").trim();

    if (!email) {
      return res.status(400).json({
        message: "Email is required."
      });
    }

    if (!message) {
      return res.status(400).json({
        message: "Message is required."
      });
    }

    await transporter.sendMail({

      from:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER,

      to: email,

      subject: "Test Email",

      text: message,

      html: `
        <div style="font-family:Arial,sans-serif;">
          <p>${message.replace(/\n/g, "<br>")}</p>
        </div>
      `
    });

    console.log(
      "[mailer] Email sent to:",
      email
    );

    res.json({
      success: true,
      message: "Email sent successfully."
    });

  } catch (error) {

    console.error(
      "[mailer] Failed:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to send email."
    });

  }

});

// =====================================================
// SMTP test
// =====================================================

app.get("/smtp-test", async (req, res) => {

  try {

    await transporter.verify();

    res.json({
      success: true,
      message: "SMTP connection is working."
    });

  } catch (error) {

    console.error(
      "[smtp-test]",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

// =====================================================
// Start server
// =====================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Server running on port ${PORT}`
    );
  }
);