import { Schema, Document } from 'mongoose';

export interface RateLimitLog extends Document {
  org_id: string;
  role_id?: string | null;       // optional for now
  user_id?: string | null;       // optional for now
  user_name?: string | null;     // optional for now
  action_type: 'edit_org' | 'edit_assistant' | string;
  org_change?: Array<{
    key: string;
    before: any;
    after: any;
  }>;
  assistant_change?: Array<{
    assistant_id: string;
    key: string;
    before: any;
    after: any;
  }>;
  updatedAt: Date;
}
  
export const RateLimitLogSchema = new Schema<RateLimitLog>({
  org_id: { type: String, required: true },
  role_id: { type: String, default: null },
  user_id: { type: String, default: null },
  user_name: { type: String, default: null },
  action_type: { type: String, required: true },
  org_change: [
    {
      key: String,
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
  ],
  assistant_change: [
    {
      assistant_id: String,
      key: String,
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});
