# Quick Start Deployment Checklist

Use this checklist to deploy the AIATL Winning Project to Render.

## Pre-Deployment Setup

- [ ] Create MongoDB Atlas cluster (Free Tier)
- [ ] Get MongoDB connection string
- [ ] Get Google Gemini API key
- [ ] Create Render.com account
- [ ] Push code to GitHub repository

## Step 1: Deploy Gemini Service

- [ ] Go to Render Dashboard → New → Web Service
- [ ] Connect GitHub repository
- [ ] Configure service:
  - Name: `aiatlwinningproject-gemini`
  - Root Directory: `aiatlwinningproject-gemini`
  - Environment: Node
  - Build Command: `npm install && npm run build`
  - Start Command: `npm start`
- [ ] Add environment variable:
  - `GEMINI_API_KEY`: `your_gemini_api_key`
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete
- [ ] Copy service URL: `_________________________________`
- [ ] Test health endpoint: `https://your-gemini-url.onrender.com/health`

## Step 2: Deploy Backend Service

- [ ] Go to Render Dashboard → New → Web Service
- [ ] Connect GitHub repository
- [ ] Configure service:
  - Name: `aiatlwinningproject-backend`
  - Root Directory: `aiatlwinningproject-backend`
  - Environment: Python 3
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- [ ] Add environment variables:
  - `MONGODB_URI`: `mongodb+srv://...`
  - `JWT_SECRET`: Generate with `openssl rand -hex 32`
  - `GEMINI_SERVICE_URL`: URL from Step 1
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete
- [ ] Copy service URL: `_________________________________`
- [ ] Test health endpoint: `https://your-backend-url.onrender.com/health`

## Step 3: Configure MongoDB Atlas

- [ ] Go to MongoDB Atlas → Database Access
- [ ] Create database user with password
- [ ] Go to Network Access
- [ ] Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
- [ ] Test connection from backend logs

## Step 4: Deploy Frontend

- [ ] Go to Render Dashboard → New → Static Site
- [ ] Connect GitHub repository
- [ ] Configure service:
  - Name: `aiatlwinningproject-frontend`
  - Root Directory: `aiatlwinningproject-frontend`
  - Build Command: `npm install && npm run build`
  - Publish Directory: `dist`
- [ ] Add environment variable:
  - `VITE_API_BASE_URL`: URL from Step 2
- [ ] Add Redirect/Rewrite Rule:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: Rewrite
- [ ] Click "Create Static Site"
- [ ] Wait for deployment to complete
- [ ] Copy service URL: `_________________________________`

## Step 5: Test End-to-End

- [ ] Open frontend URL in browser
- [ ] Register a new user account
- [ ] Log in with credentials
- [ ] Create a flash request
- [ ] Verify request appears in UI
- [ ] Check for any console errors
- [ ] Test navigation between pages

## Verification

- [ ] All three services show "Live" status in Render
- [ ] No error logs in Render dashboard
- [ ] Frontend loads without console errors
- [ ] User registration/login works
- [ ] API calls succeed (check Network tab)
- [ ] Database operations work (users saved to MongoDB)

## URLs Reference

Fill in your deployed URLs:

```
Gemini Service:  https://_________________________________.onrender.com
Backend Service: https://_________________________________.onrender.com
Frontend:        https://_________________________________.onrender.com
```

## Troubleshooting

If something doesn't work:

1. **Check Render Logs**
   - Go to service → Logs tab
   - Look for error messages

2. **Verify Environment Variables**
   - Ensure all variables are set correctly
   - Check for typos in URLs

3. **Test Health Endpoints**
   - Gemini: `/health`
   - Backend: `/health`

4. **Check Browser Console**
   - Open DevTools → Console
   - Look for API errors

5. **Verify MongoDB**
   - Check Network Access (0.0.0.0/0)
   - Verify connection string format
   - Test with MongoDB Compass

## Post-Deployment

- [ ] Save all URLs in a secure location
- [ ] Document any configuration changes
- [ ] Set up monitoring (optional)
- [ ] Share frontend URL with team/users
- [ ] Monitor logs for errors
- [ ] Test on different devices/browsers

## Free Tier Notes

⚠️ **Important**: Render free tier services spin down after 15 minutes of inactivity.
- First request may take 30-60 seconds
- Consider upgrading for production use
- Free tier includes 750 hours/month per web service

## Need Help?

- Review `DEPLOYMENT_GUIDE.md` for detailed instructions
- Review `PROJECT_STRUCTURE.md` for architecture details
- Check Render documentation: https://render.com/docs
- Check service-specific README.md files

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Notes**: 
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
