import { Controller, Post, Body, Delete, Get, Query, UploadedFiles, UseInterceptors, HttpException, HttpStatus, UploadedFile, Req, UseGuards, BadRequestException } from "@nestjs/common";
import { ChatbotService } from "./chatbot.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { AddSessionDto } from "./dto/add-session.dto";
import { AddQADto } from "./dto/add-qa.dto";
import { DeleteSessionDto } from "./dto/delete-session.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response, Request } from 'express';

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

    // ✅ Update add-qa to use AnyFilesInterceptor for FormData
    @Post("add-qa")
    @UseInterceptors(AnyFilesInterceptor())
    async addQA(
      @UploadedFiles() files: any[],
      @Body() body: any,
      @Req() req: any
    ) {
      try {
        const user = req.user; // From JWT auth

        console.log('addQA received:', {
          bodyKeys: Object.keys(body),
          filesCount: files?.length || 0,
          userId: user?.id,
          userRole: user?.role
        });

        // ✅ Extract FormData fields
        const role = body.role || user?.role;
        const id = body.id || user?.id;
        const question = body.user_query || body.question || body.message;
        const sessionId = body.session_id;
        const timestamp = body.timestamp || new Date().toISOString();
        const collegeName = body.collegeName || 'Anna_university';

        // Validate required fields
        if (!role || !id || !question || !sessionId) {
          throw new BadRequestException(`Missing required fields: role=${role}, id=${id}, question=${question}, sessionId=${sessionId}`);
        }

        // ✅ Extract files from multipart FormData
        const filesData = files && Array.isArray(files) ? files.map((file: any) => ({
          name: file.originalname || 'document.pdf',
          size: file.size || 0,
          type: file.mimetype || 'application/pdf',
          buffer: file.buffer // File content as buffer
        })) : [];

        console.log('Processed files:', filesData.map(f => ({ name: f.name, size: f.size, type: f.type })));

        const dto: AddQADto = {
          role,
          id,
          session_id: sessionId,
          question,
          timestamp,
          collegeName,
          files: filesData.length > 0 ? filesData : undefined
        };

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
        throw new HttpException({ 
          message: error?.message || 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        }, HttpStatus.INTERNAL_SERVER_ERROR);
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
    async sendPrompt(@UploadedFiles() files: any[], @Body() body: any) {
        return { success: true, files: files.map(f => f.originalname) };
    }

    // ✅ New endpoint for separate file uploads
    @Post("upload-file")
    @UseInterceptors(FileInterceptor('file', {
        fileFilter: (req, file, callback) => {
            // Only allow PDFs
            if (file.mimetype === 'application/pdf') {
                callback(null, true);
            } else {
                callback(new BadRequestException('Only PDF files are allowed'), false);
            }
        },
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB max
        }
    }))
    async uploadFileForQA(
        @UploadedFile() file: any,
        @Body() body: { qa_id: string; session_id: string },
        @Req() req: any
    ) {
        try {
            const user = req.user; // From JWT auth
            
            if (!file) {
                throw new BadRequestException('No file uploaded');
            }

            // Store file temporarily or process it
            const fileBuffer = file.buffer;
            const fileName = file.originalname;
            const fileSize = file.size;

            // Pass to Python service for processing
            await this.chatbotService.processUploadedFile(
                user.id,
                user.role,
                body.qa_id,
                fileBuffer,
                fileName,
                fileSize
            );

            return { 
                success: true, 
                message: 'File uploaded successfully',
                file: { name: fileName, size: fileSize }
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            throw new BadRequestException(error.message || 'File upload failed');
        }
    }
}