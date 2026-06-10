# Production Deployment Guide

## 1. Backend Deployment (Render / Railway / AWS)
Your FastAPI backend is now containerized via the included `Dockerfile`.

**Steps to deploy on Render (Recommended for easiest Docker hosting):**
1. Push your code to a GitHub repository.
2. Create an account on [Render](https://render.com).
3. Create a new **Web Service** and connect your GitHub repo.
4. Set the Root Directory to `backend/`.
5. Render will automatically detect the `Dockerfile` and build it.
6. **Important:** In the Render dashboard, go to the "Environment" tab and add your variables:
   * `DATABASE_URL` (Wait until Step 2 to get this)
   * `GEMINI_API_KEY`
   * `FATSECRET_CLIENT_ID`
   * `FATSECRET_CLIENT_SECRET`

## 2. Database Deployment (Neon.tech)
1. Sign up at [Neon](https://neon.tech) and create a new project.
2. Copy the connection string (it will look like `postgresql://user:password@endpoint.neon.tech/dbname?sslmode=require`).
3. Replace the `postgresql://` prefix with `postgresql+asyncpg://` to match our async SQLAlchemy setup.
4. Paste this full URL into your Render `DATABASE_URL` environment variable.

## 3. Frontend Deployment (Vercel)
Vercel provides zero-configuration deployments for Next.js.
1. Sign up at [Vercel](https://vercel.com) and connect your GitHub repository.
2. Select the repository and set the **Root Directory** to `frontend/`.
3. Vercel will automatically detect the Next.js framework.
4. Go to **Environment Variables** and add:
   * `NEXT_PUBLIC_API_URL` = `https://your-render-app-url.onrender.com` 
*(Note: You will need to update `c:\Nutrion tracker\frontend\src\app\page.js` to point `fetch()` to `process.env.NEXT_PUBLIC_API_URL` instead of localhost for production)*
5. Click **Deploy**.

## Post-Deployment
Once both services are green, your Indian Cuisine AI Nutrition Tracker is officially live on the internet!
