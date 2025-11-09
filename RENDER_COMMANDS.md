# 🚀 RENDER DEPLOYMENT COMMANDS - COPY & PASTE

## ⚡ Quick Reference

### 1. Gemini Service (Web Service - Node)
```
Root Directory:    aiatlwinningproject-gemini
Build Command:     npm install && npm run build
Start Command:     npm start
Environment:       Node
```

**Environment Variables:**
```
GEMINI_API_KEY = your_gemini_api_key_here
```

---

### 2. Backend Service (Web Service - Python)
```
Root Directory:    aiatlwinningproject-backend  
Build Command:     pip install -r requirements.txt
Start Command:     uvicorn app:app --host 0.0.0.0 --port $PORT
Environment:       Python 3
```

**Environment Variables:**
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET = (generate with: openssl rand -hex 32)
GEMINI_SERVICE_URL = https://your-gemini-service.onrender.com
```

---

### 3. Frontend (Static Site)
```
Root Directory:      aiatlwinningproject-frontend
Build Command:       npm install && npm run build
Publish Directory:   dist
Environment:         Static Site
```

**Environment Variables:**
```
VITE_API_BASE_URL = https://your-backend-service.onrender.com
```

**Redirects/Rewrites (REQUIRED):**
```
Source:       /*
Destination:  /index.html
Action:       Rewrite
```

---

## 📝 Step-by-Step Deployment

### Step 1: Deploy Gemini Service FIRST
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repo
3. Name: `aiatlwinningproject-gemini`
4. Root Directory: `aiatlwinningproject-gemini`
5. Environment: **Node**
6. Build Command: `npm install && npm run build`
7. Start Command: `npm start`
8. Add Environment Variable: `GEMINI_API_KEY`
9. Deploy!
10. **COPY THE URL** (e.g., `https://aiatlwinningproject-gemini.onrender.com`)

### Step 2: Deploy Backend Service SECOND
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repo
3. Name: `aiatlwinningproject-backend`
4. Root Directory: `aiatlwinningproject-backend`
5. Environment: **Python 3**
6. Build Command: `pip install -r requirements.txt`
7. Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
8. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate with `openssl rand -hex 32`
   - `GEMINI_SERVICE_URL`: Paste URL from Step 1
9. Deploy!
10. **COPY THE URL** (e.g., `https://aiatlwinningproject-backend.onrender.com`)

### Step 3: Deploy Frontend LAST
1. Go to Render Dashboard → New → **Static Site** (NOT Web Service!)
2. Connect your GitHub repo
3. Name: `aiatlwinningproject-frontend`
4. Root Directory: `aiatlwinningproject-frontend`
5. Build Command: `npm install && npm run build`
6. Publish Directory: `dist`
7. Add Environment Variable:
   - `VITE_API_BASE_URL`: Paste URL from Step 2
8. **IMPORTANT**: Add Redirect/Rewrite Rule:
   - Click "Redirects/Rewrites"
   - Add Rule:
     - Source: `/*`
     - Destination: `/index.html`
     - Action: **Rewrite**
9. Deploy!

---

## ✅ After Deployment - Testing

### Health Checks
Test each service is running:

```bash
# Gemini Service
curl https://your-gemini-service.onrender.com/health

# Backend Service  
curl https://your-backend-service.onrender.com/health
```

### End-to-End Test
1. Open frontend URL in browser
2. Register a new account
3. Login
4. Create a flash request
5. Verify it works!

---

## 🔧 Common Issues & Solutions

### Issue: Build fails with TypeScript errors
**Solution**: The TypeScript errors you saw are expected during local development without dependencies installed. Render will install dependencies during the build process and these errors should resolve. If errors persist after Render installs dependencies, check the specific error in the Render logs.

### Issue: "Cannot connect to backend"
**Solution**: 
- Verify `VITE_API_BASE_URL` is set correctly in frontend
- Check backend logs for errors
- Ensure MongoDB connection string is correct

### Issue: "CORS error"
**Solution**: Backend is configured to allow all origins. If issues persist:
- Check backend logs
- Verify backend URL in frontend env var

### Issue: "Gemini parsing failed"
**Solution**:
- Verify `GEMINI_API_KEY` is set correctly
- Check Gemini service logs
- Ensure `GEMINI_SERVICE_URL` in backend points to correct URL

### Issue: "Service unavailable after 15 minutes"
**Solution**: This is expected on Render free tier. Services spin down after inactivity. First request after spin-down takes 30-60 seconds to wake up.

---

## 🎯 MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create free cluster (M0)
3. Create database user:
   - Database Access → Add New Database User
   - Username/Password authentication
   - Save credentials
4. Whitelist Render IPs:
   - Network Access → Add IP Address
   - Add `0.0.0.0/0` (allow from anywhere)
   - **Note**: For production, use specific Render IP ranges
5. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your database password
   - Use this as `MONGODB_URI` in backend

---

## 📊 Service URLs

After deployment, save your URLs here:

```
Gemini:   https://_________________________________.onrender.com
Backend:  https://_________________________________.onrender.com  
Frontend: https://_________________________________.onrender.com
```

---

## 💡 Pro Tips

1. **Deploy in order**: Gemini → Backend → Frontend (you need URLs for env vars)
2. **Check logs**: If something fails, check Render logs first
3. **Test health endpoints**: Verify services are responding before testing frontend
4. **MongoDB whitelisting**: Don't forget to allow 0.0.0.0/0 in Network Access
5. **JWT Secret**: Generate a strong secret: `openssl rand -hex 32`
6. **Free tier spin-down**: First request after inactivity takes time to wake up
7. **HTTPS**: All Render services get free SSL certificates automatically

---

## 🔐 Security Checklist

- [ ] Strong JWT_SECRET generated
- [ ] MongoDB credentials secured
- [ ] Gemini API key not exposed in frontend
- [ ] Environment variables set in Render (not in code)
- [ ] `.env` files in `.gitignore`
- [ ] MongoDB Network Access configured

---

## 📚 Additional Resources

- Full Guide: See `DEPLOYMENT_GUIDE.md`
- Architecture: See `PROJECT_STRUCTURE.md`
- Checklist: See `DEPLOYMENT_CHECKLIST.md`
- Render Docs: https://render.com/docs

---

**Need help?** Check the full deployment guide or service-specific README files in each folder!
