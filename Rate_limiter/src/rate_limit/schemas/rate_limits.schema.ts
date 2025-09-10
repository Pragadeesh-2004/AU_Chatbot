import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RateLimitDocument = RateLimit & Document;

@Schema({ _id: false })
class AssistantLimit {
  @Prop({ type: Types.ObjectId, ref: 'Assistant', required: true })
  assistant_id: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  input_token_per_user: number;

  @Prop({ type: Number, default: 0 })
  input_token_per_assistant: number;

  @Prop({ type: Number, default: 0 })
  output_token_per_user: number;

  @Prop({ type: Number, default: 0 })
  output_token_per_assistant: number;

  @Prop({ type: Number, default: 0 })
  file_count: number;

  @Prop({ type: Number, default: 0 })
  file_size: number;

  @Prop({ type: Number, default: 0 })
  knowledge_base_index_size: number;
}

@Schema({ collection: 'rate_limits', timestamps: true })
export class RateLimit {
  @Prop({ type: Types.ObjectId, ref: 'Organisation', required: true })
  org_id: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  max_input_token: number;

  @Prop({ type: Number, default: 0 })
  max_output_token: number;

  @Prop({ type: Number, default: 0 })
  file_count: number;

  @Prop({ type: Number, default: 0 })
  file_size: number;

  @Prop({ type: [AssistantLimit], default: [] })
  assistants: AssistantLimit[];

  @Prop({ type: Number, default: 0 })
  knowledge_base_count: number;

  @Prop({ type: Number, default: 0 })
  knowledge_base_index_size: number;

  @Prop({ type: Number, default: 0 })
  active_assistant_count: number;
}

export const RateLimitSchema = SchemaFactory.createForClass(RateLimit);
