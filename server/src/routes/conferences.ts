import { Router, Request, Response } from 'express';
import Conference from '../models/Conference';
import { computeIcpScore } from '../lib/scoring';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { vertical, region, tier, attending, search, sort } = req.query;
    const filter: Record<string, unknown> = {};

    if (vertical) filter.vertical = { $in: [vertical] };
    if (region) filter.region = region;
    if (tier) filter.tier = tier;
    if (attending === 'true') filter.attending = true;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const sortOrder: Record<string, 1 | -1> = sort === 'date' ? { date: 1 } : { icpScore: -1 };
    const conferences = await Conference.find(filter).sort(sortOrder);
    res.json(conferences);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conferences' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const conference = await Conference.findById(req.params.id);
    if (!conference) return res.status(404).json({ error: 'Not found' });
    res.json(conference);
  } catch {
    res.status(500).json({ error: 'Failed to fetch conference' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { vertical, estimatedAttendees, region, prestige = 5, ...rest } = req.body;
    const { icpScore, icpScoreBreakdown, tier } = computeIcpScore({
      vertical,
      estimatedAttendees,
      region,
      prestige,
    });
    const conference = await Conference.create({
      ...rest,
      vertical,
      estimatedAttendees,
      region,
      icpScore,
      icpScoreBreakdown,
      tier,
    });
    res.status(201).json(conference);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create conference' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const conference = await Conference.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!conference) return res.status(404).json({ error: 'Not found' });
    res.json(conference);
  } catch {
    res.status(500).json({ error: 'Failed to update conference' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Conference.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete conference' });
  }
});

export default router;
