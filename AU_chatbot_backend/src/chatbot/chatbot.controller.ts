import { Controller, Post, Body, Delete, Get, Query, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { ChatbotService } from "./chatbot.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { AddSessionDto } from "./dto/add-session.dto";
import { AddQADto } from "./dto/add-qa.dto";
import { DeleteSessionDto } from "./dto/delete-session.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from "multer";

@Controller("chatbot")
export class ChatbotController {
    constructor(private readonly chatbotService: ChatbotService) {}

    @Post("add-user")
    async addUser(@Body() dto: CreateUserDto) {
        return this.chatbotService.addUser(dto);
    }

    @Post("add-session")
    async addSession(@Body() dto: AddSessionDto) {
        return this.chatbotService.addSession(dto);
    }

    @Post("add-qa")
    async addQA(@Body() dto: AddQADto) {
        console.log("addQA DTO:", dto);
        return this.chatbotService.addQA(dto);
    }

    @Delete("delete-session")
    async deleteSession(@Body() dto: DeleteSessionDto) {
        return this.chatbotService.deleteSession(dto);
    }

    @Delete("delete-user")
    async deleteUser(@Body() dto: DeleteUserDto) {
        return this.chatbotService.deleteUser(dto);
    }

    @Get("user-memory")
    async getUserMemory(@Query("role") role: string, @Query("id") id: string) {
        const memory = await this.chatbotService.getUserMemory(role, id);
        if (!memory) {
            return {
                message: "No history found.",
                sessions: []
            };
        }
        return memory;
    }

    @Post("send-prompt")
    @UseInterceptors(AnyFilesInterceptor())
    async sendPrompt(@UploadedFiles() files: MulterFile[], @Body() body: any) {
        // Validate file types and sizes using process.env values
        // Do not save files, just process them as needed
        // You can access files and images via `files`
        // Access prompt via `body.question`
        return { success: true, files: files.map(f => f.originalname) };
    }
}