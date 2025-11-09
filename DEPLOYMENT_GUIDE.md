# AIATL Winning Project - Deployment Guide

This guide explains how to deploy the three services on Render.com.

## Architecture

The application consists of three separate services:

1. **Gemini Service** (`aiatlwinningproject-gemini`) - Node.js/TypeScript service for AI parsing
2. **Backend Service** (`aiatlwinningproject-backend`) - Python/FastAPI service for API and business logic
3. **Frontend** (`aiatlwinningproject-frontend`) - React/TypeScript SPA

## Prerequisites

- MongoDB Atlas account (free tier is sufficient)
- Gemini API key
- Render.com account (free tier works)

## Deployment Steps

### Step 1: Deploy Gemini Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `aiatlwinningproject-gemini`
   - **Root Directory**: `aiatlwinningproject-gemini`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variable:
   - `GEMINI_API_KEY`: Your Google Gemini API key
6. Click "Create Web Service"
7. Wait for deployment and **copy the service URL** (e.g., `https://aiatlwinningproject-gemini.onrender.com`)

### Step 2: Deploy Backend Service

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `aiatlwinningproject-backend`
   - **Root Directory**: `aiatlwinningproject-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB connection string from MongoDB Atlas
   - `JWT_SECRET`: A random secure string (e.g., `openssl rand -hex 32`)
   - `GEMINI_SERVICE_URL`: The URL from Step 1 (e.g., `https://aiatlwinningproject-gemini.onrender.com`)
6. Click "Create Web Service"
7. Wait for deployment and **copy the service URL** (e.g., `https://aiatlwinningproject-backend.onrender.com`)

### Step 3: Deploy Frontend

1. Go to Render Dashboard
2. Click "New" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `aiatlwinningproject-frontend`
   - **Root Directory**: `aiatlwinningproject-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: The backend URL from Step 2 (e.g., `https://aiatlwinningproject-backend.onrender.com`)
6. **Important**: Under "Redirects/Rewrites", add:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
7. Click "Create Static Site"
8. Wait for deployment

### Step 4: Test the Application

1. Open your frontend URL (e.g., `https://aiatlwinningproject-frontend.onrender.com`)
2. Test user registration/login
3. Test creating a flash request
4. Verify that the services are communicating properly

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Use this as the `MONGODB_URI` environment variable

## Environment Variables Summary

### Gemini Service
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Backend Service
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
GEMINI_SERVICE_URL=https://aiatlwinningproject-gemini.onrender.com
```

### Frontend
```
VITE_API_BASE_URL=https://aiatlwinningproject-backend.onrender.com
```

## Important Notes

1. **Free Tier Limitations**: Render free tier services spin down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.

2. **CORS**: The backend is configured to allow all origins (`*`). For production, consider restricting to your frontend domain.

3. **Database**: Make sure to whitelist all IP addresses (0.0.0.0/0) in MongoDB Atlas Network Access for Render services.

4. **API Keys**: Never commit `.env` files to Git. Use `.env.example` as templates.

5. **Order Matters**: Deploy in this order: Gemini → Backend → Frontend, so you have the URLs for environment variables.

## Troubleshooting

### Service Won't Start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure root directory path is correct

### CORS Errors
- Verify backend CORS configuration
- Check that frontend is using correct backend URL

### Database Connection Failed
- Verify MongoDB URI is correct
- Check MongoDB Atlas network access settings
- Ensure IP whitelist includes 0.0.0.0/0

### Gemini Service Timeout
- Verify GEMINI_API_KEY is set correctly
- Check Gemini service logs for errors

## Local Development vs Production

### Local Development
- Frontend: `http://localhost:5173` (uses proxy to backend)
- Backend: `http://localhost:8000`
- Gemini: `http://localhost:3001`

### Production
- Each service has its own URL on Render
- Services communicate via environment variable URLs
- No proxy needed - direct API calls

## Updating the Application

1. Push changes to your GitHub repository
2. Render will automatically detect changes and redeploy
3. If auto-deploy is disabled, manually trigger deploy from Render dashboard

## Cost Optimization

All three services can run on Render's free tier, which includes:
- 750 hours of free web service time per month (for backend and gemini)
- Unlimited static sites (for frontend)
- Automatic SSL certificates
- CDN for static sites

For production use with higher traffic, consider upgrading to paid tiers.
