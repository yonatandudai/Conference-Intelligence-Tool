import Contact from '../models/Contact';
import { ILead } from '../models/Lead';

// Levenshtein distance for fuzzy name matching when no email is available
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function nameSimilarity(a: string, b: string): number {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - dist / maxLen;
}

export async function findOrCreateContact(lead: ILead) {
  const { firstName, lastName, email, jobTitle, company, conferenceId, conferenceName, repName, intent, tags } = lead;

  let contact = null;

  // 1. Email match — highest confidence
  if (email) {
    contact = await Contact.findOne({ email: email.toLowerCase() });
  }

  // 2. Fuzzy name + company match — catches name variations and business card typos
  if (!contact) {
    const candidates = await Contact.find({
      currentCompany: { $regex: company, $options: 'i' },
    });

    for (const c of candidates) {
      const firstSim = nameSimilarity(c.firstName, firstName);
      const lastSim = nameSimilarity(c.lastName, lastName);
      // Both first and last name must be >80% similar
      if (firstSim > 0.8 && lastSim > 0.8) {
        contact = c;
        break;
      }
    }
  }

  const encounter = {
    conferenceId,
    conferenceName,
    date: lead.capturedAt,
    notes: lead.notes,
    jobTitle,
    company,
    repName,
    intent,
    tags,
  };

  if (contact) {
    // Update current role if the job title changed (people switch jobs between conferences)
    if (jobTitle && jobTitle !== contact.currentJobTitle) {
      contact.currentJobTitle = jobTitle;
      contact.currentCompany = company;
    }
    contact.encounters.push(encounter);
    await contact.save();
    return contact;
  }

  // Create new contact
  return Contact.create({
    firstName,
    lastName,
    email: email?.toLowerCase() || '',
    phone: lead.phone,
    currentJobTitle: jobTitle,
    currentCompany: company,
    encounters: [encounter],
  });
}
