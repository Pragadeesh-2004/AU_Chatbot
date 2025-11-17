import { Controller, Post, Body, Req, UseInterceptors, UploadedFiles, HttpException, HttpStatus } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { GuestRateLimitService } from './guest-rate-limit.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { ConfigService } from '@nestjs/config';

@Public() // No JWT required for guest endpoints
@Controller('guest-chatbot')
export class GuestChatbotController {
  constructor(
    private guestRateLimitService: GuestRateLimitService,
    private chatbotService: ChatbotService, // Inject ChatbotService to reuse the Python orchestration
    private configService: ConfigService // Add ConfigService injection
  ) {}

  @Post('send-message')
  @UseInterceptors(AnyFilesInterceptor())
  async sendMessage(
    @Body() body: { message: string },
    @UploadedFiles() files: MulterFile[],
    @Req() req: Request
  ) {
    // Extract guest identifier
    const clientIp = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const guestKey = this.guestRateLimitService.generateGuestKey(clientIp, userAgent);

    // Calculate tokens
    const inputTokens = this.guestRateLimitService.calculateTokens(body.message);
    const estimatedOutputTokens = Math.max(50, Math.ceil(inputTokens * 2));
    const fileCount = files?.length || 0;

    try {
      // Check rate limits
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

      // Validate file sizes
      if (files && files.length > 0) {
        const maxFileSizeMB = rateLimitCheck.limits.file_size;
        for (const file of files) {
          if (file.size > maxFileSizeMB * 1024 * 1024) {
            throw new HttpException({
              message: `File "${file.originalname}" exceeds the size limit of ${maxFileSizeMB}MB.`,
              code: 'FILE_SIZE_EXCEEDED'
            }, HttpStatus.BAD_REQUEST);
          }
        }
      }

      // ✅ Use the same Python orchestration service as authenticated users
      const response = await this.callPythonOrchestrationForGuest(
        guestKey, 
        body.message, 
        files
      );
      
      const actualOutputTokens = this.guestRateLimitService.calculateTokens(response);

      // Update usage
      this.guestRateLimitService.updateGuestUsage(
        guestKey,
        inputTokens,
        actualOutputTokens,
        fileCount
      );

      return {
        success: true,
        answer: response, // Changed from 'response' to 'answer' to match frontend expectation
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
    } catch (error) {
      console.error('Guest message processing error:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to process message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ✅ Fixed type issues and use proper ConfigService injection
  private async callPythonOrchestrationForGuest(
    guestKey: string, 
    question: string, 
    files?: MulterFile[]
  ): Promise<string> {
    try {
      // Use properly injected ConfigService instead of accessing through chatbotService
      const pythonServiceUrl = this.configService.get('PYTHON_ORCHESTRATION_URL') || 
                              'https://your-python-codespace-url.app.github.dev';
      
      console.log('Calling Python orchestration service for guest:', pythonServiceUrl);

      // Prepare the payload for Python service with guest role
      const payload = {
        user_query: question,
        role: "guest", // ✅ Send role as "guest"
        id: guestKey,   // ✅ Use guestKey as ID
        file: files ? files.map(f => ({
          name: f.originalname,
          size: f.size,
          content: f.buffer?.toString('base64') || null
        })) : []
      };

      // Make HTTP request to Python orchestration service
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Fix the fetch import to avoid type issues
      const fetch = await import('node-fetch').then(mod => mod.default);
      const response = await fetch(`${pythonServiceUrl}/process/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Python orchestration service error:', response.status, response.statusText);
        throw new Error(`Python service error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Extract the answer from the response
      const answer = (responseData as any).answer || 
                    (responseData as any).response || 
                    (responseData as any).message || 
                    "I apologize, but I couldn't process your request at the moment. As a guest user, some features may be limited.";
      
      console.log('Received response from Python orchestration service for guest');
      return answer;

    } catch (error: any) {
      console.error('Error calling Python orchestration service for guest:', error);
      
      // Return different error messages based on error type
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return "I'm temporarily unavailable due to a service connection issue. Please try again in a moment.";
      } else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        return "I'm taking too long to respond. Please try with a simpler question or try again later.";
      } else {
        return "I encountered an error while processing your request. As a guest user, please try again or consider creating an account for more reliable service.";
      }
    }
  }

  // Get guest rate limits endpoint for frontend
  @Post('get-limits')
  async getGuestLimits(@Req() req: Request) {
    try {
      const limits = await this.guestRateLimitService.getGuestLimits();
      
      // Get current usage for this guest
      const clientIp = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const guestKey = this.guestRateLimitService.generateGuestKey(clientIp, userAgent);
      
      // This will create/return usage for today
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