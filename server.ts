import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { Server } from "socket.io";
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
const DEFAULT_FROM_EMAIL = "Vivi Shop <onboarding@resend.dev>";

function parseFromEmail(rawFrom?: string): string {
  if (!rawFrom) return DEFAULT_FROM_EMAIL;
  const cleaned = rawFrom.replace(/^["']|["']$/g, "").trim();
  const pattern = /^(?:([^<]+)\s*<)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?$/;
  const match = cleaned.match(pattern);
  if (match) {
    const [, name, addr] = match;
    if (name && name.trim()) {
      return `${name.trim()} <${addr}>`;
    }
    return addr;
  }
  return DEFAULT_FROM_EMAIL;
}

async function sendResendEmail(resendClient: Resend, payload: { to: string[]; subject: string; html: string }) {
  let fromEmail = parseFromEmail(process.env.FROM_EMAIL);
  let result = await resendClient.emails.send({
    from: fromEmail,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  if (result.error && fromEmail !== DEFAULT_FROM_EMAIL) {
    console.warn(`Resend failed with custom fromEmail (${fromEmail}): ${result.error.message}. Retrying with default ${DEFAULT_FROM_EMAIL}`);
    result = await resendClient.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  }

  return result;
}

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
        if (process.env.NODE_ENV !== "production") {
          console.log(`[DEV OTP SIMULATION] Email service not configured. Generated OTP for ${email}: ${otp}`);
          return res.json({
            success: true,
            message: `[DEV MODE] Verification code generated: ${otp} (Email service not configured)`
          });
        }
        return res.status(400).json({
          success: false,
          message: "Email service is not configured. Please contact system administrator."
        });
      }

      try {
        const { error } = await sendResendEmail(resendClient, {
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
          return res.status(400).json({
            success: false,
            message: `Failed to send verification email: ${error.message}`
          });
        }

        console.log(`[Email] OTP sent successfully to ${email}`);
      } catch (err: any) {
        console.error("OTP Email Error:", err);
        return res.status(500).json({ success: false, message: "Server error sending verification email." });
      }
    }

    if (phone) console.log(`[SMS SIMULATION] Sending OTP ${otp} to ${phone}`);

    res.json({
      success: true,
      message: "Verification code sent successfully."
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

    if (storedOtp && storedOtp === code) {
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

app.post("/api/send-welcome", async (req, res, next) => {
  try {
    const { email, name } = req.body || {};
    const resendClient = getResend();

    if (resendClient && email) {
      try {
        await sendResendEmail(resendClient, {
          to: [email],
          subject: "Welcome to VIVI Shop!",
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 16px;">
              <h2 style="color: #ea580c; text-align: center; margin-bottom: 20px;">Welcome to VIVI Shop</h2>
              <p style="font-size: 16px; line-height: 1.5;">Hi <strong>${name || 'Customer'}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.5; color: #555;">Thank you for registering with VIVI Shop! Your account is active and ready to go.</p>
              <p style="font-size: 14px; line-height: 1.5; color: #555;">You can now log in anytime to explore our collection, manage your wallet, and track your orders.</p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Shopping</a>
              </div>
            </div>
          `,
        });
      } catch (err) {
        console.error("Welcome Email Error:", err);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    next(error);
  }
});

app.post("/api/send-order-confirmation", async (req, res, next) => {
  try {
    const { email, phone, orderId, productName, totalAmount, shippingAddress, name, items, paymentMethod } = req.body || {};
    const resendClient = getResend();

    const orderRef = (orderId || '').slice(-8).toUpperCase() || 'NEW';
    const displayTotal = typeof totalAmount === 'number' ? totalAmount.toFixed(2) : (totalAmount || '0.00');

    // Broadcast real-time order activity via Socket.IO
    io.emit("new_activity", {
      message: `New Order #${orderRef}: $${displayTotal}`,
      type: "order"
    });

    if (resendClient && email) {
      try {
        let itemsTableHtml = '';
        if (Array.isArray(items) && items.length > 0) {
          const rows = items.map((item: any) => {
            const itemPrice = item.priceValue ? Number(item.priceValue).toFixed(2) : (item.price || '0.00');
            const qty = item.quantity || 1;
            const itemTotal = (parseFloat(itemPrice) * qty).toFixed(2);
            return `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 10px; font-weight: bold; color: #1e293b;">${item.name || 'Product'}</td>
                <td style="padding: 12px 10px; text-align: center; color: #64748b;">${qty}</td>
                <td style="padding: 12px 10px; text-align: right; color: #64748b;">$${itemPrice}</td>
                <td style="padding: 12px 10px; text-align: right; font-weight: bold; color: #ea580c;">$${itemTotal}</td>
              </tr>
            `;
          }).join('');

          itemsTableHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left; color: #475569;">
                  <th style="padding: 10px;">Item Description</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Unit Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          `;
        } else if (productName) {
          itemsTableHtml = `<p style="font-size: 15px; color: #334155;"><strong>Ordered Item:</strong> ${productName}</p>`;
        }

        const addressString = shippingAddress
          ? typeof shippingAddress === 'string'
            ? shippingAddress
            : `${shippingAddress.address || ''}, ${shippingAddress.city || ''} ${shippingAddress.zip || ''}`.trim()
          : '';

        const userHtml = `
          <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9;">
              <h1 style="color: #ea580c; font-style: italic; margin: 0; font-size: 32px;">Vivi Shop</h1>
              <p style="color: #16a34a; font-weight: bold; margin-top: 6px; font-size: 16px;">Order Confirmed! 🎉</p>
            </div>

            <div style="padding: 20px 0;">
              <p style="font-size: 16px; margin-bottom: 15px;">Hi <strong>${name || 'Valued Customer'}</strong>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.5;">Thank you for shopping with Vivi Shop! Your order <strong>#${orderRef}</strong> has been successfully placed.</p>

              <div style="margin-top: 20px; background-color: #f8fafc; padding: 16px; border-radius: 12px; font-size: 13px;">
                <p style="margin: 4px 0;"><strong>Order ID:</strong> ${orderId || orderRef}</p>
                <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${(paymentMethod || 'Online Payment').toUpperCase()}</p>
                ${addressString ? `<p style="margin: 4px 0;"><strong>Shipping Address:</strong> ${addressString}</p>` : ''}
              </div>

              <h3 style="margin-top: 25px; margin-bottom: 10px; font-size: 16px; color: #0f172a;">Order Summary</h3>
              ${itemsTableHtml}

              <div style="margin-top: 25px; padding: 18px; background-color: #fff7ed; border-radius: 12px; border: 1px solid #ffedd5; text-align: right;">
                <p style="margin: 0; font-size: 14px; color: #9a3412;">Total Amount to Pay:</p>
                <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 900; color: #ea580c;">$${displayTotal}</p>
              </div>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0;">If you have any questions, reply to this email or contact support.</p>
              <p style="margin-top: 6px;">Thank you for choosing Vivi Shop!</p>
            </div>
          </div>
        `;

        const userEmail = sendResendEmail(resendClient, {
          to: [email],
          subject: `Order Confirmation #${orderRef} - Vivi Shop`,
          html: userHtml,
        });

        const adminNotif = sendResendEmail(resendClient, {
          to: [adminEmail || 'idemudiawisdom27@gmail.com'],
          subject: `NEW ORDER: #${orderRef} ($${displayTotal})`,
          html: userHtml,
        });

        await Promise.all([userEmail, adminNotif]);
      } catch (err) {
        console.error("Order Email Error:", err);
      }
    }

    if (phone) console.log(`[SMS SIMULATION] Order confirmed for ${name}. Order #${orderRef}.`);

    res.json({ success: true });
  } catch (error: any) {
    next(error);
  }
});

app.all([
  "/products", "/products/", "/products/*",
  "/categories", "/categories/", "/categories/*",
  "/api/seed", "/api/seed/",
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
    if (req.method === "GET") {
      if (req.path.startsWith("/categories")) {
        return res.json([
          { id: 1, name: "Electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000&auto=format&fit=crop", products: [] },
          { id: 2, name: "Fashion", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1000&auto=format&fit=crop", products: [] },
          { id: 3, name: "Home & Decor", image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop", products: [] },
          { id: 4, name: "Footwear", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop", products: [] }
        ]);
      }
      if (req.path.startsWith("/products") || req.path.startsWith("/api/products")) {
        return res.json([
          {
            id: 1,
            name: "Samsung Galaxy S24 Ultra",
            description: "Experience the ultimate smartphone with AI camera features.",
            price: 1299.99,
            old_price: 1399.99,
            image: "https://images.unsplash.com/photo-1707246135650-681966144e5d?q=80&w=1000&auto=format&fit=crop",
            category_id: 1,
            category_name: "Electronics",
            tag: "New Arrival",
            stock: 50,
            sold: 120,
            is_available: true,
            rating: 4.8,
            reviews_count: 12
          },
          {
            id: 2,
            name: "Adidas Ultraboost Light",
            description: "The most responsive Ultraboost ever.",
            price: 180.00,
            old_price: 220.00,
            image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1000&auto=format&fit=crop",
            category_id: 4,
            category_name: "Footwear",
            tag: "Best Seller",
            stock: 100,
            sold: 500,
            is_available: true,
            rating: 4.9,
            reviews_count: 34
          }
        ]);
      }
    }
    res.status(503).json({
      error: "Product Service Unavailable",
      details: "The Python backend (port 8000) might not be running.",
      url: url
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  startServer();
}
