# AIATL Winning Project - Frontend

This is the React + TypeScript frontend for the AIATL marketplace project.

## Environment Variables

Create a `.env` file based on `.env.example`:

```
VITE_API_BASE_URL=https://your-backend-service.onrender.com
```

## Local Development

```bash
npm install
npm run dev
```

The app will run on `http://localhost:5173`

## Production Build

```bash
npm run build
```

## Deployment on Render

1. Create a new Static Site on Render
2. Connect your repository
3. Set the root directory to `aiatlwinningproject-frontend`
4. Build Command: `npm install && npm run build`
5. Publish Directory: `dist`
6. Add environment variable:
   - `VITE_API_BASE_URL` - URL of your deployed backend service

### Important: Static Site Configuration

For proper routing with React Router, you need to add the following rewrite rule in Render:
- Go to your Static Site settings
- Under "Redirects/Rewrites", add:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`

This ensures that all routes are handled by the React app.

## Features

- User authentication
- Flash request creation
- Seller profile management
- Match discovery
- Real-time messaging
- Trust score tracking
