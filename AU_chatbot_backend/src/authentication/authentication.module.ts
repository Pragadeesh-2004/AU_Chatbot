import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { User, UserSchema } from './schemas/user.schema';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from 'src/auth/auth.module';
import { ChatbotModule } from 'src/chatbot/chatbot.module'; // ✅ Import ChatbotModule
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI_ANNA ?? '', {
      connectionName: 'anna',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI_UNIVERSITY ?? '', {
      connectionName: 'university',
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], 'university'),
    forwardRef(() => AdminModule),
    forwardRef(() => AuthModule),
    forwardRef(() => ChatbotModule), // ✅ Use forwardRef for ChatbotModule
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' }
    })
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}

