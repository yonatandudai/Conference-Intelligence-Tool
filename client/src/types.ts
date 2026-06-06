export interface ScoreBreakdown {
  verticalFit: number;
  audienceSize: number;
  geographicReach: number;
  prestige: number;
}

export type Conference = {
  _id: string;
  name: string;
  date: string;
  endDate?: string;
  location: string;
  city: string;
  country: string;
  region: string;
  vertical: string[];
  estimatedAttendees: number;
  website: string;
  description: string;
  icpScore: number;
  icpScoreBreakdown: ScoreBreakdown;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  assignedRep?: string;
  attending: boolean;
  notes: string;
}

export type Encounter = {
  conferenceId: string;
  conferenceName: string;
  date: string;
  notes: string;
  jobTitle: string;
  company: string;
  repName: string;
  intent: 'hot' | 'warm' | 'cold';
  tags: string[];
}

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentJobTitle: string;
  currentCompany: string;
  linkedin: string;
  encounters: Encounter[];
  relationshipSummary: string;
  relationshipSummaryGeneratedAt?: string;
  hubspotContactId?: string;
}

export interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  conferenceId: string;
  conferenceName: string;
  repName: string;
  notes: string;
  intent: 'hot' | 'warm' | 'cold';
  tags: string[];
  capturedAt: string;
  status: 'new' | 'matched' | 'synced_to_hubspot';
  hubspotDealId?: string;
  contactId?: string;
}
