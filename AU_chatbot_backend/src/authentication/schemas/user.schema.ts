import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'user' })
export class User {
  @Prop()
  id: string;

  @Prop()
  role: string;

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  department?: string;

  @Prop()
  degree?: string;

  @Prop()
  branch?: string;

  @Prop()
  year?: string;

  @Prop()
  designation?: string;

  @Prop()
  createdAt?: Date;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);