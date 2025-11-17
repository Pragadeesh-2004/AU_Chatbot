import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

@Injectable()
export class GuestRateLimitService {
  private guestUsage = new Map<string, any>(); // In-memory storage
  private readonly GUEST_RATE_LIMIT_DOC_ID = '68e795362392f7ffaf841d0c';

  constructor(
    @InjectConnection('university') private universityConnection: Connection
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
      // Return fallback limits
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
  async checkGuestRateLimit(guestKey: string, inputTokens: number, estimatedOutputTokens: number, fileCount: number = 0) {
    const limits = await this.getGuestLimits();
    const today = new Date().toDateString();
    
    // Get or initialize guest usage
    let usage = this.guestUsage.get(guestKey);
    if (!usage || usage.date !== today) {
      usage = {
        date: today,
        requestsUsed: 0,
        inputTokensUsed: 0,
        outputTokensUsed: 0,
        filesUploaded: 0
      };
      this.guestUsage.set(guestKey, usage);
    }

    // Check all limits
    if (usage.requestsUsed >= limits.request_per_day) {
      return {
        success: false,
        message: `Daily request limit reached (${limits.request_per_day} requests per day). Limits reset at midnight.`,
        code: 'GUEST_REQUEST_LIMIT',
        limits,
        usage
      };
    }

    if (usage.inputTokensUsed + inputTokens > limits.input_token_per_day) {
      return {
        success: false,
        message: `Input token limit exceeded. Required: ${inputTokens}, Available: ${limits.input_token_per_day - usage.inputTokensUsed}`,
        code: 'GUEST_INPUT_LIMIT',
        limits,
        usage
      };
    }

    if (usage.outputTokensUsed + estimatedOutputTokens > limits.output_token_per_day) {
      return {
        success: false,
        message: `Output token limit exceeded. Estimated: ${estimatedOutputTokens}, Available: ${limits.output_token_per_day - usage.outputTokensUsed}`,
        code: 'GUEST_OUTPUT_LIMIT',
        limits,
        usage
      };
    }

    if (fileCount > 0 && usage.filesUploaded + fileCount > limits.file_count) {
      return {
        success: false,
        message: `File upload limit exceeded. You can upload ${limits.file_count - usage.filesUploaded} more files today.`,
        code: 'GUEST_FILE_LIMIT',
        limits,
        usage
      };
    }

    return { 
      success: true, 
      limits, 
      usage, 
      inputTokens, 
      estimatedOutputTokens, 
      fileCount 
    };
  }

  // Update guest usage after successful request
  updateGuestUsage(guestKey: string, inputTokens: number, outputTokens: number, fileCount: number = 0) {
    const usage = this.guestUsage.get(guestKey);
    if (usage) {
      usage.requestsUsed += 1;
      usage.inputTokensUsed += inputTokens;
      usage.outputTokensUsed += outputTokens;
      usage.filesUploaded += fileCount;
      this.guestUsage.set(guestKey, usage);
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