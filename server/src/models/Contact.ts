import mongoose, { Document, Schema } from 'mongoose';

export interface IEncounter {
  conferenceId: mongoose.Types.ObjectId;
  conferenceName: string;
  date: Date;
  notes: string;
  jobTitle: string;
  company: string;
  repName: string;
  intent: 'hot' | 'warm' | 'cold';
  tags: string[];
}

export interface IContact extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentJobTitle: string;
  currentCompany: string;
  linkedin: string;
  encounters: IEncounter[];
  relationshipSummary: string;
  relationshipSummaryGeneratedAt?: Date;
  hubspotContactId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EncounterSchema = new Schema<IEncounter>({
  conferenceId: { type: Schema.Types.ObjectId, ref: 'Conference', required: true },
  conferenceName: { type: String, required: true },
  date: { type: Date, required: true },
  notes: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  company: { type: String, default: '' },
  repName: { type: String, default: '' },
  intent: { type: String, enum: ['hot', 'warm', 'cold'], default: 'warm' },
  tags: [{ type: String }],
});

const ContactSchema = new Schema<IContact>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, default: '', index: true },
    phone: { type: String, default: '' },
    currentJobTitle: { type: String, default: '' },
    currentCompany: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    encounters: [EncounterSchema],
    relationshipSummary: { type: String, default: '' },
    relationshipSummaryGeneratedAt: { type: Date },
    hubspotContactId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IContact>('Contact', ContactSchema);
