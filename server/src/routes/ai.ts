import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import Contact from '../models/Contact';

const router = Router();

function getClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');
  return new Groq({ apiKey: key });
}

// Relationship arc summarizer — the core AI feature
router.post('/relationship-summary/:contactId', async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findById(req.params.contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    if (contact.encounters.length < 1) {
      return res.status(400).json({ error: 'No encounters to summarize' });
    }

    const client = getClient();

    const sorted = [...contact.encounters].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const encounterText = sorted
      .map((e, i) => {
        const parts = [
          `Encounter ${i + 1}: ${e.conferenceName} (${new Date(e.date).toLocaleDateString()})`,
          `Role: ${e.jobTitle || 'unknown'} at ${e.company || 'unknown'}`,
          `Intent signal: ${e.intent ?? 'unset'}`,
          `Tags: ${e.tags?.length ? e.tags.join(', ') : 'none'}`,
          `Notes: ${e.notes || '(no notes)'}`,
          e.repName ? `Rep: ${e.repName}` : null,
        ];
        return parts.filter(Boolean).join('\n');
      })
      .join('\n\n');

    const prompt = `You are a sales intelligence assistant for Grain, a B2B fintech company that helps PSPs, FX companies, and corporate treasurers manage currency risk.

A salesperson has met the following contact across multiple conferences. Each encounter includes an intent signal (hot/warm/cold) logged by the rep in the moment, and tags for what topics came up.

Contact: ${contact.firstName} ${contact.lastName}
Current role: ${contact.currentJobTitle} at ${contact.currentCompany}
Total encounters: ${contact.encounters.length}

Encounter history (chronological):
${encounterText}

Write a 2-3 sentence relationship arc for this contact. Be direct — a rep reads this in 5 seconds before a follow-up call.

Cover:
1. Trajectory: is intent warming, cooling, or stalled across encounters? Cite the signals explicitly (e.g. "went cold→warm→hot", or "tagged 'Not a fit' twice").
2. Verdict: worth active pursuit, or tire-kicker? Be blunt — if the pattern looks like polite avoidance, say so.
3. Next move: one concrete action (e.g. "push for a demo", "deprioritise — re-engage only if role changes", "loop in solutions engineer on pricing").

No generic advice. No filler. If data is thin, say so and flag what's missing.`;

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const summary = completion.choices[0].message.content!;

    contact.relationshipSummary = summary;
    contact.relationshipSummaryGeneratedAt = new Date();
    await contact.save();

    res.json({ summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(500).json({ error: message });
  }
});

export default router;
