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
const corsOriginEnv = process.env.CORS_ORIGINS || process.env.CORE_ORIGIN || process.env.CLIENT_ORIGIN;
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
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Helper function to sanitize and format Firebase private key PEM string
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  let formatted = key.trim();
  if ((formatted.startsWith('"') && formatted.endsWith('"')) || (formatted.startsWith("'") && formatted.endsWith("'"))) {
    formatted = formatted.slice(1, -1).trim();
  }
  return formatted.replace(/\\n/g, "\n");
}

// Initialize Firebase Admin safely
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let isFirebaseAdminInitialized = false;

try {
  let serviceAccount: any = null;

  if (serviceAccountJson) {
    serviceAccount = JSON.parse(serviceAccountJson);
    if (serviceAccount && serviceAccount.private_key) {
      serviceAccount.private_key = formatPrivateKey(serviceAccount.private_key);
    }
  } else if (projectId && clientEmail && privateKey) {
    serviceAccount = {
      projectId,
      clientEmail,
      privateKey: formatPrivateKey(privateKey),
    };
  } else if (serviceAccountPath) {
    // Check if the value is a JSON string or a file path
    if (serviceAccountPath.trim().startsWith('{')) {
      serviceAccount = JSON.parse(serviceAccountPath);
      if (serviceAccount && serviceAccount.private_key) {
        serviceAccount.private_key = formatPrivateKey(serviceAccount.private_key);
      }
    } else {
      const resolvedPath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(process.cwd(), serviceAccountPath);

      if (fs.existsSync(resolvedPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        if (serviceAccount && serviceAccount.private_key) {
          serviceAccount.private_key = formatPrivateKey(serviceAccount.private_key);
        }
      }
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

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Store OTPs temporarily
const otpStore = new Map<string, string>();

// In-Memory Data Store (Default seed data for products, categories, reviews, carts, wishlists)
let categoriesStore: any[] = [];

let productsStore: any[] = [];

let reviewsStore: any[] = [];
let cartsStore = new Map<string, any[]>();
let wishlistsStore = new Map<string, number[]>();

async function fetchCategoriesFromFS(): Promise<any[]> {
  if (!isFirebaseAdminInitialized) return categoriesStore;
  try {
    const snap = await admin.firestore().collection('categories').get();
    if (snap.empty) {
      const batch = admin.firestore().batch();
      for (const cat of categoriesStore) {
        const docRef = admin.firestore().collection('categories').doc(String(cat.id));
        batch.set(docRef, cat);
      }
      await batch.commit();
      return categoriesStore;
    }
    const categories = snap.docs.map(doc => {
      const data = doc.data();
      return { ...data, id: Number(doc.id) || data.id || doc.id };
    });
    categoriesStore = categories;
    return categories;
  } catch (err) {
    console.warn("Firestore fetchCategories error:", err);
    return categoriesStore;
  }
}

async function fetchProductsFromFS(): Promise<any[]> {
  if (!isFirebaseAdminInitialized) return productsStore;
  try {
    const snap = await admin.firestore().collection('products').get();
    if (snap.empty) {
      const batch = admin.firestore().batch();
      for (const prod of productsStore) {
        const docRef = admin.firestore().collection('products').doc(String(prod.id));
        batch.set(docRef, prod);
      }
      await batch.commit();
      return productsStore;
    }
    const products = snap.docs.map(doc => {
      const data = doc.data();
      return { ...data, id: Number(doc.id) || data.id || doc.id };
    });
    productsStore = products;
    return products;
  } catch (err) {
    console.warn("Firestore fetchProducts error:", err);
    return productsStore;
  }
}

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

app.delete(["/api/admin/orders/:id", "/api/admin/orders/:id/"], async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isFirebaseAdminInitialized) {
      try {
        await admin.firestore().collection('orders').doc(id).delete();
      } catch (fErr) {
        console.warn(`Firestore order delete error for ${id}:`, fErr);
      }
    }
    res.json({ success: true, message: `Order ${id} deleted successfully` });
  } catch (error: any) {
    next(error);
  }
});

app.delete(["/api/admin/orders", "/api/admin/orders/"], async (_req, res, next) => {
  try {
    if (isFirebaseAdminInitialized) {
      try {
        const ordersRef = admin.firestore().collection('orders');
        const snapshot = await ordersRef.get();
        const batch = admin.firestore().batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (fErr) {
        console.warn("Firestore bulk orders clear error:", fErr);
      }
    }
    res.json({ success: true, message: "All sales orders cleared successfully" });
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
      const { reference, customer, amount } = event.data || {};
      console.log(`[PAYSTACK WEBHOOK] Payment Successful: Ref ${reference}, Customer ${customer?.email}, Amount ${amount}`);

      io.emit("new_activity", {
        message: `New payment received: ₦${amount / 100} from ${customer?.email}`,
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

app.get("/api/admin/analytics", async (_req, res, next) => {
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
    const { email, phone } = req.body || {};
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
      message: `New Order #${orderRef}: ₦${displayTotal}`,
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
                <td style="padding: 12px 10px; text-align: right; color: #64748b;">₦${itemPrice}</td>
                <td style="padding: 12px 10px; text-align: right; font-weight: bold; color: #ea580c;">₦${itemTotal}</td>
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
                <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 900; color: #ea580c;">₦${displayTotal}</p>
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
          subject: `NEW ORDER: #${orderRef} (₦${displayTotal})`,
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

// Products & Categories Endpoints
app.get(["/categories", "/categories/", "/api/categories", "/api/categories/"], async (_req, res, next) => {
  try {
    const categories = await fetchCategoriesFromFS();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

app.post(["/categories", "/categories/", "/api/categories", "/api/categories/"], async (req, res, next) => {
  try {
    const { name, image } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }
    const categories = await fetchCategoriesFromFS();
    const newCategory = {
      id: categories.length > 0 ? Math.max(...categories.map(c => Number(c.id) || 0)) + 1 : 1,
      name,
      image: image || "",
      products: []
    };
    categoriesStore.push(newCategory);

    if (isFirebaseAdminInitialized) {
      try {
        await admin.firestore().collection('categories').doc(String(newCategory.id)).set(newCategory);
      } catch (fErr) {
        console.warn("Firestore category save error:", fErr);
      }
    }

    res.status(201).json(newCategory);
  } catch (err) {
    next(err);
  }
});

app.put(["/categories/:id", "/categories/:id/", "/api/categories/:id", "/api/categories/:id/"], async (req, res, next) => {
  try {
    const catId = Number(req.params.id);
    const categories = await fetchCategoriesFromFS();
    const index = categories.findIndex(c => Number(c.id) === catId);
    if (index === -1) {
      return res.status(404).json({ error: "Category not found" });
    }
    const { name, image } = req.body;
    if (name !== undefined) categories[index].name = name;
    if (image !== undefined) categories[index].image = image;

    categoriesStore = categories;

    if (isFirebaseAdminInitialized) {
      try {
        await admin.firestore().collection('categories').doc(String(catId)).set(categories[index], { merge: true });
      } catch (fErr) {
        console.warn("Firestore category update error:", fErr);
      }
    }

    res.json(categories[index]);
  } catch (err) {
    next(err);
  }
});

app.delete(["/categories/:id", "/categories/:id/", "/api/categories/:id", "/api/categories/:id/"], async (req, res, next) => {
  try {
    const catId = Number(req.params.id);
    const categories = await fetchCategoriesFromFS();
    const index = categories.findIndex(c => Number(c.id) === catId);
    if (index === -1) {
      return res.status(404).json({ error: "Category not found" });
    }
    const deleted = categories.splice(index, 1)[0];
    categoriesStore = categories;

    if (isFirebaseAdminInitialized) {
      try {
        await admin.firestore().collection('categories').doc(String(catId)).delete();
      } catch (fErr) {
        console.warn("Firestore category delete error:", fErr);
      }
    }

    res.json({ message: "Category deleted successfully", category: deleted });
  } catch (err) {
    next(err);
  }
});

app.get(["/products", "/products/", "/api/products", "/api/products/"], async (req, res, next) => {
  try {
    const products = await fetchProductsFromFS();
    const { category_id } = req.query;
    if (category_id) {
      const catId = Number(category_id);
      const filtered = products.filter(p => Number(p.category_id) === catId);
      return res.json(filtered);
    }
    res.json(products);
  } catch (err) {
    next(err);
  }
});

app.get(["/products/:id", "/products/:id/", "/api/products/:id", "/api/products/:id/"], async (req, res, next) => {
  try {
    const products = await fetchProductsFromFS();
    const product = products.find(p => Number(p.id) === Number(req.params.id));
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

app.post(["/products", "/products/", "/api/products", "/api/products/"], async (req, res, next) => {
  try {
    const { name, description, price, old_price, image, category_id, tag, stock, sold, is_available } = req.body;
    const categories = await fetchCategoriesFromFS();
    const products = await fetchProductsFromFS();
    const category = categories.find(c => Number(c.id) === Number(category_id));
    const newProduct = {
      id: products.length > 0 ? Math.max(...products.map(p => Number(p.id) || 0)) + 1 : 1,
      name: name || "Unnamed Product",
      description: description || "",
      price: Number(price) || 0,
      old_price: old_price !== undefined && old_price !== null ? Number(old_price) : null,
      image: image || "",
      category_id: Number(category_id) || 1,
      category_name: category ? category.name : "General",
      tag: tag || "",
      stock: stock !== undefined ? Number(stock) : 100,
      sold: sold !== undefined ? Number(sold) : 0,
      is_available: is_available !== undefined ? Boolean(is_available) : true,
      rating: 5.0,
      reviews_count: 0
    };
    productsStore.push(newProduct);

    if (isFirebaseAdminInitialized) {
      try {
        await admin.firestore().collection('products').doc(String(newProduct.id)).set(newProduct);
      } catch (fErr) {
        console.warn("Firestore product save error:", fErr);
      }
    }

    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
});

app.put(["/products/:id", "/products/:id/", "/api/products/:id", "/api/products/:id/"], async (req, res, next) => {
  try {
    const prodId = Number(req.params.id);
    const products = await fetchProductsFromFS();
    const index = products.findIndex(p => Number(p.id) === prodId);
    if (index === -1) {
      return res.status(404).json({ error: "Product not found" });
    }
    const { name, description, price, old_price, image, category_id, tag, stock, sold, is_available } = req.body;
    if (category_id !== undefined) {
      const categories = await fetchCategoriesFromFS();
      const category = categories.find(c => Number(c.id) === Number(category_id));
      products[index].category_id = Number(category_id);
      if (category) {
        products[index].category_name = category.name;
      }
    }
    if (name !== undefined) products[index].name = name;
    if (description !== undefined) products[index].description = description;
    if (price !== undefined) products[index].price = Number(price);
    if (old_price !== undefined) products[index].old_price = old_price !== null ? Number(old_price) : null;
    if (image !== undefined) products[index].image = image;
    if (tag !== undefined) products[index].tag = tag;
    if (stock !== undefined) products[index].stock = Number(stock);
    if (sold !== undefined) products[index].sold = Number(sold);
    if (is_available !== undefined) products[index].is_available = Boolean(is_available);

    productsStore = products;

    if (isFirebaseAdminInitialized) {
      try {
        await admin.firestore().collection('products').doc(String(prodId)).set(products[index], { merge: true });
      } catch (fErr) {
        console.warn("Firestore product update error:", fErr);
      }
    }

    res.json(products[index]);
  } catch (err) {
    next(err);
  }
});

app.delete(["/products/clear-all", "/products/clear-all/", "/api/products/clear-all", "/api/products/clear-all/"], async (_req, res, next) => {
  try {
    productsStore = [];
    if (isFirebaseAdminInitialized) {
      try {
        const snap = await admin.firestore().collection('products').get();
        const batch = admin.firestore().batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (fErr) {
        console.warn("Firestore bulk clear products error:", fErr);
      }
    }
    res.json({ success: true, message: "All inventory products deleted successfully" });
  } catch (err) {
    next(err);
  }
});

app.delete(["/products/:id", "/products/:id/", "/api/products/:id", "/api/products/:id/"], async (req, res, next) => {
  try {
    const prodId = Number(req.params.id);
    const products = await fetchProductsFromFS();
    const index = products.findIndex(p => Number(p.id) === prodId);
    if (index === -1) {
      return res.status(404).json({ error: "Product not found" });
    }
    const deleted = products.splice(index, 1)[0];
    productsStore = products;

    if (isFirebaseAdminInitialized) {
      try {
        await admin.firestore().collection('products').doc(String(prodId)).delete();
      } catch (fErr) {
        console.warn("Firestore product delete error:", fErr);
      }
    }

    res.json({ message: "Product deleted successfully", product: deleted });
  } catch (err) {
    next(err);
  }
});

app.delete(["/products", "/products/", "/api/products", "/api/products/"], async (_req, res, next) => {
  try {
    productsStore = [];
    if (isFirebaseAdminInitialized) {
      try {
        const snap = await admin.firestore().collection('products').get();
        const batch = admin.firestore().batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (fErr) {
        console.warn("Firestore bulk clear products error:", fErr);
      }
    }
    res.json({ success: true, message: "All inventory products deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// Reviews Endpoints
app.get(["/api/reviews", "/api/reviews/"], (req, res) => {
  const productId = req.query.product_id ? Number(req.query.product_id) : null;
  if (productId) {
    const filtered = reviewsStore.filter(r => r.product === productId);
    return res.json(filtered);
  }
  res.json(reviewsStore);
});

app.post(["/api/reviews", "/api/reviews/"], (req, res) => {
  const { product, rating, comment } = req.body;
  const newReview = {
    id: reviewsStore.length + 1,
    product: Number(product),
    rating: Number(rating) || 5,
    comment: comment || "",
    user_name: "Customer",
    created_at: new Date().toISOString()
  };
  reviewsStore.push(newReview);
  res.status(201).json(newReview);
});

// Cart Endpoints
app.get(["/api/cart", "/api/cart/"], (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = authHeader ? authHeader.replace("Bearer ", "") : "guest";
  const userCart = cartsStore.get(userId) || [];
  res.json({ items: userCart });
});

app.post(["/api/cart/sync", "/api/cart/sync/"], (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = authHeader ? authHeader.replace("Bearer ", "") : "guest";
  const items = req.body || [];
  cartsStore.set(userId, items);
  res.json({ success: true, items });
});

// Wishlist Endpoints
app.post(["/api/wishlist/add_to_wishlist", "/api/wishlist/add_to_wishlist/"], (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = authHeader ? authHeader.replace("Bearer ", "") : "guest";
  const { product_id } = req.body;
  const userWishlist = wishlistsStore.get(userId) || [];
  if (!userWishlist.includes(Number(product_id))) {
    userWishlist.push(Number(product_id));
  }
  wishlistsStore.set(userId, userWishlist);
  res.json({ success: true, wishlist: userWishlist });
});

// User Management Endpoints
app.delete("/api/admin/users/:id", async (req, res, next) => {
  const userId = req.params.id;
  try {
    if (isFirebaseAdminInitialized) {
      try {
        await admin.firestore().collection('users').doc(userId).delete();
      } catch (fErr) {
        console.warn("Firestore user delete error:", fErr);
      }
      try {
        await admin.auth().deleteUser(userId);
      } catch (aErr) {
        console.warn("Firebase Auth user delete error:", aErr);
      }
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/users", async (_req, res, next) => {
  try {
    if (isFirebaseAdminInitialized) {
      const snapshot = await admin.firestore().collection('users').get();
      const batch = admin.firestore().batch();
      for (const docSnap of snapshot.docs) {
        const uData = docSnap.data();
        const isPrimaryAdmin = uData.email === 'idemudiawisdom27@gmail.com' || uData.email === process.env.ADMIN_EMAIL;
        if (!isPrimaryAdmin) {
          batch.delete(docSnap.ref);
          try {
            await admin.auth().deleteUser(docSnap.id);
          } catch (e) {}
        }
      }
      await batch.commit();
    }
    res.json({ success: true, message: "All non-admin users cleared successfully" });
  } catch (error) {
    next(error);
  }
});

// Merchants / Orders Fallback Endpoints
app.get(["/api/merchants", "/api/merchants/"], (_req, res) => {
  res.json([]);
});

app.delete(["/api/admin/users/:id", "/api/admin/users/:id/"], async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (isFirebaseAdminInitialized) {
      try {
        await admin.firestore().collection("users").doc(id).delete();
      } catch (fErr) {
        console.warn("Firestore delete user doc error:", fErr);
      }

      try {
        await admin.auth().deleteUser(id);
      } catch (authErr) {
        console.warn("Firebase Auth deleteUser error (user might not exist in Auth):", authErr);
      }
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    next(error);
  }
});

app.delete(["/api/admin/activities", "/api/admin/activities/"], async (_req, res, next) => {
  try {
    if (isFirebaseAdminInitialized) {
      try {
        const notifsRef = admin.firestore().collection("notifications");
        const snapshot = await notifsRef.get();
        const batch = admin.firestore().batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (fErr) {
        console.warn("Firestore notifications clear error:", fErr);
      }
    }

    res.json({ success: true, message: "Recent activities cleared successfully" });
  } catch (error: any) {
    next(error);
  }
});

app.all(["/api/reset-store-data", "/api/reset-store-data/"], async (_req, res, next) => {
  try {
    productsStore = [];
    categoriesStore = [];
    reviewsStore = [];
    cartsStore.clear();
    wishlistsStore.clear();

    if (isFirebaseAdminInitialized) {
      try {
        const collectionsToClear = ['orders', 'products', 'categories'];
        for (const colName of collectionsToClear) {
          const ref = admin.firestore().collection(colName);
          const snapshot = await ref.get();
          const batch = admin.firestore().batch();
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
      } catch (fErr) {
        console.warn("Firestore reset store data error:", fErr);
      }
    }

    res.json({ success: true, message: "Store data cleared successfully" });
  } catch (error: any) {
    next(error);
  }
});

async function startServer() {
  const distIndexHtml = path.join(process.cwd(), "dist", "index.html");
  if (process.env.NODE_ENV !== "production" || !fs.existsSync(distIndexHtml)) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[Server] Production mode requested but dist/index.html not found. Falling back to Vite development server mode.");
    }
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(distIndexHtml);
    });
  }

  // Global Express Error Handler Middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Global Express Error]", err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "An unexpected server error occurred."
    });
  }
});

export default app;

if (!process.env.VERCEL) {
  startServer();
}
