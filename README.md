<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Vivi Shop - Hybrid Architecture

This project contains everything you need to run and deploy Vivi Shop with PostgreSQL and Redis support.

## Run Locally

**Prerequisites:** Node.js, Python 3.x, PostgreSQL (optional for local dev), Redis (optional for local dev).

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` or set required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/shop`)
   - `REDIS_URL`: Redis connection string (e.g. `redis://localhost:6379/0`)

3. Run the app:
   ```bash
   npm run dev
   ```

## Run with Docker Compose (PostgreSQL & Redis)

To run the full stack including PostgreSQL database and Redis caching/OTP store using Docker Compose:

```bash
docker-compose up --build
```

This starts:
- **db**: PostgreSQL 15 container on port `5432`
- **redis**: Redis 7 container on port `6379`
- **backend-django**: Django API backend on port `8000`
- **frontend-proxy**: Express server & Vite frontend on port `3000`
