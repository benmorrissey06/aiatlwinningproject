# AIATL Winning Project - Backend

This is the FastAPI backend service for the AIATL marketplace project.

## Environment Variables

Create a `.env` file based on `.env.example`:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_here
GEMINI_SERVICE_URL=https://your-gemini-service.onrender.com
```

## Local Development

```bash
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Note: When running locally, the `app.py` imports will need to be adjusted:
- Change `from .feature_encoder import` to `from feature_encoder import`
- Change `from .database import` to `from database import`
- Change `from .models import` to `from models import`
- Change `from .auth import` to `from auth import`

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your repository
3. Set the root directory to `aiatlwinningproject-backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GEMINI_SERVICE_URL`

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/profile/{user_id}` - Get user profile
- `POST /api/match` - Find matches for buyer request
- And many more...
