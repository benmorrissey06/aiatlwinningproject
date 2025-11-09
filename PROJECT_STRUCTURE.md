# AIATL Winning Project - Folder Structure

This document explains the deployment-ready folder structure.

## Folder Structure

```
aiatlwinningproject/
├── aiatlwinningproject-gemini/          # Gemini AI Parsing Service (Node.js)
│   ├── src/
│   │   ├── index.ts                     # Entry point with CORS and health check
│   │   ├── routes.ts                    # API routes for parsing
│   │   ├── services/
│   │   │   └── gemini.service.ts        # Gemini API integration
│   │   └── shared/
│   │       └── types.ts                 # TypeScript type definitions
│   ├── package.json                     # Dependencies and scripts
│   ├── tsconfig.json                    # TypeScript configuration
│   ├── nodemon.json                     # Development hot-reload config
│   ├── .env.example                     # Environment variables template
│   ├── .gitignore
│   └── README.md
│
├── aiatlwinningproject-backend/         # Python Backend Service (FastAPI)
│   ├── app.py                           # Main FastAPI application
│   ├── auth.py                          # Authentication logic
│   ├── database.py                      # MongoDB connection
│   ├── feature_encoder.py               # ML feature encoding
│   ├── models.py                        # Pydantic models
│   ├── requirements.txt                 # Python dependencies
│   ├── MLmodel/
│   │   ├── matchmaker_model.joblib      # Trained ML model
│   │   └── model_columns.json           # Model feature columns
│   ├── synthetic-data/                  # Training data files
│   ├── campus_sellers.json              # Demo seller profiles
│   ├── .env.example                     # Environment variables template
│   ├── .gitignore
│   └── README.md
│
├── aiatlwinningproject-frontend/        # React Frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── main.tsx                     # Entry point
│   │   ├── App.tsx                      # Main app component
│   │   ├── components/                  # Reusable UI components
│   │   ├── pages/                       # Page components
│   │   ├── routes/                      # React Router configuration
│   │   ├── services/                    # API service layer
│   │   ├── lib/                         # Utilities and API client
│   │   └── types/                       # TypeScript types
│   ├── public/                          # Static assets
│   ├── index.html                       # HTML entry point
│   ├── package.json                     # Dependencies and scripts
│   ├── tsconfig.json                    # TypeScript configuration
│   ├── vite.config.ts                   # Vite build configuration
│   ├── tailwind.config.js               # Tailwind CSS configuration
│   ├── postcss.config.js                # PostCSS configuration
│   ├── .env.example                     # Environment variables template
│   ├── .gitignore
│   └── README.md
│
├── DEPLOYMENT_GUIDE.md                  # Complete deployment instructions
└── render.yaml                          # Render.com IaC configuration (optional)
```

## Service Communication

```
┌─────────────────────┐
│   User's Browser    │
│    (Frontend)       │
└──────────┬──────────┘
           │
           │ HTTPS
           │
           ▼
┌─────────────────────┐
│   Backend Service   │
│    (Python/FastAPI) │
└──────────┬──────────┘
           │
           │ HTTPS
           │
           ▼
┌─────────────────────┐
│   Gemini Service    │
│   (Node.js/Express) │
└─────────────────────┘
```

## Environment Variables

### Gemini Service
- `GEMINI_API_KEY` - Your Google Gemini API key
- `PORT` - Port to run on (Render sets this automatically)

### Backend Service
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GEMINI_SERVICE_URL` - URL of deployed Gemini service
- `PORT` - Port to run on (Render sets this automatically)

### Frontend
- `VITE_API_BASE_URL` - URL of deployed backend service

## Key Changes from Original Project

### 1. Import Statements (Backend)
- Changed from relative imports (`.feature_encoder`) to absolute imports (`feature_encoder`)
- This is required for the standalone backend deployment

### 2. Path Configuration (Backend)
- Changed `ROOT_DIR = Path(__file__).resolve().parent.parent` 
- To: `ROOT_DIR = Path(__file__).resolve().parent`
- This is because the backend folder IS the root now

### 3. CORS Configuration
- Enabled CORS for all origins (`*`) in both services
- Required for cross-origin requests in production

### 4. API Base URL (Frontend)
- Frontend uses `VITE_API_BASE_URL` environment variable
- Falls back to proxy in development mode
- Directly calls backend URL in production

### 5. Port Configuration
- All services use `process.env.PORT` or `os.getenv("PORT")`
- This allows Render to assign ports dynamically

## Deployment Order

1. **Gemini Service** (Deploy first)
   - Copy the deployed URL
   
2. **Backend Service** (Deploy second)
   - Use Gemini URL in environment variables
   - Copy the deployed URL

3. **Frontend** (Deploy last)
   - Use Backend URL in environment variables

## Testing the Deployment

After all services are deployed:

1. Check health endpoints:
   - Gemini: `https://your-gemini.onrender.com/health`
   - Backend: `https://your-backend.onrender.com/health`

2. Open frontend URL in browser

3. Test user registration and login

4. Create a flash request to verify end-to-end communication

## Development vs Production

### Development (Localhost)
- Frontend proxy handles API routing
- All services run on localhost
- Use `.env` files for configuration

### Production (Render)
- No proxy needed
- Services communicate via public URLs
- Environment variables set in Render dashboard

## Common Issues and Solutions

### Issue: Services can't communicate
**Solution**: Verify environment variables are set correctly with deployed URLs

### Issue: CORS errors in browser
**Solution**: Check backend CORS configuration allows the frontend origin

### Issue: MongoDB connection failed
**Solution**: Whitelist all IPs (0.0.0.0/0) in MongoDB Atlas Network Access

### Issue: Gemini API errors
**Solution**: Verify GEMINI_API_KEY is set correctly in Gemini service

### Issue: Frontend routes return 404
**Solution**: Add rewrite rule in Render (/* → /index.html)

## Security Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong JWT secrets** - Generate with `openssl rand -hex 32`
3. **Restrict CORS in production** - Consider limiting origins to your frontend domain
4. **Use environment variables** - Never hardcode credentials in code
5. **Keep dependencies updated** - Run `npm audit` and `pip-audit` regularly

## Maintenance

### Updating Code
1. Push changes to GitHub
2. Render auto-deploys on push (if enabled)
3. Check logs for any deployment errors

### Monitoring
- Use Render dashboard to view logs
- Set up uptime monitoring (e.g., UptimeRobot)
- Monitor MongoDB Atlas metrics

### Scaling
- Free tier is limited to 750 hours/month per web service
- Upgrade to paid plans for:
  - No spin-down
  - More compute resources
  - Better performance
  - Custom domains

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
