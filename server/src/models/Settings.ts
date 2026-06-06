import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  hubspotApiKey: string;
}

const SettingsSchema = new Schema<ISettings>({
  hubspotApiKey: { type: String, default: '' },
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
