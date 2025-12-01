import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { Readable } from 'stream';

@Injectable()
export class GuestRateLimitService {
  private guestUsage: Map<string, {
    requestsUsed: number;
    inputTokensUsed: number;
    outputTokensUsed: number;
    filesUploaded: number;
    date: string;
  }> = new Map();
  
  private readonly GUEST_RATE_LIMIT_DOC_ID = '68e795362392f7ffaf841d0c';

  constructor(
    @InjectConnection('university') private universityConnection: Connection,
    private configService: ConfigService
  ) {}

  // Fetch guest rate limits from database
  async getGuestLimits() {
    try {
      const doc = await this.universityConnection
        .collection('rate_limit')
        .findOne({ _id: new Types.ObjectId(this.GUEST_RATE_LIMIT_DOC_ID) });

      if (!doc) {
        console.warn('Guest rate limit document not found, using defaults');
        return {
          request_per_day: 10,
          input_token_per_day: 100,
          output_token_per_day: 200,
          file_count: 5,
          file_size: 10,
          memory_count: 0
        };
      }

      return {
        request_per_day: doc.request_per_day || 10,
        input_token_per_day: doc.input_token_per_day || 100,
        output_token_per_day: doc.output_token_per_day || 200,
        file_count: doc.file_count || 5,
        file_size: doc.file_size || 10,
        memory_count: doc.memory_count || 0
      };
    } catch (error) {
      console.error('Failed to fetch guest limits:', error);
      return {
        request_per_day: 10,
        input_token_per_day: 100,
        output_token_per_day: 200,
        file_count: 5,
        file_size: 10,
        memory_count: 0
      };
    }
  }

  // Generate unique guest identifier
  generateGuestKey(ip: string, userAgent: string): string {
    const hash = this.hashString(userAgent);
    const today = new Date().toISOString().split('T')[0];
    return `guest:${ip}:${hash}:${today}`;
  }

  // Check if guest request is within limits
  async checkGuestRateLimit(
    guestKey: string,
    inputTokens: number,
    outputTokens: number,
    fileCount: number
  ) {
    const today = new Date().toDateString();
    
    if (!this.guestUsage.has(guestKey)) {
      this.guestUsage.set(guestKey, {
        requestsUsed: 0,
        inputTokensUsed: 0,
        outputTokensUsed: 0,
        filesUploaded: 0,
        date: today
      });
    }

    const usage = this.guestUsage.get(guestKey)!;
    
    if (usage.date !== today) {
      usage.requestsUsed = 0;
      usage.inputTokensUsed = 0;
      usage.outputTokensUsed = 0;
      usage.filesUploaded = 0;
      usage.date = today;
    }

    const limits = await this.getGuestLimits();

    if (usage.requestsUsed >= limits.request_per_day) {
      return {
        success: false,
        code: 'REQUEST_LIMIT_EXHAUSTED',
        message: `Daily request limit reached (${limits.request_per_day} per day)`,
        limits,
        usage
      };
    }

    if (usage.inputTokensUsed + inputTokens > limits.input_token_per_day) {
      return {
        success: false,
        code: 'INPUT_TOKEN_EXHAUSTED',
        message: `Input token limit exceeded`,
        limits,
        usage
      };
    }

    if (usage.outputTokensUsed + outputTokens > limits.output_token_per_day) {
      return {
        success: false,
        code: 'OUTPUT_TOKEN_EXHAUSTED',
        message: `Output token limit exceeded`,
        limits,
        usage
      };
    }

    if (fileCount > 0 && usage.filesUploaded + fileCount > limits.file_count) {
      return {
        success: false,
        code: 'FILE_COUNT_EXHAUSTED',
        message: `File upload limit exceeded for today`,
        limits,
        usage
      };
    }

    return {
      success: true,
      limits,
      usage
    };
  }

  // Update guest usage after successful request
  updateGuestUsage(
    guestKey: string,
    inputTokens: number,
    outputTokens: number,
    fileCount: number
  ) {
    const today = new Date().toDateString();
    
    if (!this.guestUsage.has(guestKey)) {
      this.guestUsage.set(guestKey, {
        requestsUsed: 0,
        inputTokensUsed: 0,
        outputTokensUsed: 0,
        filesUploaded: 0,
        date: today
      });
    }

    const usage = this.guestUsage.get(guestKey)!;
    
    if (usage.date !== today) {
      usage.requestsUsed = 0;
      usage.inputTokensUsed = 0;
      usage.outputTokensUsed = 0;
      usage.filesUploaded = 0;
      usage.date = today;
    }

    usage.requestsUsed++;
    usage.inputTokensUsed += inputTokens;
    usage.outputTokensUsed += outputTokens;
    usage.filesUploaded += fileCount;
  }

  // ✅ Call Python orchestration service with FormData
  async callPythonOrchestration(
    role: string,
    id: string,
    question: string,
    files?: any[],
    collegeName?: string
  ): Promise<string> {
    try {
      const pythonServiceUrl = this.configService.get<string>('PYTHON_ORCHESTRATION_URL') || 
                              process.env.PYTHON_ORCHESTRATION_URL ||
                              'http://localhost:5000';
      
      const baseUrl = pythonServiceUrl.replace(/\/$/, '');
      
      console.log('\n========== SERVICE: PYTHON ORCHESTRATION ==========');
      console.log('Base URL:', baseUrl);
      console.log('Role:', role);
      console.log('ID:', id);
      console.log('Question:', question.substring(0, 50));
      console.log('Files received:', files?.length || 0);

      // ✅ Create FormData instance
      let formData: any;
      try {
        formData = new FormData();
      } catch (e) {
        const FormDataClass = require('form-data');
        formData = new FormDataClass();
      }

      console.log('✅ FormData created');

      // ✅ Add text fields to FormData
      formData.append('user_query', question);
      formData.append('role', role);
      formData.append('id', id);
      formData.append('collegeName', collegeName || 'Anna_university');

      console.log('✅ Text fields added to FormData');

      // ✅ Add files as binary FormData (not base64)
      if (files && files.length > 0) {
        console.log(`\n📁 Processing ${files.length} files for FormData:`);
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          console.log(`\nFile ${i}:`, {
            name: file.name,
            size: file.size,
            type: file.type,
            bufferExists: !!file.buffer,
            bufferLength: file.buffer?.length || 0,
            isBuffer: Buffer.isBuffer(file.buffer)
          });

          if (file.buffer) {
            console.log(`  ✅ Has buffer, converting to stream...`);
            const stream = Readable.from(file.buffer);
            formData.append('file', stream, {
              filename: file.name || `file_${i}.pdf`,
              contentType: file.type || 'application/pdf'
            });
            console.log(`  ✅ File ${i} appended to FormData: ${file.name} (${file.buffer.length} bytes)`);
          } else if (file.data && typeof file.data === 'string') {
            console.log(`  ✅ Has base64 data, converting...`);
            const buffer = Buffer.from(file.data, 'base64');
            const stream = Readable.from(buffer);
            formData.append('file', stream, {
              filename: file.name || `file_${i}.pdf`,
              contentType: file.type || 'application/pdf'
            });
            console.log(`  ✅ File ${i} appended from base64: ${file.name}`);
          } else {
            console.error(`  ❌ File ${i} has NO buffer and NO base64 data!`);
            console.error(`  File object:`, file);
          }
        }
      } else {
        console.log('⚠️  No files to add');
      }

      console.log('\n✅ All files added to FormData');
      console.log('FormData headers:', formData.getHeaders());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const endpoints = [
        `${baseUrl}/process`,
      ];

      let lastError: any;

      for (const endpoint of endpoints) {
        try {
          console.log(`\n🔗 Trying endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: formData.getHeaders(),
            body: formData,
            signal: controller.signal
          });

          console.log(`📊 Response status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            clearTimeout(timeoutId);
            const responseData = await response.json() as any;
            
            const answer = responseData.answer || 
                          responseData.response || 
                          responseData.message || 
                          responseData.result ||
                          "I apologize, but I couldn't process your request at the moment.";
            
            console.log('✅ Successfully received response from Python orchestration service');
            console.log('====================================================\n');
            return answer;
          } else {
            lastError = new Error(`${endpoint} returned ${response.status}: ${response.statusText}`);
            console.warn(`❌ ${endpoint} failed: ${response.status}`);
            
            try {
              const errorBody = await response.text();
              console.warn('Error body:', errorBody.substring(0, 300));
            } catch (e) {
              console.warn('Could not read error body');
            }
            
            continue;
          }
        } catch (endpointError) {
          lastError = endpointError;
          console.warn(`❌ Connection error to ${endpoint}:`, (endpointError as any).message);
          continue;
        }
      }

      clearTimeout(timeoutId);
      
      if (lastError) {
        throw lastError;
      }

      throw new Error('No valid endpoint found for Python orchestration service');

    } catch (error) {
      console.error('❌ Error calling Python orchestration service:', error);
      console.log('====================================================\n');
      
      const errorMessage = (error as any).message || String(error);
      
      if (errorMessage.includes('ECONNREFUSED')) {
        return "The AI service is currently offline.";
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        return "The service URL is invalid or unreachable.";
      } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
        return "The AI service is taking too long to respond.";
      } else if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
        return "The service gateway returned an error.";
      } else {
        return `An error occurred: ${errorMessage}`;
      }
    }
  }

  // Helper function to hash user agent
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  // Calculate tokens from text
  calculateTokens(text: string): number {
    return Math.ceil((text || '').length / 4);
  }
}