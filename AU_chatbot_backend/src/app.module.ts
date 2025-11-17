import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './authentication/authentication.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { AdminModule } from './admin/admin.module';
import { GuestRateLimitService } from './guest-rate-limit/guest-rate-limit.service';
import { GuestChatbotController } from './guest-rate-limit/guest-chatbot.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ Move the Mongoose connections here
    MongooseModule.forRoot(process.env.MONGO_URI_ANNA ?? '', {
      connectionName: 'anna',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI_UNIVERSITY ?? '', {
      connectionName: 'university',
    }),

    AuthenticationModule,
    ChatbotModule,
    AdminModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [
    AppController,
    GuestChatbotController,
  ],
  providers: [
    AppService,
    GuestRateLimitService,
  ],
})
export class AppModule {}
