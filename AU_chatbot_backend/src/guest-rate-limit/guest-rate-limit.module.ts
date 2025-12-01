import { Module } from '@nestjs/common';
import { GuestRateLimitService } from './guest-rate-limit.service';
import { GuestChatbotController } from './guest-chatbot.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MongooseModule.forFeature([]), ConfigModule],
  providers: [GuestRateLimitService],
  controllers: [GuestChatbotController],
  exports: [GuestRateLimitService]
})
export class GuestRateLimitModule {}