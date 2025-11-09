# 🎯 AIATL Winning Project - Deployment Ready

A campus marketplace platform with AI-powered matching, built with React, FastAPI, and Google Gemini AI.

## 📁 Deployment Folders

This repository contains three deployment-ready folders:

### 1. `aiatlwinningproject-gemini/` 
**Gemini AI Parsing Service** - Node.js/TypeScript service that handles AI-powered parsing of buyer requests and seller profiles.
- Technology: Node.js + Express + TypeScript + Google Gemini AI
- Port: 3001 (default)
- [See Gemini README](./aiatlwinningproject-gemini/README.md)

### 2. `aiatlwinningproject-backend/`
**Backend API Service** - Python/FastAPI service that handles business logic, matching, and data persistence.
- Technology: Python + FastAPI + MongoDB + ML Model
- Port: 8000 (default)
- [See Backend README](./aiatlwinningproject-backend/README.md)

### 3. `aiatlwinningproject-frontend/`
**Frontend Web Application** - React SPA with TypeScript and Tailwind CSS.
- Technology: React + TypeScript + Vite + Tailwind CSS
- Port: 5173 (development)
- [See Frontend README](./aiatlwinningproject-frontend/README.md)

## 🚀 Quick Start

### For Deployment on Render

Follow the step-by-step guide:
1. **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Quick checklist format
2. **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Detailed instructions
3. **[Project Structure](./PROJECT_STRUCTURE.md)** - Architecture documentation

### For Local Development

Each folder can run independently:

```bash
# Terminal 1 - Gemini Service
cd aiatlwinningproject-gemini
npm install
cp .env.example .env  # Add your GEMINI_API_KEY
npm run dev

# Terminal 2 - Backend Service
cd aiatlwinningproject-backend
pip install -r requirements.txt
cp .env.example .env  # Add your MONGODB_URI, JWT_SECRET, and GEMINI_SERVICE_URL
uvicorn app:app --reload

# Terminal 3 - Frontend
cd aiatlwinningproject-frontend
npm install
cp .env.example .env  # Add your VITE_API_BASE_URL
npm run dev
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                       │
│              (React Frontend - Port 5173)               │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend API Service                    │
│              (FastAPI - Port 8000)                      │
│                                                         │
│  • User Authentication (JWT)                            │
│  • Match Making Logic                                   │
│  • Database Operations                                  │
│  • Business Logic                                       │
└────────────┬────────────────────────┬───────────────────┘
             │                        │
             │ HTTP                   │ MongoDB
             ▼                        ▼
┌────────────────────────┐    ┌──────────────┐
│   Gemini Service       │    │   MongoDB    │
│   (Node.js - 3001)     │    │    Atlas     │
│                        │    │              │
│  • Parse Requests      │    │  • Users     │
│  • Parse Profiles      │    │  • Profiles  │
│  • AI Processing       │    │  • Messages  │
└────────────────────────┘    └──────────────┘
```

## ✨ Features

- 🔐 **User Authentication** - JWT-based secure authentication
- 🤖 **AI-Powered Parsing** - Google Gemini AI parses natural language requests
- 🎯 **Smart Matching** - ML model matches buyers with sellers
- 💬 **Messaging System** - Real-time communication between users
- ⭐ **Trust Scores** - Track user reputation and transaction history
- 📱 **Responsive Design** - Works on desktop and mobile devices

## 🔑 Environment Variables

### Required for Deployment

**Gemini Service:**
- `GEMINI_API_KEY` - Your Google Gemini API key

**Backend Service:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (generate with `openssl rand -hex 32`)
- `GEMINI_SERVICE_URL` - URL of deployed Gemini service

**Frontend:**
- `VITE_API_BASE_URL` - URL of deployed backend service

See `.env.example` files in each folder for templates.

## 📚 Documentation

- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment checklist
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Detailed architecture documentation
- **[render.yaml](./render.yaml)** - Infrastructure as Code for Render (optional)

## 🛠️ Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand (state management)
- Framer Motion (animations)

### Backend
- Python 3.11+
- FastAPI
- MongoDB (Motor driver)
- JWT Authentication
- scikit-learn (ML model)
- Pydantic (data validation)

### Gemini Service
- Node.js
- TypeScript
- Express
- Google Generative AI SDK

## 🧪 Testing

### Health Checks

After deployment, verify services are running:

```bash
# Gemini Service
curl https://your-gemini-service.onrender.com/health

# Backend Service
curl https://your-backend-service.onrender.com/health
```

### End-to-End Testing

1. Open frontend URL
2. Register a new user
3. Create a flash request
4. View matched sellers
5. Send a message

## 📦 What's Included

Each deployment folder includes:
- ✅ Source code
- ✅ Configuration files
- ✅ Environment variable templates
- ✅ .gitignore
- ✅ README with deployment instructions
- ✅ All necessary dependencies

## 🔒 Security Notes

1. **Never commit `.env` files** - Use `.env.example` as templates
2. **Use strong secrets** - Generate JWT_SECRET with `openssl rand -hex 32`
3. **Restrict CORS in production** - Consider limiting origins
4. **Keep dependencies updated** - Run security audits regularly
5. **MongoDB Network Access** - Whitelist Render IPs (or use 0.0.0.0/0 for testing)

## 🌐 Deployment Platforms

Optimized for **Render.com**, but can be deployed on:
- ✅ Render (recommended)
- ✅ Heroku
- ✅ Railway
- ✅ AWS (EC2, Elastic Beanstalk)
- ✅ Google Cloud Platform
- ✅ Azure

## 💰 Cost

All services can run on **free tiers**:
- Render: Free tier includes 750 hours/month per web service
- MongoDB Atlas: Free tier (512 MB storage)
- Google Gemini API: Free tier available

**Note:** Free tier services may spin down after 15 minutes of inactivity.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

[Your License Here]

## 🆘 Support

For deployment issues:
1. Check service logs in Render dashboard
2. Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. Verify environment variables
4. Check health endpoints
5. Review service-specific README files

## 🎯 Next Steps

1. **[Read the Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Start here!
2. Set up MongoDB Atlas account
3. Get Gemini API key
4. Deploy services in order: Gemini → Backend → Frontend
5. Test end-to-end functionality

---

**Ready to deploy?** Start with the [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)! 🚀
