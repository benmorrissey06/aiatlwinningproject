import 'dotenv/config';
import express from 'express';
import path from 'path';
import geminiRoutes from './routes';

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all origins in production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/', geminiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'gemini-parser' });
});

app.listen(port, () => {
  console.log('Gemini service listening on port ' + port);
});

