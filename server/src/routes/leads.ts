import { Router, Request, Response } from 'express';
import Lead from '../models/Lead';
import Contact from '../models/Contact';
import { findOrCreateContact } from '../lib/contactMatcher';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { conferenceId, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (conferenceId) filter.conferenceId = conferenceId;
    if (status) filter.status = status;
    const leads = await Lead.find(filter).sort({ capturedAt: -1 });
    res.json(leads);
  } catch {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Field capture endpoint — called from the mobile interface
router.post('/', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.create({ ...req.body, capturedAt: new Date() });

    // Attempt to match/create a contact in the background
    findOrCreateContact(lead).then(async (contact) => {
      lead.contactId = contact._id as typeof lead.contactId;
      lead.status = 'matched';
      await lead.save();
    }).catch(() => { /* non-blocking */ });

    res.status(201).json(lead);
  } catch (err) {
    res.status(400).json({ error: 'Failed to capture lead' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Not found' });
    res.json(lead);
  } catch {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

export default router;
