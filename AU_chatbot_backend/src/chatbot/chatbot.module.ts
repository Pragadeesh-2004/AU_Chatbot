import { Module } from "@nestjs/common";
import { ChatbotService } from "./chatbot.service";
import { ChatbotController } from "./chatbot.controller";
import { AdminModule } from "../admin/admin.module"; // Import AdminModule

@Module({
  imports: [AdminModule],
  providers: [ChatbotService],
  controllers: [ChatbotController],
})
export class ChatbotModule {}