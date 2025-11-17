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

  // Set rate limits for a role and update all users in the array for that role
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

    // Update the main document
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

    // Update all users in the array for this role (except guest, which is always empty)
    if (config.arrayField !== "guest") {
      // Fetch the document again to get the latest array
      const docAfterUpdate = await this.universityConnection
        .collection('rate_limit')
        .findOne({ _id: docId });

      const userArray = docAfterUpdate?.[config.arrayField] || [];
      // Update each user in the array
      const updatedUsers = userArray.map((user: any) => ({
        ...user,
        balance_request_per_day: safeData.request_per_day,
        balance_input_token_per_day: safeData.input_token_per_day,
        balance_output_token_per_day: safeData.output_token_per_day,
        balance_file_count: safeData.file_count,
        memory_count_used: user.memory_count_used ?? 0, // keep user's memory usage
        last_reset: new Date()
      }));

      // Set the updated array back in the document
      await this.universityConnection
        .collection('rate_limit')
        .updateOne(
          { _id: docId },
          { $set: { [config.arrayField]: updatedUsers } }
        );
    }

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

    // Fetch document
    const doc = await this.universityConnection
      .collection('rate_limit')
      .findOne({ _id: docId });

    // If document does not exist, create it with defaults and the new user in the array
    if (!doc) {
      const newDoc: any = {
        _id: docId,
        request_per_day: defaultLimits.request_per_day,
        input_token_per_day: defaultLimits.input_token_per_day,
        output_token_per_day: defaultLimits.output_token_per_day,
        file_count: defaultLimits.file_count,
        file_size: defaultLimits.file_size,
        memory_count: defaultLimits.memory_count,
        [config.arrayField]: [
          {
            [config.idField]: userId,
            name,
            balance_request_per_day: defaultLimits.request_per_day,
            balance_input_token_per_day: defaultLimits.input_token_per_day,
            balance_output_token_per_day: defaultLimits.output_token_per_day,
            balance_file_count: defaultLimits.file_count,
            memory_count_used: 0,
            last_reset: new Date()
          }
        ]
      };
      await this.universityConnection.collection('rate_limit').insertOne(newDoc);
      return newDoc[config.arrayField][0];
    }

    // Document exists: ensure array exists
    const userArray = Array.isArray(doc[config.arrayField]) ? doc[config.arrayField] : [];

    // Try to find existing user
    const existingUser = userArray.find((u: any) => u[config.idField] === userId);
    if (existingUser) {
      // If user's last_reset is older than today, reset their balances
      const lastReset = new Date(existingUser.last_reset || 0);
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (lastReset < todayStart) {
        await this.resetUserDailyLimits(role, userId);
        // re-fetch and return updated user
        const updatedDoc = await this.universityConnection.collection('rate_limit').findOne({ _id: docId });
        const updatedArray = Array.isArray(updatedDoc?.[config.arrayField]) ? updatedDoc[config.arrayField] : [];
        return updatedArray.find((u: any) => u[config.idField] === userId) ?? existingUser;
      }
      return existingUser;
    }

    // User not found -> push new user entry
    const newUser: any = {
      [config.idField]: userId,
      name,
      balance_request_per_day: defaultLimits.request_per_day,
      balance_input_token_per_day: defaultLimits.input_token_per_day,
      balance_output_token_per_day: defaultLimits.output_token_per_day,
      balance_file_count: defaultLimits.file_count,
      memory_count_used: 0,
      last_reset: new Date()
    };

    const pushUpdate: any = { $push: { [config.arrayField]: newUser } };
    await this.universityConnection.collection('rate_limit').updateOne(
      { _id: docId },
      pushUpdate
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

  // Reset all users' daily limits (only balances, not overall document values)
  private async resetAllUserLimits(): Promise<void> {
    try {
      for (const roleKey of Object.keys(ROLE_CONFIG)) {
        const config = ROLE_CONFIG[roleKey];
        const docId = new Types.ObjectId(config.docId);
        const defaultLimits = await this.getRateLimit(roleKey);

        const doc = await this.universityConnection
          .collection('rate_limit')
          .findOne({ _id: docId });

        if (!doc) continue;

        const userArray = Array.isArray(doc[config.arrayField]) ? doc[config.arrayField] : [];

        // Map users to updated balances (preserve other user fields)
        const updatedUsers = userArray.map((user: any) => ({
          ...user,
          balance_request_per_day: defaultLimits.request_per_day,
          balance_input_token_per_day: defaultLimits.input_token_per_day,
          balance_output_token_per_day: defaultLimits.output_token_per_day,
          balance_file_count: defaultLimits.file_count,
          memory_count_used: user.memory_count_used ?? 0,
          last_reset: new Date()
        }));

        // Write only the array field back (preserve other doc-level fields)
        await this.universityConnection
          .collection('rate_limit')
          .updateOne(
            { _id: docId },
            { $set: { [config.arrayField]: updatedUsers } }
          );
      }
      console.log('Daily user balances reset completed at:', new Date());
    } catch (error) {
      console.error('Error resetting daily user balances:', error);
    }
  }

  // Get user data for admin dashboard
  async getUserData() {
    const userStats = await this.getUserStatistics();
    return [
      { id: 1, name: 'Students', role: 'student', count: userStats.students },
      { id: 2, name: 'Faculty', role: 'faculty', count: userStats.faculty },
      { id: 3, name: 'Scholars', role: 'scholar', count: userStats.scholars },
      { id: 4, name: 'Officials', role: 'official', count: userStats.officials },
    ];
  }

  // Get user statistics for dashboard
  async getUserStatistics() {
    try {
      const universityObjectId = new Types.ObjectId("68d3d10671bbe5af3a79a45b");
      const doc = await this.universityConnection.collection('user').findOne({ _id: universityObjectId });
      
      if (!doc) {
        return {
          students: 0,
          faculty: 0,
          scholars: 0,
          officials: 0,
          total: 0
        };
      }

      const students = Array.isArray(doc.students) ? doc.students.length : 0;
      const faculty = Array.isArray(doc.faculty) ? doc.faculty.length : 0;
      const scholars = Array.isArray(doc.scholars) ? doc.scholars.length : 0;
      const officials = Array.isArray(doc.officials) ? doc.officials.length : 0;
      const total = students + faculty + scholars + officials;

      return {
        students,
        faculty,
        scholars,
        officials,
        total
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return {
        students: 0,
        faculty: 0,
        scholars: 0,
        officials: 0,
        total: 0
      };
    }
  }

  // Get guest statistics for dashboard
  async getGuestStatistics() {
    try {
      const universityObjectId = new Types.ObjectId("68d3d10671bbe5af3a79a45b");
      const doc = await this.universityConnection.collection('user').findOne({ _id: universityObjectId });
      
      if (!doc || !doc.visit) {
        return {
          visitor: 0,
          university_member: 0,
          total: 0
        };
      }

      const visitor = parseInt(doc.visit.visitor || '0', 10);
      const university_member = parseInt(doc.visit.university_member || '0', 10);
      const total = visitor + university_member;

      return {
        visitor,
        university_member,
        total
      };
    } catch (error) {
      console.error('Error getting guest statistics:', error);
      return {
        visitor: 0,
        university_member: 0,
        total: 0
      };
    }
  }

  // Add this helper to set memory_count_used for a user (uses admin ROLE_CONFIG docId)
  async setUserMemoryCount(role: string, userId: string, count: number): Promise<void> {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error('Invalid role');

    const docId = new Types.ObjectId(config.docId);
    await this.universityConnection
      .collection('rate_limit')
      .updateOne(
        { _id: docId, [`${config.arrayField}.${config.idField}`]: userId },
        { $set: { [`${config.arrayField}.$.memory_count_used`]: count } }
      );
  }

  /**
   * Adjust user's balance tokens (deduct amounts). Ensures values don't go negative.
   * inputDeduct / outputDeduct are numbers (tokens to subtract)
   */
  async adjustUserTokens(role: string, userId: string, inputDeduct = 0, outputDeduct = 0) {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error("Invalid role");
    const docId = new Types.ObjectId(config.docId);
    const collection = this.universityConnection.collection("rate_limit");

    const doc = await collection.findOne({ _id: docId });
    if (!doc) return null;

    const users = (doc[config.arrayField] as any[]) ?? [];
    const user = users.find(u => u?.[config.idField] === userId);
    if (!user) return null;

    const newInput = Math.max(0, (user.balance_input_token_per_day ?? 0) - inputDeduct);
    const newOutput = Math.max(0, (user.balance_output_token_per_day ?? 0) - outputDeduct);

    await collection.updateOne(
      { _id: docId, [`${config.arrayField}.${config.idField}`]: userId },
      {
        $set: {
          [`${config.arrayField}.$.balance_input_token_per_day`]: newInput,
          [`${config.arrayField}.$.balance_output_token_per_day`]: newOutput
        }
      }
    );

    return { balance_input_token_per_day: newInput, balance_output_token_per_day: newOutput };
  }

  // Adjust user request count (decrease balance_request_per_day)
  async adjustUserRequests(role: string, userId: string, requestsUsed: number): Promise<void> {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error('Invalid role');

    const docId = new Types.ObjectId(config.docId);
    
    const updateOp: any = {
      $inc: {
        [`${config.arrayField}.$[user].balance_request_per_day`]: -requestsUsed
      }
    };

    await this.universityConnection.collection('rate_limit').updateOne(
      { _id: docId },
      updateOp,
      {
        arrayFilters: [{ [`user.${config.idField}`]: userId }]
      }
    );
  }

  // Adjust user file count (decrease balance_file_count when files are uploaded)
  async adjustUserFileCount(role: string, userId: string, filesUsed: number): Promise<void> {
    const config = ROLE_CONFIG[role];
    if (!config) throw new Error('Invalid role');

    const docId = new Types.ObjectId(config.docId);
    
    const updateOp: any = {
      $inc: {
        [`${config.arrayField}.$[user].balance_file_count`]: -filesUsed
      }
    };

    await this.universityConnection.collection('rate_limit').updateOne(
      { _id: docId },
      updateOp,
      {
        arrayFilters: [{ [`user.${config.idField}`]: userId }]
      }
    );
  }
}