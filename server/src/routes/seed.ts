import { Router, Request, Response } from 'express';
import Conference from '../models/Conference';
import { getConferenceSeedData } from '../data/conferences';

const router = Router();

router.post('/', async (_req: Request, res: Response) => {
  try {
    const existing = await Conference.countDocuments();
    if (existing > 0) {
      return res.json({ message: `Already seeded (${existing} conferences exist). Delete all to re-seed.` });
    }
    const data = getConferenceSeedData();
    await Conference.insertMany(data);
    res.json({ message: `Seeded ${data.length} conferences successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed' });
  }
});

router.delete('/', async (_req: Request, res: Response) => {
  try {
    await Conference.deleteMany({});
    res.json({ message: 'All conferences deleted.' });
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
