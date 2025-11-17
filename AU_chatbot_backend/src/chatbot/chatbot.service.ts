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
import fetch from 'node-fetch'; // You might need to install: npm install node-fetch @types/node-fetch

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
  async callPythonOrchestration(role: string, id: string, question: string, files?: any[]): Promise<string> {
    try {
      // Get Python orchestration URL from environment variables
      const pythonServiceUrl = this.configService.get<string>('PYTHON_ORCHESTRATION_URL') || 
                              'https://your-python-codespace-url.app.github.dev'; // Replace with actual URL
      
      console.log('Calling Python orchestration service:', pythonServiceUrl);

      // Prepare the payload for Python service
      const payload = {
        user_query: question,
        role,
        id,
        file: files || []
      };

      // Make HTTP request to Python orchestration service
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const fetch = (await import('node-fetch')).default;
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

      const responseData = await response.json() as any;
      
      // Extract the answer from the response
      const answer = responseData.answer || responseData.response || responseData.message || "I apologize, but I couldn't process your request at the moment.";
      
      console.log('Received response from Python orchestration service');
      return answer;

    } catch (error) {
      console.error('Error calling Python orchestration service:', error);
      
      // Return different error messages based on error type
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return "I'm temporarily unavailable due to a service connection issue. Please try again in a moment.";
      } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return "I'm taking too long to respond. Please try with a simpler question or try again later.";
      } else {
        return "I encountered an error while processing your request. Please try again or rephrase your question.";
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

    // compute tokens for the question (we'll recalculate output tokens after getting response)
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

    // Check request limits first (1 request = 1 chat message sent)
    const availableRequests = Number(rlUser.balance_request_per_day ?? 0);
    if (availableRequests < 1) {
      return {
        error: `Request limit exhausted. You have ${availableRequests} requests remaining. Balances reset daily at 12:00 AM.`,
        code: "REQUEST_LIMIT_EXHAUSTED",
        needed: 1,
        balance: availableRequests
      };
    }

    // Check file limits - ACTIVE VALIDATION
    const availableFileCount = Number(rlUser.balance_file_count ?? 0);
    const maxFileSize = Number(rlDoc?.file_size ?? 5); // MB

    // When files are uploaded, validate them
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

    // Check input tokens
    if (availableInput < inputTokens) {
      return {
        error: `Input token exhausted. Your input requires ${inputTokens} tokens but you have ${availableInput}. Balances reset daily at 12:00 AM.`,
        code: "INPUT_TOKEN_EXHAUSTED",
        needed: inputTokens,
        balance: availableInput
      };
    }

    // ✅ Call Python orchestration service to get real response
    let actualAnswer: string;
    try {
      actualAnswer = await this.callPythonOrchestration(dto.role, dto.id, dto.question, dto.files);
    } catch (error) {
      console.error('Failed to get response from Python orchestration:', error);
      actualAnswer = "I'm experiencing technical difficulties. Please try again later.";
    }

    // ✅ Calculate actual output tokens based on the real response
    const actualOutputTokens = this.calcTokensFromText(actualAnswer);

    // Check if we have enough output tokens for the actual response
    if (availableOutput < actualOutputTokens) {
      return {
        error: `Output token exhausted. Response requires ${actualOutputTokens} tokens but you have ${availableOutput}. Balances reset daily at 12:00 AM.`,
        code: "OUTPUT_TOKEN_EXHAUSTED",
        needed: actualOutputTokens,
        balance: availableOutput
      };
    }

    // push QA into session with the REAL answer (try matching session first)
    const result = await this.universityConnection.collection("memory").updateOne(
      { _id: docId },
      {
        $push: {
          [`${config.array}.$[stud].sessions.$[sess].qa`]: {
            question: dto.question,
            answer: actualAnswer, // ✅ Use real answer from Python orchestration
            timestamp: dto.timestamp
          }
        } as any
      },
      {
        arrayFilters: [
          { [`stud.${config.idField}`]: dto.id },
          { "sess.session_id": dto.session_id }
        ]
      }
    );

    // if session wasn't found/updated, create session and add qa
    if ((result.modifiedCount ?? 0) === 0) {
      await this.universityConnection.collection("memory").updateOne(
        { _id: docId, [`${config.array}.${config.idField}`]: dto.id },
        {
          $push: {
            [`${config.array}.$.sessions`]: {
              session_id: dto.session_id,
              session_name: (dto as any).session_name ?? `Session ${dto.session_id}`,
              qa: [{ 
                question: dto.question, 
                answer: actualAnswer, // ✅ Use real answer from Python orchestration
                timestamp: dto.timestamp 
              }]
            }
          } as any
        }
      );
    }

    // deduct actual tokens AND request count AND file count via admin service
    try {
      await this.adminService.adjustUserTokens(dto.role, dto.id, inputTokens, actualOutputTokens); // ✅ Use actual output tokens
      // Deduct 1 request for this chat message
      await this.adminService.adjustUserRequests(dto.role, dto.id, 1);
      // Deduct file count if files were uploaded
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
}

