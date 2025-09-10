import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssistantDocument = Assistant & Document;

@Schema({ collection: 'assistants',timestamps: true })
export class Assistant {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Organisation', required: true })
  org_id: Types.ObjectId;
}

export const AssistantSchema = SchemaFactory.createForClass(Assistant);

