<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy

This contains everything you need to run your app locally.



## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the environment variables in `.env` (refer to `.env.example`)
3. Run the app:
   `npm run dev`

---

## Deployment Options

### Deploying Frontend on Render & Vercel Simultaneously

You can deploy the Vite React frontend static build (`dist`) to both **Render** and **Vercel** at the same time.

#### 1. Deploy on Render
- Connect your repository to Render.
- Render will automatically detect `render.yaml` Blueprint specification, or you can create a **Static Site**:
  - **Build Command:** `npm run build`
  - **Publish Directory:** `dist`
  - **Redirects/Rewrites:** Source `/*` -> Destination `/index.html` (Action: `Rewrite`)
  - **Environment Variable:** `VITE_API_URL` pointing to your Express API server URL.

#### 2. Deploy on Vercel
- Connect your repository to Vercel.
- Vercel automatically uses `vercel.json` for routing:
  - **Framework Preset:** Vite
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
  - **Environment Variable:** `VITE_API_URL` pointing to your Express API server URL.

#### 3. CORS Backend Configuration
Ensure `CORE_ORIGIN` on your API Gateway (`server.ts`) includes both frontend origins:
```env
CORE_ORIGIN="https://vivi-shop-frontend.onrender.com,https://vivi-shop.vercel.app"
```
