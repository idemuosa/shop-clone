# Project Technology Stack

This document summarizes the programming languages, frameworks, libraries, and tools used across this repository.

---

## 💻 Programming Languages

- **TypeScript (`.ts`, `.tsx`)**: Primary language for the frontend application (`src/`) and the Node.js server (`server.ts`, `api/index.ts`).
- **Python (`.py`)**: Used for the backend microservice (`backend/`), including FastAPI endpoints, database models, and seed scripts.
- **HTML & CSS**: Web entry point (`index.html`) and Tailwind CSS styling (`src/index.css`).
- **Shell & Batch Scripts**: Automation and deployment execution scripts (`DEPLOY.bat`, `RUN_SHOP.bat`, `SEED_DATABASE.bat`, `Dockerfile`, `nginx.conf`).

---

## 🚀 Frameworks & Libraries

### Frontend Stack
- **React 19**: Frontend UI library.
- **Vite 6**: Frontend build tool and development server.
- **Tailwind CSS v4**: Utility-first CSS framework.
- **Shadcn UI & Base UI**: Accessible component primitives and UI styling.
- **Motion**: Animation library for smooth UI transitions.
- **Lucide React**: Icon library.
- **Recharts**: Charting and analytics library.
- **Capacitor 8 (`@capacitor/android`)**: Cross-platform wrapper for building native Android mobile apps.

### Backend Stack

#### 1. Node.js Gateway / Express Server (`server.ts`)
- **Express.js**: Web server acting as API gateway and proxy to Python backend.
- **Socket.IO**: Real-time WebSockets for activity feeds and notifications.
- **Firebase Admin SDK**: Authentication and Firestore database management.
- **Resend**: Transactional email service for OTPs and order confirmation.
- **Paystack API**: Payment processing integration.

#### 2. Python Backend Service (`backend/`)
- **FastAPI**: Asynchronous web framework for high-performance Python APIs.
- **Uvicorn**: Lightning-fast ASGI web server.
- **SQLAlchemy**: Python SQL toolkit and ORM.
- **PostgreSQL (`psycopg2-binary`)**: Database adapter.
- **Pydantic**: Data validation and setting management.

---

## 🐳 Infrastructure & Deployment

- **Docker & Docker Compose**: Containerization for frontend and backend services.
- **Nginx**: High-performance HTTP server and reverse proxy configuration (`nginx.conf`).
- **Vercel**: Serverless deployment configuration (`vercel.json`, `api/index.ts`).
- **Firebase Hosting & Firestore**: Realtime database and rules configuration (`firebase.json`, `firestore.rules`).
