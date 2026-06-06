import { Router, Request, Response } from 'express';
import Settings from '../models/Settings';

const router = Router();

async function getOrCreate() {
  const s = await Settings.findOne();
  return s ?? await Settings.create({});
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const s = await getOrCreate();
    const key = s.hubspotApiKey;
    res.json({
      hubspotApiKey: key ? `${key.slice(0, 7)}${'*'.repeat(Math.max(0, key.length - 11))}${key.slice(-4)}` : '',
      hubspotConnected: !!key,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const { hubspotApiKey } = req.body as { hubspotApiKey: string };
    const s = await getOrCreate();
    s.hubspotApiKey = hubspotApiKey?.trim() ?? '';
    await s.save();
    res.json({ success: true, hubspotConnected: !!s.hubspotApiKey });
  } catch {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
