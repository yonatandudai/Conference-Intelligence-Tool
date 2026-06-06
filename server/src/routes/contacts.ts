import { Router, Request, Response } from 'express';
import Contact from '../models/Contact';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, multiConference } = req.query;
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { currentCompany: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter to only contacts seen at 2+ conferences (the interesting ones)
    if (multiConference === 'true') {
      filter.$expr = { $gte: [{ $size: '$encounters' }, 2] };
    }

    const contacts = await Contact.find(filter).sort({ updatedAt: -1 });
    res.json(contacts);
  } catch {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Not found' });
    res.json(contact);
  } catch {
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contact) return res.status(404).json({ error: 'Not found' });
    res.json(contact);
  } catch {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

export default router;
