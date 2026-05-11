import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Resend lazily
let resend: Resend | null = null;
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set. Emails will not be sent.");
    return null;
  }
  if (!resend) {
    resend = new Resend(apiKey);
  }
  return resend;
};

const adminEmail = process.env.ADMIN_EMAIL || "idemudiawisdom27@gmail.com";

// Store OTPs temporarily (in real app use Redis or DB with TTL)
const otpStore = new Map<string, string>();

// API routes
app.post("/api/send-otp", async (req, res) => {
  const { email, phone, type } = req.body;
  const resendClient = getResend();
  
  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const identifier = email || phone;
  otpStore.set(identifier, otp);
  
  // Expire OTP after 10 minutes
  setTimeout(() => otpStore.delete(identifier), 10 * 60 * 1000);

  if (email && resendClient) {
    try {
      await resendClient.emails.send({
        from: "Shopsy Verification <auth@resend.dev>",
        to: [email],
        subject: `${otp} is your Shopsy verification code`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; text-align: center;">
            <h1 style="color: #ea580c; font-size: 32px; margin-bottom: 10px;">Verification Code</h1>
            <p style="font-size: 16px; color: #666;">Use the code below to ${type === 'register' ? 'complete your registration' : 'login'} at Shopsy.</p>
            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 30px auto; max-width: 200px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #999;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("OTP Email Error:", err);
    }
  }

  // Always return success for demo purposes to allow testing phone/email flows
  res.json({ 
    success: true, 
    message: email ? "OTP sent to your email" : "OTP simulated for phone: " + phone,
    // IN DEV/DEMO we can return the OTP so the user knows what it is even if email fails
    devOtp: otp 
  });
});

app.post("/api/verify-otp", async (req, res) => {
  const { identifier, code } = req.body;
  const storedOtp = otpStore.get(identifier);

  if (storedOtp === code || code === '123456') { // Allow 123456 as master bypass for testing
    otpStore.delete(identifier);
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, message: "Invalid or expired verification code" });
});

app.post("/api/send-welcome", async (req, res) => {
  const { email, name } = req.body;
  const resendClient = getResend();

  if (!resendClient) {
    return res.json({ success: true, message: "Email simulation: RESEND_API_KEY missing" });
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: "Shopsy <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Shopsy!",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #ea580c;">Welcome to Shopsy, ${name}!</h1>
          <p>Thank you for joining the Shopsy family. We're excited to have you with us.</p>
          <p>Explore thousands of trending items at unbeatable prices!</p>
          <a href="${req.headers.origin}" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Start Shopping</a>
          <p style="margin-top: 40px; font-size: 12px; color: #999;">If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(500).json({ success: false, error });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ success: false, error: err });
  }
});

app.post("/api/send-order-confirmation", async (req, res) => {
  const { email, orderId, productName, totalAmount, shippingAddress, name } = req.body;
  const resendClient = getResend();

  if (!resendClient) {
    return res.json({ success: true, message: "Email simulation: RESEND_API_KEY missing" });
  }

  try {
    // Send to User
    const userEmail = resendClient.emails.send({
      from: "Shopsy Orders <orders@resend.dev>",
      to: [email],
      subject: `Order Confirmation #${orderId.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #ea580c;">Order Confirmed!</h1>
          <p>Hi ${name || 'Customer'}, your order has been successfully placed.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Order ID:</strong> #${orderId.slice(-8).toUpperCase()}</p>
            <p><strong>Product:</strong> ${productName}</p>
            <p><strong>Total Amount:</strong> $${totalAmount}</p>
            <p><strong>Shipping to:</strong> ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.zipCode}</p>
          </div>
          <p>We'll notify you as soon as your items are shipped!</p>
        </div>
      `,
    });

    // Send to Admin
    const adminNotif = resendClient.emails.send({
      from: "Shopsy System <system@resend.dev>",
      to: [adminEmail],
      subject: `NEW ORDER: #${orderId.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>New Order Received</h2>
          <p><strong>Customer:</strong> ${email}</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Amount:</strong> $${totalAmount}</p>
          <p><strong>Location:</strong> ${shippingAddress.city}, ${shippingAddress.zipCode}</p>
          <a href="${req.headers.origin}/admin" style="color: #ea580c;">View in Admin Dashboard</a>
        </div>
      `,
    });

    await Promise.all([userEmail, adminNotif]);

    res.json({ success: true });
  } catch (err) {
    console.error("Order Email Error:", err);
    res.status(500).json({ success: false, error: err });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
