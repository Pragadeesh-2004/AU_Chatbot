import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrganisationDocument = Organisation & Document;

@Schema({ timestamps: true })
export class Organisation {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: ['central', 'state'], required: true })
  level: string;

  @Prop({ type: String, enum: ['active', 'inactive'], default: 'active' })
  status: string;
}

export const OrganisationSchema = SchemaFactory.createForClass(Organisation);
