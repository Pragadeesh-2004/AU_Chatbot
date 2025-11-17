import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { User, UserSchema } from './schemas/user.schema';
import { AdminModule } from '../admin/admin.module';
import { ChatbotModule } from 'src/chatbot/chatbot.module';
import { AuthModule } from 'src/auth/auth.module'; // provides AuthService

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI_ANNA ?? '', {
      connectionName: 'anna',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI_UNIVERSITY ?? '', {
      connectionName: 'university',
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], 'university'),
    // use forwardRef to avoid circular dependency issues and ensure exported providers are available
    forwardRef(() => AdminModule),
    forwardRef(() => ChatbotModule),
    forwardRef(() => AuthModule), // <-- ensure AuthService provider is available
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}

