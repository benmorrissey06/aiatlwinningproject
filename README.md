# FlashFind - Campus Marketplace MVP

FlashFind helps students get what they need *right now* on campus. Users post requests in natural language, and nearby students can help them out.

## Features

- ✅ User authentication with school email (.edu required)
- ✅ Post Flash Requests with natural language descriptions
- ✅ Real-time feed of all requests (newest first)
- ✅ Clean, modern UI with TailwindCSS
- ✅ Firebase integration (Auth + Firestore)
- 🔜 AI parsing for intent, item type, and urgency (placeholder ready)

## Tech Stack

- **Frontend**: Next.js 14 (React) with TypeScript
- **Styling**: TailwindCSS
- **Backend & Database**: Firebase (Firestore + Authentication)
- **Deployment**: Vercel (ready)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Firebase project (free tier works fine)

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use existing)
   - Enable **Authentication** > **Sign-in method** > **Email/Password**
   - Create a **Firestore Database** (start in test mode for MVP)
   - Go to **Project Settings** > **General** > **Your apps** > **Web app**
   - Copy your Firebase configuration

3. **Configure environment variables:**
   - Create a `.env.local` file in the root directory
   - Add your Firebase config (see `.env.example` for format):
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Note: The app runs on port 3001 by default. If port 3001 is in use, you can specify a different port:
   ```bash
   npm run dev -- -p <port-number>
   ```

5. **Open your browser:**
   - Navigate to [http://localhost:3001](http://localhost:3001)

## Project Structure

```
├── app/
│   ├── feed/              # Feed page (displays all requests)
│   ├── login/             # Login page
│   ├── new-request/       # Form to post new requests
│   ├── signup/            # Sign up page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/landing page
├── lib/
│   ├── firebase.ts        # Firebase configuration
│   └── utils.ts           # Utility functions (email validation, time formatting, AI placeholder)
└── prompt.txt             # Original project requirements
```

## Pages

- **`/`** - Landing page with links to login/signup
- **`/login`** - User login (requires .edu email)
- **`/signup`** - User registration (requires .edu email)
- **`/feed`** - Main feed showing all Flash Requests
- **`/new-request`** - Form to create a new Flash Request

## Firebase Collections

- **`users`** - User profiles (email, name, createdAt)
- **`requests`** - Flash Requests (text, userId, userName, createdAt, parsed data)

## Future Enhancements

The codebase includes a placeholder function `parseFlashRequest()` in `lib/utils.ts` for future AI integration. When ready, you can:

1. Add OpenAI API key to environment variables
2. Implement the AI parsing logic in `parseFlashRequest()`
3. The parsed data (intent, item, urgency) is already being stored with each request

## Deployment

This app is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your Firebase environment variables in Vercel's project settings
4. Deploy!

## Notes

- All authentication requires a `.edu` email address
- Requests are displayed in real-time using Firestore listeners
- Timestamps are shown in relative format (e.g., "5 minutes ago")
- The app uses client-side rendering for authentication state management

## License

This is an MVP project for educational purposes.

