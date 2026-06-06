interface ScoringInput {
  vertical: string[];
  estimatedAttendees: number;
  region: string;
  prestige: number; // 0-15, set manually per event
}

interface ScoreBreakdown {
  verticalFit: number;
  audienceSize: number;
  geographicReach: number;
  prestige: number;
}

const HIGH_ICP_VERTICALS = ['fintech', 'payments', 'crypto', 'blockchain', 'fx', 'forex', 'treasury', 'banking'];
const MED_ICP_VERTICALS = ['travel', 'hospitality', 'cross-border', 'remittance', 'saas', 'b2b finance'];

function verticalFitScore(verticals: string[]): number {
  const normalized = verticals.map((v) => v.toLowerCase());
  if (normalized.some((v) => HIGH_ICP_VERTICALS.some((h) => v.includes(h)))) return 40;
  if (normalized.some((v) => MED_ICP_VERTICALS.some((m) => v.includes(m)))) return 25;
  return 8;
}

function audienceSizeScore(attendees: number): number {
  if (attendees >= 10000) return 25;
  if (attendees >= 5000) return 20;
  if (attendees >= 2000) return 15;
  if (attendees >= 1000) return 12;
  if (attendees >= 500) return 8;
  return 4;
}

function geographicReachScore(region: string): number {
  // Global flagships get full points; regional conferences still valuable for clustering
  const globalRegions = ['North America', 'Europe'];
  if (globalRegions.includes(region)) return 20;
  if (region === 'Asia Pacific') return 15;
  return 10;
}

export function computeIcpScore(input: ScoringInput): {
  icpScore: number;
  icpScoreBreakdown: ScoreBreakdown;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
} {
  const breakdown: ScoreBreakdown = {
    verticalFit: verticalFitScore(input.vertical),
    audienceSize: audienceSizeScore(input.estimatedAttendees),
    geographicReach: geographicReachScore(input.region),
    prestige: Math.min(15, Math.max(0, input.prestige)),
  };

  const total = breakdown.verticalFit + breakdown.audienceSize + breakdown.geographicReach + breakdown.prestige;

  let tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  if (total >= 75) tier = 'Tier 1';
  else if (total >= 50) tier = 'Tier 2';
  else tier = 'Tier 3';

  return { icpScore: total, icpScoreBreakdown: breakdown, tier };
}
