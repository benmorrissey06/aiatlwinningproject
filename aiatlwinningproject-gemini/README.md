# AIATL Winning Project - Gemini Service

This is the Gemini AI parsing service for the AIATL marketplace project.

## Environment Variables

Create a `.env` file based on `.env.example`:

```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

## Local Development

```bash
npm install
npm run dev
```

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your repository
3. Set the root directory to `aiatlwinningproject-gemini`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add environment variable: `GEMINI_API_KEY`

## API Endpoints

- `POST /api/parse-request` - Parse buyer request text
- `POST /api/parse-profile` - Parse seller profile text
