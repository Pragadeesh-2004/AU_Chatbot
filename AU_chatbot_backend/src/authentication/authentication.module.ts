import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { User, UserSchema } from './schemas/user.schema';
import { AdminModule } from '../admin/admin.module'; // Add this import

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI_ANNA ?? '', {
      connectionName: 'anna',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI_UNIVERSITY ?? '', {
      connectionName: 'university',
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], 'university'),
    AdminModule, // Add AdminModule to imports
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}

