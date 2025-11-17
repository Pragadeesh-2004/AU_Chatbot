import { Module, forwardRef } from "@nestjs/common";
import { ChatbotService } from "./chatbot.service";
import { ChatbotController } from "./chatbot.controller";
import { AdminModule } from "../admin/admin.module";
import { AuthenticationModule } from "../authentication/authentication.module"; // add

@Module({
  imports: [
    forwardRef(() => AuthenticationModule), // ensure AuthenticationModule can inject ChatbotService if needed
    AdminModule,
  ],
  providers: [ChatbotService],
  controllers: [ChatbotController],
  exports: [ChatbotService], // export so other modules (AuthenticationModule) can inject it
})
export class ChatbotModule {}