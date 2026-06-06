import { Router, Request, Response } from 'express';
import axios from 'axios';
import Lead from '../models/Lead';
import Contact from '../models/Contact';
import Settings from '../models/Settings';

const router = Router();

async function getHubSpotClient() {
  const settings = await Settings.findOne();
  const key = settings?.hubspotApiKey || process.env.HUBSPOT_API_KEY;
  if (!key) throw new Error('HubSpot API key not configured. Add it in Settings.');
  return axios.create({
    baseURL: 'https://api.hubapi.com',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  });
}

// Push a single lead to HubSpot as a contact
router.post('/sync-lead/:leadId', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const client = await getHubSpotClient();

    const properties = {
      firstname: lead.firstName,
      lastname: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      jobtitle: lead.jobTitle,
      company: lead.company,
      hs_lead_status: lead.intent === 'hot' ? 'IN_PROGRESS' : 'NEW',
    };

    const response = await client.post('/crm/v3/objects/contacts', { properties });
    const hubspotContactId = response.data.id;

    lead.hubspotDealId = hubspotContactId;
    lead.status = 'synced_to_hubspot';
    await lead.save();

    // Also update the matched contact record
    if (lead.contactId) {
      await Contact.findByIdAndUpdate(lead.contactId, { hubspotContactId });
    }

    res.json({ success: true, hubspotContactId });
  } catch (err: unknown) {
    const axErr = err as { response?: { data?: unknown; status?: number }; message?: string };
    const message = axErr.response?.data ?? axErr.message ?? 'HubSpot sync failed';
    res.status(500).json({ error: message });
  }
});

// Bulk sync all unsynced leads from a conference
router.post('/sync-conference/:conferenceId', async (req: Request, res: Response) => {
  try {
    const leads = await Lead.find({
      conferenceId: req.params.conferenceId,
      status: { $ne: 'synced_to_hubspot' },
    });

    const client = await getHubSpotClient();
    const results = [];

    for (const lead of leads) {
      try {
        const properties = {
          firstname: lead.firstName,
          lastname: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          jobtitle: lead.jobTitle,
          company: lead.company,
          hs_lead_status: lead.intent === 'hot' ? 'IN_PROGRESS' : 'NEW',
        };
        const response = await client.post('/crm/v3/objects/contacts', { properties });
        lead.hubspotDealId = response.data.id;
        lead.status = 'synced_to_hubspot';
        await lead.save();
        results.push({ leadId: lead._id, success: true });
      } catch {
        results.push({ leadId: lead._id, success: false });
      }
    }

    res.json({ synced: results.filter((r) => r.success).length, total: leads.length, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bulk sync failed';
    res.status(500).json({ error: message });
  }
});

export default router;
