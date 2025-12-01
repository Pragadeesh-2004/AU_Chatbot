import { Module, forwardRef } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { AdminModule } from 'src/admin/admin.module';
import { AuthenticationModule } from 'src/authentication/authentication.module';

@Module({
  imports: [
    AdminModule,
    forwardRef(() => AuthenticationModule)
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService]
})
export class ChatbotModule {}