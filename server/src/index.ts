import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import conferencesRouter from './routes/conferences';
import contactsRouter from './routes/contacts';
import leadsRouter from './routes/leads';
import aiRouter from './routes/ai';
import hubspotRouter from './routes/hubspot';
import seedRouter from './routes/seed';
import settingsRouter from './routes/settings';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set in your .env file.');
  process.exit(1);
}

const app = express();

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
app.use(cors({ origin: clientUrl }));
app.use(express.json());

// Lazy DB connection — reuses existing connection across serverless invocations
let dbConnected = false;
app.use(async (_req, _res, next) => {
  if (!dbConnected) {
    await mongoose.connect(MONGODB_URI!);
    dbConnected = true;
  }
  next();
});

app.use('/api/conferences', conferencesRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/hubspot', hubspotRouter);
app.use('/api/seed', seedRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Local dev: listen normally. Vercel: export the app.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
