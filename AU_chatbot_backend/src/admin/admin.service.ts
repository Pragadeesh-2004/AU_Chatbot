import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Types } from 'mongoose';

type RateLimitData = {
  request_per_day: number;
  input_token_per_day: number;
  output_token_per_day: number;
  file_count: number;
  file_size: number;
  memory_count: number;
};

type UserRateLimit = {
  student_id?: string;
  faculty_id?: string;
  official_id?: string;
  scholar_id?: string;
  guest_id?: string;
  name: string;
  balance_request_per_day: number;
  balance_input_token_per_day: number;   // changed
  balance_output_token_per_day: number;  // changed
  balance_file_count: number;
  memory_count_used: number;
  last_reset: Date;
};

// Role configuration with document IDs
const ROLE_CONFIG = {
  student: {
    docId: "68e35e93b35adcc92a6fbb9b",
    idField: "student_id",
    arrayField: "student"
  },
  faculty: {
    docId: "68e35ed2b35adcc92a6fbb9c",
    idField: "faculty_id",
    arrayField: "faculty"
  },
  official: {
    docId: "68e35f05b35adcc92a6fbb9d",
    idField: "official_id",
    arrayField: "official"
  },
  scholar: {
    docId: "68e35f05b35adcc92a6fbb9e",
    idField: "scholar_id",
    arrayField: "scholar"
  },
  guest: {
    docId: "68e795362392f7ffaf841d0c",
    idField: "guest_id",
    arrayField: "guest"
  }
};

@Injectable()
export class AdminService {
  constructor(
    @InjectConnection('university') private universityConnection: Connection
  ) {
    // Schedule daily reset at 12 AM
    this.scheduleDailyReset();
  }

  // Get rate limits for a role
  async getRateLimit(role: string): Promise<RateLimitData> {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error('Invalid role');

    const docId = new Types.ObjectId(config.docId);
    const doc = await this.universityConnection
      .collection('rate_limit')
      .findOne({ _id: docId });

    if (!doc) {
      // Return default values if document doesn't exist
      return {
        request_per_day: 100,
        input_token_per_day: 1000,
        output_token_per_day: 1000,
        file_count: 5,
        file_size: 10,
        memory_count: 50
      };
    }

    return {
      request_per_day: doc.request_per_day ?? 100,
      input_token_per_day: doc.input_token_per_day ?? 1000,
      output_token_per_day: doc.output_token_per_day ?? 1000,
      file_count: doc.file_count ?? 5,
      file_size: doc.file_size ?? 10,
      memory_count: doc.memory_count ?? 50
    };
  }

  // Set rate limits for a role
  async setRateLimit(role: string, data: RateLimitData): Promise<RateLimitData> {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error('Invalid role');

    const docId = new Types.ObjectId(config.docId);

    // Fetch existing document
    const existing = await this.universityConnection
      .collection('rate_limit')
      .findOne({ _id: docId });

    // Merge: use incoming value if present, else keep existing
    const safeData: RateLimitData = {
      request_per_day: data.request_per_day ?? existing?.request_per_day ?? 100,
      input_token_per_day: data.input_token_per_day ?? existing?.input_token_per_day ?? 1000,
      output_token_per_day: data.output_token_per_day ?? existing?.output_token_per_day ?? 1000,
      file_count: data.file_count ?? existing?.file_count ?? 5,
      file_size: data.file_size ?? existing?.file_size ?? 10,
      memory_count: data.memory_count ?? existing?.memory_count ?? 50,
    };

    await this.universityConnection
      .collection('rate_limit')
      .updateOne(
        { _id: docId },
        { 
          $set: {
            ...safeData,
            updated_at: new Date()
          }
        },
        { upsert: true }
      );

    return safeData;
  }

  // Create user rate limit entry when user logs in
  // ...existing code...

  // Create user rate limit entry when user logs in
  async createUserRateLimit(role: string, userId: string, name: string): Promise<UserRateLimit> {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error('Invalid role');

    // Get default limits for this role
    const defaultLimits = await this.getRateLimit(role);
    
    const docId = new Types.ObjectId(config.docId);
    
    // Check if user already exists
    const doc = await this.universityConnection
      .collection('rate_limit')
      .findOne({ _id: docId });

    const userArray = doc?.[config.arrayField] || [];
    const existingUser = userArray.find((user: any) => user[config.idField] === userId);

    if (existingUser) {
      // Check if daily reset is needed
      const lastReset = new Date(existingUser.last_reset || 0);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (lastReset < today) {
        // Reset daily limits
        await this.resetUserDailyLimits(role, userId);
      }
      
      return existingUser;
    }

    // Create new user entry
    const newUser: UserRateLimit = {
      [config.idField]: userId,
      name,
      balance_request_per_day: defaultLimits.request_per_day,
      balance_input_token_per_day: defaultLimits.input_token_per_day,   // changed
      balance_output_token_per_day: defaultLimits.output_token_per_day, // changed
      balance_file_count: defaultLimits.file_count,
      memory_count_used: 0,
      last_reset: new Date()
    };

    // Fix: Create the push operation object properly
    const pushOperation = {};
    pushOperation[config.arrayField] = newUser;

    const setOnInsertOperation = {
      request_per_day: defaultLimits.request_per_day,
      input_token_per_day: defaultLimits.input_token_per_day,
      output_token_per_day: defaultLimits.output_token_per_day,
      file_count: defaultLimits.file_count,
      file_size: defaultLimits.file_size,
      memory_count: defaultLimits.memory_count
    };

    await this.universityConnection
      .collection('rate_limit')
      .updateOne(
        { _id: docId },
        { 
          $push: pushOperation,
          $setOnInsert: setOnInsertOperation
        },
        { upsert: true }
      );

    return newUser;
  }

  // Reset user daily limits
  async resetUserDailyLimits(role: string, userId: string): Promise<void> {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error('Invalid role');

    const defaultLimits = await this.getRateLimit(role);
    const docId = new Types.ObjectId(config.docId);

    await this.universityConnection
      .collection('rate_limit')
      .updateOne(
        { 
          _id: docId,
          [`${config.arrayField}.${config.idField}`]: userId 
        },
        { 
          $set: {
            [`${config.arrayField}.$.balance_request_per_day`]: defaultLimits.request_per_day,
            [`${config.arrayField}.$.balance_input_token_per_day`]: defaultLimits.input_token_per_day,   // changed
            [`${config.arrayField}.$.balance_output_token_per_day`]: defaultLimits.output_token_per_day, // changed
            [`${config.arrayField}.$.balance_file_count`]: defaultLimits.file_count,
            [`${config.arrayField}.$.last_reset`]: new Date()
          }
        }
      );
  }

  // Delete user rate limit when account is deleted
  // ...existing code...

  // Delete user rate limit when account is deleted
  async deleteUserRateLimit(role: string, userId: string): Promise<void> {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error('Invalid role');

    const docId = new Types.ObjectId(config.docId);

    // Fix: Create the pull operation object properly
    const pullOperation = {};
    pullOperation[config.arrayField] = { [config.idField]: userId };

    await this.universityConnection
      .collection('rate_limit')
      .updateOne(
        { _id: docId },
        { $pull: pullOperation }
      );
  }

  // Get user's current rate limit status
  async getUserRateLimit(role: string, userId: string): Promise<UserRateLimit | null> {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error('Invalid role');

    const docId = new Types.ObjectId(config.docId);
    const doc = await this.universityConnection
      .collection('rate_limit')
      .findOne({ _id: docId });

    if (!doc) return null;

    const userArray = doc[config.arrayField] || [];
    return userArray.find((user: any) => user[config.idField] === userId) || null;
  }

  // Update user usage (decrement balance)
  async updateUserUsage(role: string, userId: string, usage: {
    requests?: number;
    tokens?: { input?: number; output?: number };
    files?: number;
    memory?: number;
  }): Promise<void> {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error('Invalid role');

    const docId = new Types.ObjectId(config.docId);
    const updateFields: any = {};

    if (usage.requests) {
      updateFields[`${config.arrayField}.$.balance_request_per_day`] = -usage.requests;
    }
    if (usage.tokens) {
      updateFields[`${config.arrayField}.$.balance_input_token_per_day`] = -(usage.tokens.input ?? 0);   // changed
      updateFields[`${config.arrayField}.$.balance_output_token_per_day`] = -(usage.tokens.output ?? 0); // changed
    }
    if (usage.files) {
      updateFields[`${config.arrayField}.$.balance_file_count`] = -usage.files;
    }
    if (usage.memory) {
      updateFields[`${config.arrayField}.$.memory_count_used`] = usage.memory;
    }

    if (Object.keys(updateFields).length > 0) {
      await this.universityConnection
        .collection('rate_limit')
        .updateOne(
          { 
            _id: docId,
            [`${config.arrayField}.${config.idField}`]: userId 
          },
          { $inc: updateFields }
        );
    }
  }

  // Schedule daily reset at 12:00 AM
  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.resetAllUserLimits();
      // Schedule for every 24 hours
      setInterval(() => {
        this.resetAllUserLimits();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  // Reset all users' daily limits
  private async resetAllUserLimits(): Promise<void> {
    try {
      for (const role of Object.keys(ROLE_CONFIG)) {
        const config = ROLE_CONFIG[role];
        const docId = new Types.ObjectId(config.docId);
        const defaultLimits = await this.getRateLimit(role);

        await this.universityConnection
          .collection('rate_limit')
          .updateMany(
            { _id: docId },
            {
              $set: {
                [`${config.arrayField}.$[].balance_request_per_day`]: defaultLimits.request_per_day,
                [`${config.arrayField}.$[].balance_input_token_per_day`]: defaultLimits.input_token_per_day,   // changed
                [`${config.arrayField}.$[].balance_output_token_per_day`]: defaultLimits.output_token_per_day, // changed
                [`${config.arrayField}.$[].balance_file_count`]: defaultLimits.file_count,
                [`${config.arrayField}.$[].memory_count_used`]: 0,
                [`${config.arrayField}.$[].last_reset`]: new Date()
              }
            }
          );
      }
      console.log('Daily rate limits reset completed at:', new Date());
    } catch (error) {
      console.error('Error resetting daily limits:', error);
    }
  }

  // Get user data for admin dashboard
  getUserData() {
    return [
      { id: 1, name: 'Guest Users', role: 'guest', count: 0 },
      { id: 2, name: 'Students', role: 'student', count: 0 },
      { id: 3, name: 'Faculty', role: 'faculty', count: 0 },
      { id: 4, name: 'Scholars', role: 'scholar', count: 0 },
      { id: 5, name: 'Officials', role: 'official', count: 0 },
    ];
  }
}