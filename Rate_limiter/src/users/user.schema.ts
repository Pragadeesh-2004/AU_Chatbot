import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../common/enums/roles.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: Role, required: true })
  role: Role;

  @Prop({ type: Types.ObjectId, ref: 'Organisation', default: null })
  organisation_id: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
