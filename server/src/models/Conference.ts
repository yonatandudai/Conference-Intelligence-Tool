import mongoose, { Document, Schema } from 'mongoose';

export interface IConference extends Document {
  name: string;
  date: Date;
  endDate?: Date;
  location: string;
  city: string;
  country: string;
  region: 'North America' | 'Europe' | 'Asia Pacific' | 'Latin America' | 'Middle East & Africa';
  vertical: string[];
  estimatedAttendees: number;
  website: string;
  description: string;
  icpScore: number;
  icpScoreBreakdown: {
    verticalFit: number;
    audienceSize: number;
    geographicReach: number;
    prestige: number;
  };
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  assignedRep?: string;
  attending: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConferenceSchema = new Schema<IConference>(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    region: {
      type: String,
      enum: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'],
      required: true,
    },
    vertical: [{ type: String }],
    estimatedAttendees: { type: Number, default: 0 },
    website: { type: String, default: '' },
    description: { type: String, default: '' },
    icpScore: { type: Number, min: 0, max: 100, default: 0 },
    icpScoreBreakdown: {
      verticalFit: { type: Number, default: 0 },
      audienceSize: { type: Number, default: 0 },
      geographicReach: { type: Number, default: 0 },
      prestige: { type: Number, default: 0 },
    },
    tier: { type: String, enum: ['Tier 1', 'Tier 2', 'Tier 3'], default: 'Tier 3' },
    assignedRep: { type: String },
    attending: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IConference>('Conference', ConferenceSchema);
