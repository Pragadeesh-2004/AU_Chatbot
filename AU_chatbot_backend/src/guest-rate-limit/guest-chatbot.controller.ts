import { Controller, Post, Body, Req, Res, UseInterceptors, UploadedFiles, HttpException, HttpStatus } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { Public } from '../auth/public.decorator';
import { GuestRateLimitService } from './guest-rate-limit.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs'; // ✅ Add file system import
import * as path from 'path'; // ✅ Add path import

@Public()
@Controller('guest-chatbot')
export class GuestChatbotController {
  constructor(
    private guestRateLimitService: GuestRateLimitService,
    private configService: ConfigService
  ) {}

  @Post('set-college')
  async setCollege(
    @Body() body: { college: string },
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const collegeName = body.college || 'Anna_university';
      
      res.cookie('guestCollege', collegeName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.json({ success: true, college: collegeName });
    } catch (error) {
      console.error('Error setting college cookie:', error);
      throw new HttpException('Failed to set college', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('send-message')
  @UseInterceptors(AnyFilesInterceptor())
  async sendMessage(
    @UploadedFiles() files: any[],
    @Body() body: { user_query: string; message?: string; collegeName?: string; role?: string; id?: string },
    @Req() req: Request
  ) {
    const clientIp = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const guestKey = this.guestRateLimitService.generateGuestKey(clientIp, userAgent);

    const collegeName = body.collegeName || 
                       req.cookies?.guestCollege || 
                       'Anna_university';

    const question = body.user_query || body.message || '';
    
    if (!question.trim()) {
      throw new HttpException('Message cannot be empty', HttpStatus.BAD_REQUEST);
    }

    console.log('\n========== GUEST SEND-MESSAGE DEBUG ==========');
    console.log('Files array:', files);
    console.log('Files length:', files?.length);
    
    if (files && files.length > 0) {
      console.log('Files received:');
      files.forEach((file, index) => {
        console.log(`\nFile ${index}:`, {
          keys: Object.keys(file),
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path, // ✅ Show path (from diskStorage)
          bufferExists: !!file.buffer
        });
      });
    } else {
      console.log('❌ NO FILES RECEIVED');
    }
    console.log('==========================================\n');

    const inputTokens = this.guestRateLimitService.calculateTokens(question);
    const estimatedOutputTokens = Math.max(50, Math.ceil(inputTokens * 2));
    const fileCount = files?.length || 0;

    try {
      const rateLimitCheck = await this.guestRateLimitService.checkGuestRateLimit(
        guestKey,
        inputTokens,
        estimatedOutputTokens,
        fileCount
      );

      if (!rateLimitCheck.success) {
        throw new HttpException({
          message: (rateLimitCheck as any).message,
          code: (rateLimitCheck as any).code,
          limits: rateLimitCheck.limits,
          usage: rateLimitCheck.usage
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      if (files && files.length > 0) {
        const maxFileSizeMB = rateLimitCheck.limits.file_size;
        console.log(`Max file size limit: ${maxFileSizeMB}MB`);
        
        for (const file of files) {
          const fileSizeMB = file.size / (1024 * 1024);
          console.log(`Checking file: ${file.originalname} (${fileSizeMB.toFixed(2)}MB)`);
          
          if (file.size > maxFileSizeMB * 1024 * 1024) {
            throw new HttpException({
              message: `File "${file.originalname}" exceeds the size limit of ${maxFileSizeMB}MB.`,
              code: 'FILE_SIZE_EXCEEDED'
            }, HttpStatus.BAD_REQUEST);
          }
        }
      }

      // ✅ FIXED: Read files from disk into buffers
      const formattedFiles = files && files.length > 0 
        ? files.map((file: any) => {
            console.log(`\n🔍 Formatting file: ${file.originalname}`);
            
            try {
              // ✅ Read file from disk path
              let buffer: Buffer | undefined;
              
              if (file.path) {
                console.log(`  📂 Reading file from disk: ${file.path}`);
                buffer = fs.readFileSync(file.path);
                console.log(`  ✅ File read successfully: ${buffer.length} bytes`);
              } else if (file.buffer) {
                console.log(`  ✅ File already has buffer: ${file.buffer.length} bytes`);
                buffer = file.buffer;
              } else {
                console.error(`  ❌ ERROR: File has no path and no buffer!`);
              }
              
              return {
                name: file.originalname || 'document.pdf',
                size: file.size || 0,
                type: file.mimetype || 'application/pdf',
                buffer: buffer, // ✅ Now contains actual buffer
                path: file.path // ✅ Keep path for cleanup
              };
            } catch (readError) {
              console.error(`  ❌ ERROR reading file: ${readError}`);
              throw new HttpException(
                `Failed to read file: ${file.originalname}`,
                HttpStatus.INTERNAL_SERVER_ERROR
              );
            }
          })
        : [];

      console.log('\n✅ FORMATTED FILES:');
      formattedFiles.forEach((f, idx) => {
        console.log(`File ${idx}:`, {
          name: f.name,
          size: f.size,
          type: f.type,
          bufferExists: !!f.buffer,
          bufferLength: f.buffer?.length || 0,
          isBuffer: Buffer.isBuffer(f.buffer)
        });
      });

      try {
        console.log('\n📤 Calling Python orchestration with formatted files...');
        const response = await this.guestRateLimitService.callPythonOrchestration(
          'guest',
          guestKey,
          question,
          formattedFiles,
          collegeName
        );
        
        console.log('✅ Response received:', response.substring(0, 100));
        const actualOutputTokens = this.guestRateLimitService.calculateTokens(response);

        this.guestRateLimitService.updateGuestUsage(
          guestKey,
          inputTokens,
          actualOutputTokens,
          fileCount
        );

        return {
          success: true,
          answer: response,
          collegeName: collegeName,
          tokens_used: {
            input: inputTokens,
            output: actualOutputTokens
          },
          usage: {
            inputTokens,
            outputTokens: actualOutputTokens,
            filesProcessed: fileCount,
            remainingLimits: {
              requests: rateLimitCheck.limits.request_per_day - (rateLimitCheck.usage.requestsUsed + 1),
              inputTokens: rateLimitCheck.limits.input_token_per_day - (rateLimitCheck.usage.inputTokensUsed + inputTokens),
              outputTokens: rateLimitCheck.limits.output_token_per_day - (rateLimitCheck.usage.outputTokensUsed + actualOutputTokens),
              fileUploads: rateLimitCheck.limits.file_count - (rateLimitCheck.usage.filesUploaded + fileCount)
            }
          }
        };
      } finally {
        // ✅ Cleanup: Delete uploaded files from disk after processing
        if (files && files.length > 0) {
          files.forEach((file: any) => {
            if (file.path && fs.existsSync(file.path)) {
              try {
                fs.unlinkSync(file.path);
                console.log(`✅ Cleaned up file: ${file.path}`);
              } catch (unlinkError) {
                console.warn(`⚠️  Failed to delete file: ${file.path}`, unlinkError);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Guest message processing error:', error);
      
      // ✅ Cleanup on error too
      if (files && files.length > 0) {
        files.forEach((file: any) => {
          if (file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log(`✅ Cleaned up file on error: ${file.path}`);
            } catch (unlinkError) {
              console.warn(`⚠️  Failed to delete file: ${file.path}`, unlinkError);
            }
          }
        });
      }
      
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to process message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('get-limits')
  async getGuestLimits(@Req() req: Request) {
    try {
      const limits = await this.guestRateLimitService.getGuestLimits();
      
      const clientIp = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const guestKey = this.guestRateLimitService.generateGuestKey(clientIp, userAgent);
      
      const usageCheck = await this.guestRateLimitService.checkGuestRateLimit(guestKey, 0, 0, 0);
      
      return {
        limits,
        currentUsage: usageCheck.usage || {
          requestsUsed: 0,
          inputTokensUsed: 0,
          outputTokensUsed: 0,
          filesUploaded: 0,
          date: new Date().toDateString()
        }
      };
    } catch (error) {
      console.error('Error getting guest limits:', error);
      throw new HttpException('Failed to fetch guest limits', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private getClientIp(req: Request): string {
    return req.headers['x-forwarded-for']?.toString().split(',')[0] ||
           req.headers['x-real-ip']?.toString() ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }
}