import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import type { Connection } from "mongoose";
import { Types } from "mongoose";
import { CreateUserDto } from "./dto/create-user.dto";
import { AddSessionDto } from "./dto/add-session.dto";
import { AddQADto } from "./dto/add-qa.dto";
import { DeleteSessionDto } from "./dto/delete-session.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { AdminService } from '../admin/admin.service';
// ✅ Add these imports for HTTP requests
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data'; // ✅ Add this import at the top with other imports
import fetch from 'node-fetch';
import { Readable } from 'stream';

// ... existing code ...

const ROLE_CONFIG = {
  student: {
    array: "student",
    idField: "student_id",
    doc: "68d7e0b04f788da2cf74e392"
  },
  faculty: {
    array: "faculty",
    idField: "faculty_id",
    doc: "68d7e9464f788da2cf74e397"
  },
  scholar: {
    array: "scholar",
    idField: "scholar_id",
    doc: "68d7e9614f788da2cf74e399"
  },
  official: {
    array: "official",
    idField: "official_id",
    doc: "68d7e9764f788da2cf74e39b"
  }
};

@Injectable()
export class ChatbotService {
  constructor(
    @InjectConnection("university") private universityConnection: Connection,
    private adminService: AdminService,
    public configService: ConfigService // ✅ Make configService public for guest access
  ) {}

  private calcTokensFromText(text?: string) {
    const s = (text ?? "").toString();
    if (!s) return 0;
    return Math.ceil(s.length / 4); // 1 token per 4 characters
  }

  // ✅ Make this method public so GuestChatbotController can use it
 // Update the callPythonOrchestration method to remove timeout property

// Update callPythonOrchestration method with proper FormData instantiation

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
    
    console.log('Calling Python orchestration service:', baseUrl);
    console.log('Payload:', { user_query: question, role, id, collegeName, filesCount: files?.length || 0 });

    // ✅ Create FormData instance - use require if import fails
    let formData: any;
    try {
      // Try using imported FormData
      formData = new FormData();
    } catch (e) {
      // Fallback to require
      const FormDataClass = require('form-data');
      formData = new FormDataClass();
    }

    // ✅ Add text fields to FormData
    formData.append('user_query', question);
    formData.append('role', role);
    formData.append('id', id);
    formData.append('collegeName', collegeName || 'Anna_university');

    // ✅ Add files as binary FormData (not base64)
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // If file has buffer (from FormData upload), append buffer directly
        if (file.buffer) {
          // Convert buffer to stream for form-data
          const stream = Readable.from(file.buffer);
          formData.append('file', stream, {
            filename: file.name || `file_${i}.pdf`,
            contentType: file.type || 'application/pdf'
          });
        } else if (file.data && typeof file.data === 'string') {
          // If file has base64 data, convert back to buffer
          const buffer = Buffer.from(file.data, 'base64');
          const stream = Readable.from(buffer);
          formData.append('file', stream, {
            filename: file.name || `file_${i}.pdf`,
            contentType: file.type || 'application/pdf'
          });
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const endpoints = [
      
      `${baseUrl}/process`,
      ];

    let lastError: any;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: formData.getHeaders(),
          body: formData,
          signal: controller.signal
        });

        console.log(`Response from ${endpoint}:`, response.status, response.statusText);

        if (response.ok) {
          clearTimeout(timeoutId);
          const responseData = await response.json() as any;
          
          const answer = responseData.answer || 
                        responseData.response || 
                        responseData.message || 
                        responseData.result ||
                        "I apologize, but I couldn't process your request at the moment.";
          
          console.log('✅ Successfully received response from Python orchestration service');
          return answer;
        } else {
          lastError = new Error(`${endpoint} returned ${response.status}: ${response.statusText}`);
          console.warn(`❌ ${endpoint} failed:`, response.status, response.statusText);
          
          try {
            const errorBody = await response.text();
            console.warn('Error body:', errorBody.substring(0, 200));
          } catch (e) {
            console.warn('Could not read error body');
          }
          
          continue;
        }
      } catch (endpointError) {
        lastError = endpointError;
        console.warn(`❌ Failed to connect to ${endpoint}:`, (endpointError as any).message);
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
    
    const errorMessage = (error as any).message || String(error);
    
    if (errorMessage.includes('ECONNREFUSED')) {
      console.error('Connection refused - Python service may not be running');
      return "The AI service is currently offline. Please check if the Python orchestration service is running.";
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      console.error('DNS resolution failed - Invalid service URL');
      return "The service URL is invalid or unreachable. Please check your configuration.";
    } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      console.error('Request timeout - Python service taking too long');
      return "The AI service is taking too long to respond. Please try again with a simpler question.";
    } else if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
      console.error('502 Bad Gateway - Python service proxy issue');
      return "The service gateway returned an error. The Python service may be misconfigured or unavailable.";
    } else {
      console.error('Generic error:', errorMessage);
      return `An error occurred: ${errorMessage}. Please try again later.`;
    }
  }
}

  async addUser(dto: CreateUserDto) {
    try {
      const config = ROLE_CONFIG[dto.role];
      if (!config) {
        throw new Error(`Invalid role: ${dto.role}`);
      }

      const docId = new Types.ObjectId(config.doc);
      const userObj: any = {
        [config.idField]: dto.id,
        name: dto.name,
        sessions: []
      };

      // Ensure memory document exists
      const existingDoc = await this.universityConnection
        .collection("memory")
        .findOne({ _id: docId });
      
      if (!existingDoc) {
        console.error(`Memory document not found for ID: ${docId.toString()}`);
        throw new Error(`Memory document not found for role: ${dto.role}`);
      }

      // push only if user not present (idempotent)
      const pushResult = await this.universityConnection.collection("memory").updateOne(
        { _id: docId, [`${config.array}.${config.idField}`]: { $ne: dto.id } },
        { $push: { [config.array]: userObj } as any }
      );

      // If doc not matched -> weird, throw
      if (pushResult.matchedCount === 0) {
        throw new Error(`Memory document with ID ${docId.toString()} not found`);
      }

      // If modifiedCount === 0 then user already existed — treat as success
      if ((pushResult.modifiedCount ?? 0) === 0) {
        console.log(`User ${dto.id} already exists in memory (${config.array}), skipping creation.`);
        return { success: true, alreadyExists: true };
      }

      console.log("User added to memory:", dto.id);
      return { success: true, created: true };
    } catch (error) {
      console.error("addUser error details:", {
        message: error?.message,
        stack: error?.stack,
        role: dto.role,
        id: dto.id,
        name: dto.name
      });
      throw error;
    }
  }

  async addSession(dto: AddSessionDto) {
    const config = ROLE_CONFIG[dto.role];
    const docId = new Types.ObjectId(config.doc);

    // ensure memory limit not exceeded
    const rateDoc = await this.universityConnection
      .collection('rate_limit')
      .findOne({ [`${config.array}.${config.idField}`]: dto.id });

    // find user entry in rate_limit (if present) to read current used and max
    const rlUser = (rateDoc?.[config.array] as any[] | undefined)?.find(
      (u: any) => u[config.idField] === dto.id
    );

    const used = rlUser?.memory_count_used ?? 0;
    const max = (rateDoc?.memory_count ?? 0);

    if (max > 0 && used >= max) {
      return {
        error: 'Memory limit reached. Please delete existing chats to create a new one.',
        code: 'MEMORY_LIMIT_EXCEEDED'
      };
    }

    const doc = await this.universityConnection
      .collection("memory")
      .findOne({ _id: docId });
    if (!doc) return { error: "Document not found" };

    const userArr = doc[config.array] || [];
    const user = userArr.find((u: any) => u[config.idField] === dto.id);
    const nextSessionId =
      user && user.sessions ? String(user.sessions.length + 1) : "1";

    // push new session
    await this.universityConnection.collection("memory").updateOne(
      { _id: docId },
      {
        $push: {
          [`${config.array}.$[user].sessions`]: {
            session_id: nextSessionId,
            session_name: dto.session_name,
            qa: []
          }
        } as any
      },
      {
        arrayFilters: [{ [`user.${config.idField}`]: dto.id }]
      }
    );

    // recalc session count and update memory_count_used
    const updatedDoc = await this.universityConnection
      .collection("memory")
      .findOne({ _id: docId });

    const updatedUserArr = (updatedDoc?.[config.array] as any[]) ?? [];
    const updatedUser = updatedUserArr.find((u: any) => u[config.idField] === dto.id);
    const sessionCount = updatedUser?.sessions?.length ?? 0;

    try {
      await this.adminService.setUserMemoryCount(dto.role, dto.id, sessionCount);
    } catch (err) {
      console.error("Failed to update memory_count_used:", err);
    }

    return { session_id: nextSessionId };
  }

  async addQA(dto: AddQADto) {
    const config = ROLE_CONFIG[dto.role];
    const docId = new Types.ObjectId(config.doc);

    // compute tokens for the question
    const inputTokens = this.calcTokensFromText(dto.question);

    // ===== robust user balance lookup =====
    let rlDoc = await this.universityConnection
      .collection("rate_limit")
      .findOne({ _id: new Types.ObjectId(config.doc) });

    if (!rlDoc || !Array.isArray(rlDoc[config.array])) {
      rlDoc = await this.universityConnection
        .collection("rate_limit")
        .findOne(
          { [`${config.array}.${config.idField}`]: dto.id },
          { projection: { [config.array]: { $elemMatch: { [config.idField]: dto.id } } } as any }
        );
    } else {
      rlDoc = await this.universityConnection
        .collection("rate_limit")
        .findOne(
          { _id: rlDoc._id, [`${config.array}.${config.idField}`]: dto.id },
          { projection: { [config.array]: { $elemMatch: { [config.idField]: dto.id } } } as any }
        );
    }

    const rlUser = (rlDoc?.[config.array] as any[])?.[0] ?? null;

    if (!rlUser) {
      console.warn(`rate_limit entry not found for role=${dto.role} id=${dto.id}`);
      return {
        error: `User rate-limit record not found. Balances reset daily at 12:00 AM.`,
        code: "RATE_LIMIT_MISSING"
      };
    }

    // Check request limits first
    const availableRequests = Number(rlUser.balance_request_per_day ?? 0);
    if (availableRequests < 1) {
      return {
        error: `Request limit exhausted. You have ${availableRequests} requests remaining. Balances reset daily at 12:00 AM.`,
        code: "REQUEST_LIMIT_EXHAUSTED",
        needed: 1,
        balance: availableRequests
      };
    }

    // Check file limits
    const availableFileCount = Number(rlUser.balance_file_count ?? 0);
    const maxFileSize = Number(rlDoc?.file_size ?? 5);

    if (dto.files && dto.files.length > 0) {
      if (dto.files.length > availableFileCount) {
        return {
          error: `File count limit exceeded. You can upload up to ${availableFileCount} files. Balances reset daily at 12:00 AM.`,
          code: "FILE_COUNT_EXHAUSTED",
          needed: dto.files.length,
          balance: availableFileCount
        };
      }
      
      for (const file of dto.files) {
        if (file.size > maxFileSize * 1024 * 1024) {
          return {
            error: `File "${file.name}" exceeds the size limit of ${maxFileSize}MB. Balances reset daily at 12:00 AM.`,
            code: "FILE_SIZE_EXCEEDED",
            needed: Math.ceil(file.size / (1024 * 1024)),
            balance: maxFileSize,
            fileName: file.name
          };
        }
      }
    }

    const availableInput = Number(rlUser.balance_input_token_per_day ?? 0);
    const availableOutput = Number(rlUser.balance_output_token_per_day ?? 0);

    if (availableInput < inputTokens) {
      return {
        error: `Input token exhausted. Your input requires ${inputTokens} tokens but you have ${availableInput}. Balances reset daily at 12:00 AM.`,
        code: "INPUT_TOKEN_EXHAUSTED",
        needed: inputTokens,
        balance: availableInput
      };
    }

    // ✅ Call Python orchestration service with properly formatted files and collegeName
    let actualAnswer: string;
    try {
      actualAnswer = await this.callPythonOrchestration(
        dto.role,
        dto.id,
        dto.question,
        dto.files, // ✅ Pass files as-is (already formatted in payload)
        dto.collegeName // ✅ Pass college name
      );
    } catch (error) {
      console.error('Failed to get response from Python orchestration:', error);
      actualAnswer = "I'm experiencing technical difficulties. Please try again later.";
    }

    // Calculate actual output tokens
    const actualOutputTokens = this.calcTokensFromText(actualAnswer);

    if (availableOutput < actualOutputTokens) {
      return {
        error: `Output token exhausted. Response requires ${actualOutputTokens} tokens but you have ${availableOutput}. Balances reset daily at 12:00 AM.`,
        code: "OUTPUT_TOKEN_EXHAUSTED",
        needed: actualOutputTokens,
        balance: availableOutput
      };
    }

    // ✅ Store files in QA record with base64 data for reference
    const qaRecord: any = {
      question: dto.question,
      answer: actualAnswer,
      timestamp: dto.timestamp
    };

    // Add files to QA record if present
    if (dto.files && dto.files.length > 0) {
      qaRecord.files = dto.files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        // ✅ Store base64 content if present
        ...(file.data ? { data: file.data } : {})
      }));
    }

    // push QA into session
    const result = await this.universityConnection.collection("memory").updateOne(
      { _id: docId },
      {
        $push: {
          [`${config.array}.$[stud].sessions.$[sess].qa`]: qaRecord
        } as any
      },
      {
        arrayFilters: [
          { [`stud.${config.idField}`]: dto.id },
          { "sess.session_id": dto.session_id }
        ]
      }
    );

    if ((result.modifiedCount ?? 0) === 0) {
      await this.universityConnection.collection("memory").updateOne(
        { _id: docId, [`${config.array}.${config.idField}`]: dto.id },
        {
          $push: {
            [`${config.array}.$.sessions`]: {
              session_id: dto.session_id,
              session_name: (dto as any).session_name ?? `Session ${dto.session_id}`,
              qa: [qaRecord]
            }
          } as any
        }
      );
    }

    // Deduct tokens and requests
    try {
      await this.adminService.adjustUserTokens(dto.role, dto.id, inputTokens, actualOutputTokens);
      await this.adminService.adjustUserRequests(dto.role, dto.id, 1);
      if (dto.files && dto.files.length > 0) {
        await this.adminService.adjustUserFileCount(dto.role, dto.id, dto.files.length);
      }
    } catch (err) {
      console.error("Failed to adjust user tokens/requests/files:", err);
    }

    return { success: true, answer: actualAnswer, tokens_used: { input: inputTokens, output: actualOutputTokens } };
  }

  async deleteSession(dto: DeleteSessionDto) {
    const config = ROLE_CONFIG[dto.role];
    const docId = new Types.ObjectId(config.doc);

    // Remove session from the specific user's sessions array using arrayFilters
    await this.universityConnection.collection("memory").updateOne(
      { _id: docId },
      {
        $pull: {
          [`${config.array}.$[user].sessions`]: { session_id: dto.session_id }
        } as any
      },
      {
        arrayFilters: [{ [`user.${config.idField}`]: dto.id }]
      }
    );

    // Re-fetch document and compute updated session count for the user
    const updatedDoc = await this.universityConnection
      .collection("memory")
      .findOne({ _id: docId });

    const updatedUserArr = (updatedDoc?.[config.array] as any[]) ?? [];
    const updatedUser = updatedUserArr.find((u: any) => u[config.idField] === dto.id);
    const sessionCount = updatedUser?.sessions?.length ?? 0;

    // Update memory_count_used in rate_limit via AdminService
    try {
      await this.adminService.setUserMemoryCount(dto.role, dto.id, sessionCount);
    } catch (err) {
      console.error("Failed to update memory_count_used after deleteSession:", err);
    }

    return { success: true };
  }

  async deleteUser(dto: DeleteUserDto) {
    const config = ROLE_CONFIG[dto.role];
    const docId = new Types.ObjectId(config.doc);

    // Remove user from memory array
    const memResult = await this.universityConnection.collection("memory").updateOne(
      { _id: docId },
      { $pull: { [config.array]: { [config.idField]: dto.id } } as any }
    );

    // Remove user from user collection array (students, faculty, etc.)
    const userDocId = new Types.ObjectId("68d3d10671bbe5af3a79a45b");
    const arrayName = dto.role === "faculty" ? "faculty" : `${config.array}s`;
    const userResult = await this.universityConnection.collection("user").updateOne(
      { _id: userDocId },
      { $pull: { [arrayName]: { [config.idField]: dto.id } } as any }
    );

    // Remove user from rate_limit collection
    await this.adminService.deleteUserRateLimit(dto.role, dto.id);

    return { memResult, userResult, success: true };
  }

    async getUserMemory(role: string, id: string) {
    const config = ROLE_CONFIG[role];
    const docId = new Types.ObjectId(config.doc);

    const doc = await this.universityConnection
      .collection("memory")
      .findOne({ _id: docId });
    if (!doc) return null;

    const user = (doc[config.array] || []).find(
      (u: any) => u[config.idField] === id
    );

    // Also fetch rate limit data to include file limits and balances
    let rateLimitUser: any = null;
    let docLevelLimits: { file_size: number } | null = null;
    try {
      const rateLimitDoc = await this.universityConnection
        .collection("rate_limit")
        .findOne({ [`${config.array}.${config.idField}`]: id });
      
      if (rateLimitDoc && rateLimitDoc[config.array]) {
        rateLimitUser = (rateLimitDoc[config.array] as any[]).find((u: any) => u[config.idField] === id);
        // Also get doc-level file_size limit
        docLevelLimits = {
          file_size: rateLimitDoc.file_size || 5 // fallback to 5MB
        };
      }
    } catch (err) {
      console.warn("Could not fetch rate limit data for user:", err);
    }

    // Merge user data with rate limit data
    if (user && rateLimitUser && docLevelLimits) {
      return {
        ...user,
        balance_input_token_per_day: rateLimitUser.balance_input_token_per_day,
        balance_output_token_per_day: rateLimitUser.balance_output_token_per_day,
        balance_request_per_day: rateLimitUser.balance_request_per_day,
        balance_file_count: rateLimitUser.balance_file_count,
        file_size: docLevelLimits.file_size, // doc-level file size limit
        memory_count_used: rateLimitUser.memory_count_used
      };
    }

    return user || null;
  }

  // Add this new method to ChatbotService class

  // Update processUploadedFile method

// Update processUploadedFile method

// Update processUploadedFile method with proper FormData instantiation

async processUploadedFile(
  userId: string,
  userRole: string,
  qaId: string,
  fileBuffer: Buffer,
  fileName: string,
  fileSize: number
): Promise<void> {
  try {
    console.log(`Processing uploaded file: ${fileName} (${fileSize} bytes)`);

    const pythonServiceUrl = this.configService.get<string>('PYTHON_ORCHESTRATION_URL') || 
                            process.env.PYTHON_ORCHESTRATION_URL ||
                            'http://localhost:5000';

    const baseUrl = pythonServiceUrl.replace(/\/$/, '');

    // ✅ Create FormData instance with fallback
    let formData: any;
    try {
      formData = new FormData();
    } catch (e) {
      const FormDataClass = require('form-data');
      formData = new FormDataClass();
    }

    formData.append('qa_id', qaId);
    formData.append('user_id', userId);
    formData.append('role', userRole);

    const stream = Readable.from(fileBuffer);
    formData.append('file', stream, {
      filename: fileName,
      contentType: 'application/pdf'
    });

    console.log('Sending file to Python orchestration service:', {
      qa_id: qaId,
      user_id: userId,
      role: userRole,
      file: {
        name: fileName,
        size: fileSize,
        type: 'application/pdf'
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const endpoints = [
      `${baseUrl}/process/upload`,
      `${baseUrl}/upload`,
      `${baseUrl}/api/upload`
    ];

    let lastError: any;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: formData.getHeaders(),
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ File processing response:', responseData);
          return;
        } else {
          lastError = new Error(`${endpoint} returned ${response.status}`);
          console.warn(`❌ ${endpoint} failed: ${response.status}`);
          continue;
        }
      } catch (endpointError) {
        lastError = endpointError;
        console.warn(`❌ Failed to connect to ${endpoint}:`, (endpointError as any).message);
        continue;
      }
    }

    clearTimeout(timeoutId);
    console.warn('File processing failed, but message already saved:', lastError);

  } catch (error) {
    console.error('Error processing uploaded file:', error);
  }
}
}

