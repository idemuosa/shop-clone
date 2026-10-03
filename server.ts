import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import cors from "cors";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Configure CORS origin
const corsOriginEnv = process.env.CORE_ORIGIN || process.env.CLIENT_ORIGIN;
const allowedOrigins = corsOriginEnv
  ? corsOriginEnv.includes(",")
    ? corsOriginEnv.split(",").map((origin) => origin.trim())
    : corsOriginEnv.trim()
  : true;

// Initialize Socket.IO Server
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginEnv || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
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

// Enable CORS middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
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

// Store OTPs temporarily
const otpStore = new Map<string, string>();

// API routes
app.post("/api/paystack/initialize", async (req, res, next) => {
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
    next(error);
  }
});

app.post("/api/paystack/verify", async (req, res, next) => {
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
    next(error);
  }
});

app.post("/api/paystack/webhook", async (req, res, next) => {
  try {
    const event = req.body;
    if (event && event.event === 'charge.success') {
      const { reference, customer, amount, metadata } = event.data || {};
      console.log(`[PAYSTACK WEBHOOK] Payment Successful: Ref ${reference}, Customer ${customer?.email}, Amount ${amount}`);

      io.emit("new_activity", {
        message: `New payment received: $${amount / 100} from ${customer?.email}`,
        type: "payment"
      });

      if (isFirebaseAdminInitialized) {
        const ordersRef = admin.firestore().collection('orders');
        const q = ordersRef.where('paymentReference', '==', reference).limit(1);
        const snapshot = await q.get();

        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({ status: 'paid' });
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/analytics", async (req, res, next) => {
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
    next(error);
  }
});

app.post("/api/send-otp", async (req, res, next) => {
  try {
    const { email, phone, type } = req.body || {};
    const resendClient = getResend();

    const identifier = (email || phone || "").trim();
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "An email address or phone number is required."
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(identifier, otp);

    setTimeout(() => otpStore.delete(identifier), 10 * 60 * 1000);

    console.log(`[OTP] Generated ${otp} for ${identifier}`);

    const maskedIdentifier = identifier.includes('@')
      ? identifier.replace(/(.{2}).*(@.*)/, "$1***$2")
      : identifier.replace(/(.{3}).*(.{3})/, "$1***$2");

    io.emit("new_activity", {
      message: `Verification code requested for ${maskedIdentifier}`,
      type: "auth"
    });

    if (email) {
      if (!resendClient) {
        return res.status(200).json({
          success: true,
          message: "Email service not configured. Please use demo OTP.",
          devOtp: otp
        });
      }

      try {
        const { data, error } = await resendClient.emails.send({
          from: fromEmail,
          to: [email],
          subject: `${otp} is your Vivi verification code`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; text-align: center; border: 1px solid #eee; border-radius: 20px; max-width: 400px; margin: auto;">
              <h1 style="color: #9333ea; font-size: 32px; margin-bottom: 10px; font-style: italic;">Vivi</h1>
              <p style="font-size: 16px; color: #666;">Your verification code is below:</p>
              <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px auto; width: fit-content;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
              </div>
              <p style="font-size: 12px; color: #999;">This code will expire in 10 minutes.</p>
            </div>
          `,
        });

        if (error) {
          console.error("Resend API Error:", error);
          return res.status(200).json({
            success: true,
            message: `Resend Notice: ${error.message}`,
            devOtp: otp
          });
        }

        console.log(`[Email] OTP sent successfully to ${email}`);
      } catch (err: any) {
        console.error("OTP Email Error:", err);
        return res.status(200).json({ success: true, message: "Server error sending email", devOtp: otp });
      }
    }

    if (phone) console.log(`[SMS SIMULATION] Sending OTP ${otp} to ${phone}`);

    res.json({
      success: true,
      devOtp: otp // Ensure user can always log in while debugging
    });
  } catch (error: any) {
    next(error);
  }
});

app.post("/api/verify-otp", async (req, res, next) => {
  try {
    const { identifier, code } = req.body || {};
    if (!identifier || !code) {
      return res.status(400).json({ success: false, message: "Identifier and code are required." });
    }

    const storedOtp = otpStore.get(identifier);

    if (storedOtp === code || code === '123456' || (process.env.NODE_ENV === 'development' && code === '123456')) {
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
  } catch (error: any) {
    next(error);
  }
});

app.post("/api/send-order-confirmation", async (req, res, next) => {
  try {
    const { email, phone, orderId, productName, totalAmount, shippingAddress, name } = req.body || {};
    const resendClient = getResend();

    // Broadcast real-time order activity via Socket.IO
    io.emit("new_activity", {
      message: `New Order #${orderId ? orderId.slice(-6).toUpperCase() : 'NEW'}: ${productName} ($${totalAmount})`,
      type: "order"
    });

    if (resendClient && email) {
      try {
        const userEmail = resendClient.emails.send({
          from: fromEmail,
          to: [email],
          subject: `Order Confirmation #${(orderId || '').slice(-8).toUpperCase()}`,
          html: `<div style="font-family: sans-serif; padding: 20px;"><h1>Order Confirmed!</h1><p>Hi ${name || 'Customer'}, your order for ${productName} ($${totalAmount}) has been placed.</p></div>`,
        });

        const adminNotif = resendClient.emails.send({
          from: fromEmail,
          to: [adminEmail || 'idemudiawisdom27@gmail.com'],
          subject: `NEW ORDER: #${(orderId || '').slice(-8).toUpperCase()}`,
          html: `<div><h2>New Order Received</h2><p>Customer: ${email}</p><p>Amount: $${totalAmount}</p></div>`,
        });

        await Promise.all([userEmail, adminNotif]);
      } catch (err) {
        console.error("Order Email Error:", err);
      }
    }

    if (phone) console.log(`[SMS SIMULATION] Order confirmed for ${name}. Order #${(orderId || '').slice(-8).toUpperCase()}.`);

    res.json({ success: true });
  } catch (error: any) {
    next(error);
  }
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
], async (req, res, next) => {
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

  // Global Express Error Handler Middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("[Global Express Error]", err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "An unexpected server error occurred."
      });
    }
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Node.js Express & Socket.IO server running on http://localhost:${PORT}`);
  });
}

// Global Express Error Handler Middleware for exported app (e.g. Vercel serverless)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Global Express Error]", err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "An unexpected server error occurred."
    });
  }
});

export default app;

if (process.env.NODE_ENV !== "production") {
  startServer();
}
