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

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set in your .env file.');
  process.exit(1);
}

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

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

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
