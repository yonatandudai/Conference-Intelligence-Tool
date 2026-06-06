import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  conferenceId: mongoose.Types.ObjectId;
  conferenceName: string;
  repName: string;
  notes: string;
  intent: 'hot' | 'warm' | 'cold';
  tags: string[];
  capturedAt: Date;
  contactId?: mongoose.Types.ObjectId;
  hubspotDealId?: string;
  status: 'new' | 'matched' | 'synced_to_hubspot';
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    company: { type: String, required: true },
    conferenceId: { type: Schema.Types.ObjectId, ref: 'Conference', required: true },
    conferenceName: { type: String, required: true },
    repName: { type: String, default: '' },
    notes: { type: String, default: '' },
    intent: { type: String, enum: ['hot', 'warm', 'cold'], default: 'warm' },
    tags: [{ type: String }],
    capturedAt: { type: Date, default: Date.now },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    hubspotDealId: { type: String },
    status: { type: String, enum: ['new', 'matched', 'synced_to_hubspot'], default: 'new' },
  },
  { timestamps: true }
);

export default mongoose.model<ILead>('Lead', LeadSchema);
