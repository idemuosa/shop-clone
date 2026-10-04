# Vivi Shop 🛒

An e-commerce web application featuring real-time Socket.IO updates, Resend OTP/email support, Paystack payments, Firebase authentication, and a FastAPI/PostgreSQL product backend.

---

## 🚀 Run Locally

### Prerequisites
* Node.js (v18 or higher)
* Python (v3.10 or higher) for the FastAPI backend

### Steps
1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration keys:
   * `RESEND_API_KEY`: Your Resend API key for sending email OTPs and notifications.
   * `FROM_EMAIL`: Verified sender email (e.g. `Vivi Shop <onboarding@resend.dev>`).
   * `PAYSTACK_SECRET_KEY`: Your Paystack secret key.

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 🌐 Deployment Guide

### 🛠️ Backend Deployment (Render)

1. **Connect Repository to Render:**
   * Go to [Render Dashboard](https://dashboard.render.com/) and click **New > Blueprint**.
   * Connect your GitHub repository containing `render.yaml`. Render will automatically detect `render.yaml` and configure the web services (`vivi-shop-backend` and `vivi-shop-python-api`).

2. **Set Environment Variables on Render:**
   In your Render web service settings, configure the following environment variables:
   * `RESEND_API_KEY`: Your Resend API key.
   * `FROM_EMAIL`: Sender email (e.g., `Vivi Shop <onboarding@resend.dev>`).
   * `ADMIN_EMAIL`: Admin email for order notifications.
   * `CORE_ORIGIN`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`).
   * `PAYSTACK_SECRET_KEY`: Paystack secret key for backend payment initialization and webhooks.
   * `DATABASE_URL`: PostgreSQL database connection URL.

3. **Deploy:**
   * Render will automatically build and start your Node.js/Socket.IO backend service. Note your backend service URL (e.g., `https://vivi-shop-backend.onrender.com`).

---

### 📐 Frontend Deployment (Vercel)

1. **Import Project into Vercel:**
   * Go to [Vercel Dashboard](https://vercel.com/new) and import your Git repository.
   * Vercel will auto-detect the Vite framework settings.

2. **Set Environment Variables on Vercel:**
   Under **Environment Variables** in Vercel, add:
   * `VITE_API_URL`: `https://vivi-shop-backend.onrender.com` (Your Render backend URL)
   * `VITE_PYTHON_API_URL`: `https://vivi-shop-backend.onrender.com`
   * `VITE_RESEND_API_KEY`: Your Resend API key.
   * `VITE_PAYSTACK_PUBLIC_KEY`: Your Paystack public key.
   * `VITE_ADMIN_EMAIL`: Admin email address.

3. **Deploy:**
   * Click **Deploy**. Vercel will build the frontend bundle using `npm run build` and deploy it instantly.
