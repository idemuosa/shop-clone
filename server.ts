import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Socket.IO Server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on("ping", () => {
    socket.emit("pong");
  });

  socket.on("send_activity", (data: { message: string; type: string }) => {
    console.log(`[Socket.IO Activity] ${data.type}: ${data.message}`);
    io.emit("new_activity", data);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS manually
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Initialize Firebase Admin safely
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let isFirebaseAdminInitialized = false;

if (serviceAccountPath) {
  try {
    let serviceAccount;
    // Check if the value is a JSON string or a file path
    if (serviceAccountPath.trim().startsWith('{')) {
      serviceAccount = JSON.parse(serviceAccountPath);
    } else {
      const resolvedPath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(process.cwd(), serviceAccountPath);

      if (fs.existsSync(resolvedPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      }
    }

    if (serviceAccount && (!admin.apps || admin.apps.length === 0)) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isFirebaseAdminInitialized = true;
      console.log("Firebase Admin initialized successfully");
    }
  } catch (err: any) {
    console.error("Firebase Admin initialization error:", err.message);
  }
}

if (!isFirebaseAdminInitialized) {
  console.warn("Firebase Service Account key not found or invalid. Custom tokens will not be generated.");
}

// Initialize Resend lazily
let resend: Resend | null = null;
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: RESEND_API_KEY is not set in .env file.");
    return null;
  }
  if (!resend) {
    try {
      resend = new Resend(apiKey);
      console.log("Resend client initialized successfully");
    } catch (e: any) {
      console.error("Failed to initialize Resend:", e.message);
      return null;
    }
  }
  return resend;
};

const adminEmail = process.env.ADMIN_EMAIL;
const fromEmail = process.env.FROM_EMAIL || "Vivi Shop <onboarding@resend.dev>";
const PYTHON_API = process.env.PYTHON_API || "http://localhost:8000";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Initialize SMTP Transporter
const getSmtpTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }
  return null;
};

// Unified Email Sending function (SMTP primary, Resend fallback)
const sendEmail = async (to: string, subject: string, html: string) => {
  const smtpFrom = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || fromEmail;
  const smtpTransporter = getSmtpTransporter();

  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
      });
      console.log(`[EMAIL SENT via SMTP] To ${to}, MessageId: ${info.messageId}`);
      return { success: true, provider: "smtp" };
    } catch (smtpErr: any) {
      console.error("[SMTP Email Error]:", smtpErr.message || smtpErr);
      // Fall through to Resend
    }
  }

  const resendClient = getResend();
  if (resendClient) {
    try {
      const { data, error } = await resendClient.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error("[Resend Email Error]:", error);
        return { success: false, provider: "resend", error: error.message };
      }
      console.log(`[EMAIL SENT via Resend] To ${to}`);
      return { success: true, provider: "resend" };
    } catch (resendErr: any) {
      console.error("[Resend Email Exception]:", resendErr);
      return { success: false, provider: "resend", error: resendErr.message };
    }
  }

  console.log(`[EMAIL SKIPPED - No Provider] To: ${to}, Subject: ${subject}`);
  return { success: false, provider: "none", error: "No email provider configured" };
};

// Store OTPs temporarily
const otpStore = new Map<string, string>();

// API routes
app.post("/api/paystack/initialize", async (req, res) => {
  const { email, amount } = req.body;

  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ status: false, message: "Paystack secret key not configured" });
  }

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to kobo/cents
        callback_url: `${process.env.APP_URL || 'http://localhost:5173'}/checkout/verify`,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/api/paystack/verify", async (req, res) => {
  const { reference } = req.body;

  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ status: false, message: "Paystack secret key not configured" });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();
    if (data.status && data.data?.status === "success") {
      io.emit("new_activity", {
        message: `Payment verified for transaction ${reference}`,
        type: "payment"
      });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/api/paystack/webhook", async (req, res) => {
  const event = req.body;
  if (event.event === 'charge.success') {
    const { reference, customer, amount, metadata } = event.data;
    console.log(`[PAYSTACK WEBHOOK] Payment Successful: Ref ${reference}, Customer ${customer.email}, Amount ${amount}`);

    io.emit("new_activity", {
      message: `New payment received: $${amount / 100} from ${customer.email}`,
      type: "payment"
    });

    try {
      if (isFirebaseAdminInitialized) {
        const ordersRef = admin.firestore().collection('orders');
        const q = ordersRef.where('paymentReference', '==', reference).limit(1);
        const snapshot = await q.get();

        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({ status: 'paid' });
        }
      }
    } catch (e) {
      console.error("Webhook processing error:", e);
    }
  }

  res.sendStatus(200);
});

app.get("/api/admin/analytics", async (req, res) => {
  if (!isFirebaseAdminInitialized) {
    return res.status(500).json({ error: "Firebase Admin not initialized" });
  }

  try {
    const ordersSnapshot = await admin.firestore().collection('orders').get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate last 7 days sales
    const last7Days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toLocaleDateString(undefined, { weekday: 'short' });

      const dayOrders = orders.filter((o: any) => {
        const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return orderDate.toLocaleDateString(undefined, { weekday: 'short' }) === dateString;
      });

      last7Days.push({
        name: dateString,
        sales: dayOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
        orders: dayOrders.length
      });
    }

    res.json({
      chartData: last7Days,
      totalSales: orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
      totalOrders: orders.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/send-otp", async (req, res) => {
  const { email, phone, type } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const identifier = email || phone;
  otpStore.set(identifier, otp);

  setTimeout(() => otpStore.delete(identifier), 10 * 60 * 1000);

  console.log(`[OTP] Generated ${otp} for ${identifier}`);

  io.emit("new_activity", {
    message: `Verification code requested for ${identifier.replace(/(.{2}).*(@.*)/, "$1***$2")}`,
    type: "auth"
  });

  if (email) {
    const subject = `${otp} is your Vivi verification code`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; text-align: center; border: 1px solid #eee; border-radius: 20px; max-width: 400px; margin: auto;">
        <h1 style="color: #9333ea; font-size: 32px; margin-bottom: 10px; font-style: italic;">Vivi</h1>
        <p style="font-size: 16px; color: #666;">Your verification code is below:</p>
        <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px auto; width: fit-content;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #999;">This code will expire in 10 minutes.</p>
      </div>
    `;

    const emailResult = await sendEmail(email, subject, html);
    console.log(`[send-otp] Email dispatch status:`, emailResult);
  }

  if (phone) console.log(`[SMS SIMULATION] Sending OTP ${otp} to ${phone}`);

  res.json({
    success: true,
    devOtp: otp // Ensure user can always see and use verification code
  });
});

app.post("/api/send-welcome", async (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const subject = "Welcome to Vivi Shop!";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 16px;">
      <h1 style="color: #9333ea;">Welcome to Vivi, ${name || 'Explorer'}!</h1>
      <p>We're thrilled to have you join our community.</p>
      <p>Explore top products, flash sales, and exclusive digital rewards!</p>
    </div>
  `;

  await sendEmail(email, subject, html);
  if (adminEmail) {
    await sendEmail(adminEmail, "New User Registration", `<p>New user <b>${name || email}</b> (${email}) joined Vivi!</p>`);
  }

  res.json({ success: true });
});

app.post("/api/verify-otp", async (req, res) => {
  const { identifier, code } = req.body;
  const storedOtp = otpStore.get(identifier);

  if (storedOtp === code || (process.env.NODE_ENV === 'development' && code === '123456')) {
    otpStore.delete(identifier);

    let customToken = null;
    try {
      if (isFirebaseAdminInitialized) {
        let uid;
        const isEmail = identifier.includes('@');

        try {
          const userRecord = isEmail
            ? await admin.auth().getUserByEmail(identifier)
            : await admin.auth().getUserByPhoneNumber(identifier);
          uid = userRecord.uid;

          if (adminEmail && identifier === adminEmail) {
            await admin.firestore().collection('users').doc(uid).set({
              role: 'admin',
              email: identifier
            }, { merge: true });
          }
        } catch (e) {
          const userConfig: any = isEmail ? { email: identifier } : { phoneNumber: identifier };
          if (isEmail) userConfig.password = Math.random().toString(36).slice(-12);

          const userRecord = await admin.auth().createUser(userConfig);
          uid = userRecord.uid;

          await admin.firestore().collection('users').doc(uid).set({
            uid,
            email: isEmail ? identifier : '',
            phone: isEmail ? '' : identifier,
            role: (adminEmail && identifier === adminEmail) ? 'admin' : 'user',
            points: 100,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        customToken = await admin.auth().createCustomToken(uid);
      }
    } catch (tokenErr: any) {
      console.error("Token generation failed:", tokenErr.message);
    }

    return res.json({ success: true, customToken });
  }

  res.status(400).json({ success: false, message: "Invalid or expired verification code" });
});

app.post("/api/send-order-confirmation", async (req, res) => {
  const { email, phone, orderId, productName, totalAmount, shippingAddress, name } = req.body;

  const displayOrderId = orderId ? orderId.slice(-8).toUpperCase() : Math.random().toString(36).slice(-6).toUpperCase();

  // Broadcast real-time order activity via Socket.IO
  io.emit("new_activity", {
    message: `New Order #${displayOrderId}: ${productName || 'Cart Items'} ($${totalAmount || '0'})`,
    type: "order"
  });

  if (email) {
    const userSubject = `Order Confirmation #${displayOrderId}`;
    const userHtml = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 16px;">
        <h2 style="color: #16a34a;">Payment & Order Confirmed!</h2>
        <p>Hi ${name || 'Customer'}, thank you for shopping with Vivi.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 12px; margin: 16px 0;">
          <p><strong>Order ID:</strong> #${displayOrderId}</p>
          <p><strong>Item(s):</strong> ${productName || 'Order Items'}</p>
          <p><strong>Total Amount:</strong> $${totalAmount || '0'}</p>
          ${shippingAddress ? `<p><strong>Shipping Address:</strong> ${shippingAddress}</p>` : ''}
        </div>
        <p style="font-size: 12px; color: #6b7280;">If you have any questions, feel free to reply to this email.</p>
      </div>
    `;

    const adminSubject = `NEW SALE: #${displayOrderId} ($${totalAmount || '0'})`;
    const adminHtml = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>New Order Received</h2>
        <p><strong>Customer:</strong> ${name || 'Customer'} (${email})</p>
        <p><strong>Order ID:</strong> #${displayOrderId}</p>
        <p><strong>Amount:</strong> $${totalAmount || '0'}</p>
      </div>
    `;

    await sendEmail(email, userSubject, userHtml);
    if (adminEmail) {
      await sendEmail(adminEmail, adminSubject, adminHtml);
    }
  }

  if (phone) console.log(`[SMS SIMULATION] Order confirmed for ${name}. Order #${displayOrderId}.`);

  res.json({ success: true });
});

app.all([
  "/products", "/products/", "/products/*",
  "/categories", "/categories/", "/categories/*",
  "/api/cart", "/api/cart/*",
  "/api/products", "/api/products/*",
  "/api/reviews", "/api/reviews/*",
  "/api/wishlist/*",
  "/api/orders", "/api/orders/*",
  "/api/profile/*",
  "/api/merchants", "/api/merchants/*"
], async (req, res) => {
  // Ensure the path ends with a slash for FastAPI compatibility, but preserve query params
  const pathPart = req.path.endsWith('/') ? req.path : `${req.path}/`;
  const queryString = req.url.includes('?') ? `?${req.url.split('?')[1]}` : '';
  const url = `${PYTHON_API}${pathPart}${queryString}`;

  console.log(`Proxying request to: ${url}`);
  try {
    const fetchOptions: any = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.authorization ? { "Authorization": req.headers.authorization } : {})
      }
    };
    if (req.method !== "GET" && req.method !== "HEAD") fetchOptions.body = JSON.stringify(req.body);

    const response = await fetch(url, fetchOptions);
    console.log(`Proxy response from ${url}: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error(`Proxy error for ${url}:`, error.message);
    res.status(503).json({
      error: "Product Service Unavailable",
      details: "The Python backend (port 8000) might not be running.",
      url: url
    });
  }
});

async function startServer() {
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Node.js Express & Socket.IO server running on http://localhost:${PORT}`);
  });
}

export default app;

if (process.env.NODE_ENV !== "production") {
  startServer();
}
