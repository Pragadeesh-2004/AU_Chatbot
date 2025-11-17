import { Controller, Post, Body, Delete, Get, Query, UploadedFiles, UseInterceptors, HttpException, HttpStatus } from "@nestjs/common";
import { ChatbotService } from "./chatbot.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { AddSessionDto } from "./dto/add-session.dto";
import { AddQADto } from "./dto/add-qa.dto";
import { DeleteSessionDto } from "./dto/delete-session.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from "multer";
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller("chatbot")
export class ChatbotController {
    constructor(private readonly chatbotService: ChatbotService) {}

    @Post("add-user")
    async addUser(@Body() dto: CreateUserDto) {
        return this.chatbotService.addUser(dto);
    }

    @Post("add-session")
    async addSession(@Body() dto: AddSessionDto) {
        const result = await this.chatbotService.addSession(dto);
        const resAny = result as any;
        if (resAny?.error) {
            if (resAny.code === 'MEMORY_LIMIT_EXCEEDED') {
                throw new HttpException({ message: resAny.error, code: resAny.code }, HttpStatus.BAD_REQUEST);
            }
            throw new HttpException({ message: resAny.error }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { session_id: (resAny?.session_id ?? null) };
    }

    @Post("add-qa")
    async addQA(@Body() dto: AddQADto) {
        try {
            const result = await this.chatbotService.addQA(dto);
            const resAny = result as any;
            
            if (resAny?.error) {
                // Return appropriate HTTP status for different error types
                if (resAny.code === "INPUT_TOKEN_EXHAUSTED" || 
                    resAny.code === "OUTPUT_TOKEN_EXHAUSTED" || 
                    resAny.code === "REQUEST_LIMIT_EXHAUSTED" ||
                    resAny.code === "FILE_COUNT_EXHAUSTED" ||
                    resAny.code === "FILE_SIZE_EXCEEDED") {
                    throw new HttpException({ 
                        message: resAny.error, 
                        code: resAny.code,
                        needed: resAny.needed,
                        balance: resAny.balance,
                        fileName: resAny.fileName 
                    }, HttpStatus.BAD_REQUEST);
                }
                throw new HttpException({ message: resAny.error }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
            
            return result;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('Unexpected error in addQA:', error);
            throw new HttpException({ message: 'Internal server error' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    

    @Delete("delete-session")
    async deleteSession(@Body() dto: DeleteSessionDto) {
        const result = await this.chatbotService.deleteSession(dto);
        const resAny = result as any;
        if (resAny?.error) {
            throw new HttpException({ message: resAny.error }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return result;
    }

    @Delete("delete-user")
    async deleteUser(@Body() dto: DeleteUserDto) {
        const result = await this.chatbotService.deleteUser(dto);
        const resAny = result as any;
        if (resAny?.error) {
            throw new HttpException({ message: resAny.error }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return result;
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
        return { success: true, files: files.map(f => f.originalname) };
    }
}