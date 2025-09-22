import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI_ANNA ?? '', {
      connectionName: 'anna',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI_UNIVERSITY ?? '', {
      connectionName: 'university',
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], 'university'),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}