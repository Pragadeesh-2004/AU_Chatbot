import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GuestRateLimitService } from './guest-rate-limit.service';
import { GuestChatbotController } from './guest-chatbot.controller';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [
    ChatbotModule,
    ConfigModule // Add ConfigModule
  ],
  providers: [GuestRateLimitService],
  controllers: [GuestChatbotController],
  exports: [GuestRateLimitService]
})
export class GuestRateLimitModule {}