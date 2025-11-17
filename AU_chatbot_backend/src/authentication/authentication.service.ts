import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { AdminService } from '../admin/admin.service';
import { ObjectId } from "mongodb";
import { ChatbotService } from '../chatbot/chatbot.service';
 
@Injectable()
export class AuthenticationService {
  constructor(
    @InjectConnection('anna') private annaConnection: Connection,
    @InjectConnection('university') private universityConnection: Connection,
    private adminService: AdminService,
    private chatbotService: ChatbotService, // add injection
  ) {}

  // Find user in Anna_university by role and id (for non-admin users only)
  async findAnnaUser(role: string, id: string): Promise<any> {
    const doc = await this.annaConnection.collection('user').findOne({});
    if (!doc) return null;
    let user: any = null;
    if (role === 'student') {
      user = doc.students.find((s: any) => s.student_id === id);
    } else if (role === 'faculty') {
      user = doc.faculty.find((f: any) => f.faculty_id === id);
    } else if (role === 'official') {
      user = doc.officials.find((o: any) => o.official_id === id);
    } else if (role === 'scholar') {
      user = doc.scholars.find((s: any) => s.scholar_id === id);
    }
    return user;
  }

  // Updated login method with enhanced debugging
  async login(college: string, role: string, id: string, password: string) {
    console.log(`Login attempt - College: ${college}, Role: ${role}, ID: ${id}`);
    
    // Validate college
    if (college !== 'Anna_university') {
      throw new Error('Invalid college selected.');
    }

    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");
    const doc = await this.universityConnection.collection('user').findOne({ _id: universityObjectId });
    
    console.log("Database document found:", !!doc);
    if (!doc) throw new Error("University data not found.");
    
    // Log the entire document structure for debugging (remove sensitive data)
    console.log("Document structure:", {
      _id: doc._id,
      admin_id: doc.admin_id,
      admin_id_type: typeof doc.admin_id,
      university_name: doc.university_name,
      has_password: !!doc.password,
      has_email: !!doc.email,
      has_name: !!doc.name
    });

    let foundUser: any = null;
    let foundRole: string | null = null;

    // Handle admin login - check only university database
    if (role === "admin") {
      console.log("Admin login detected, checking university database...");
      console.log("Document admin_id:", doc.admin_id, typeof doc.admin_id);
      console.log("Login ID:", id, typeof id);
      console.log("Document has password:", !!doc.password);
      
      // Try both string and number comparison
      const adminIdMatch = (doc.admin_id === id) || 
                          (doc.admin_id === parseInt(id, 10)) || 
                          (String(doc.admin_id) === String(id));
      
      console.log("Admin ID match result:", adminIdMatch);
      
      if (adminIdMatch) {
        if (!doc.password) {
          throw new Error("Admin account not configured. Please contact system administrator.");
        }
        foundUser = {
          admin_id: doc.admin_id,
          email: doc.email,
          name: doc.name || 'Admin',
          password: doc.password,
          university_name: doc.university_name
        };
        foundRole = "admin";
        console.log("Admin user found:", { admin_id: foundUser.admin_id, name: foundUser.name });
      } else {
        console.log("Admin ID mismatch - checking all fields in document:");
        console.log("All document keys:", Object.keys(doc));
        throw new Error("Admin account not found for the given ID.");
      }
    } else {
      // Handle other user types - check university database first, then validate against Anna database
      const roleArrays = [
        { array: "students", idField: "student_id" },
        { array: "faculty", idField: "faculty_id" },
        { array: "scholars", idField: "scholar_id" },
        { array: "officials", idField: "official_id" },
      ];
      
      for (const { array, idField } of roleArrays) {
        const users = doc[array] || [];
        console.log(`Checking ${array} array, count:`, users.length);
        const user = users.find((u: any) => u[idField] === id);
        if (user) {
          foundUser = user;
          foundRole = array.slice(0, -1); // "students" -> "student"
          break;
        }
      }
      
      // For non-admin users, also verify they exist in Anna University database
      if (foundUser) {
        const annaUser = await this.findAnnaUser(role, id);
        if (!annaUser) {
          throw new Error("User not found in Anna University records.");
        }
      }
    }

    if (!foundUser) {
      console.log("No user found. Final check - document keys:", Object.keys(doc));
      throw new Error("Account not found for the given ID.");
    }

    if (foundRole !== role) {
      
      throw new Error("Role mismatch: The ID exists, but not under the selected role.");
    }

    // Verify password
    const valid = await bcrypt.compare(password, foundUser.password);
    if (!valid) throw new Error("Incorrect password.");

    console.log("Login successful for:", foundRole, id);

    return { 
      message: "Login successful.", 
      user: { 
        ...foundUser, 
        password: undefined, // Remove password from response
        role: foundRole,
        college: doc.university_name
      } 
    };
  }

  // Generate and send verification code (for non-admin users only)
  async signupAndSendEmail(college: string, role: string, id: string) {
    // Validate college
    if (college !== 'Anna_university') {
      throw new Error('Invalid college selected.');
    }

    // Admin users cannot use signup - they are pre-configured
    if (role === "admin") {
      throw new Error("Admin accounts cannot be created through signup. Please contact system administrator.");
    }

    // Check if already signed up
    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");
    let arrayField = "";
    let idField = "";
    if (role === "student") { arrayField = "students"; idField = "student_id"; }
    else if (role === "faculty") { arrayField = "faculty"; idField = "faculty_id"; }
    else if (role === "scholar") { arrayField = "scholars"; idField = "scholar_id"; }
    else if (role === "official") { arrayField = "officials"; idField = "official_id"; }
    else throw new Error("Invalid role.");

    const doc = await this.universityConnection.collection('user').findOne({ _id: universityObjectId });
    if (!doc) throw new Error("University data not found.");

    const alreadyExists = (doc[arrayField] || []).some((u: any) => u[idField] === id);
    if (alreadyExists) throw new Error("You have already signed up. Please login.");

    const annaUser = await this.findAnnaUser(role, id);
    if (!annaUser) {
      throw new Error('User not found. Please check your role and ID and try again.');
    }

    // Check resend count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resendRecord = await this.universityConnection.collection('verifications').findOne({ role, id });
    let resendCount = 0;
    let lastSentDate: Date | null = null;
    if (resendRecord && resendRecord.lastSentDate) {
      lastSentDate = new Date(resendRecord.lastSentDate);
      if (lastSentDate >= today) {
        resendCount = resendRecord.resendCount || 0;
      }
    }
    if (resendCount >= 3) {
      throw new Error('You have reached the maximum number of resends for today. Please try again tomorrow.');
    }

    // Generate code and expiry
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.universityConnection.collection('verifications').updateOne(
      { role, id },
      {
        $set: {
          code,
          expiresAt,
          resendCount: resendCount + 1,
          lastSentDate: new Date(),
        },
      },
      { upsert: true }
    );

    // Send only the code (no link)
    await this.sendMail(
      annaUser.email,
      'Your Verification Code',
      `<p>Hello ${annaUser.name || ''},</p>
       <p>Your verification code is: <b>${code}</b></p>
       <p>This code is valid for 5 minutes. You can request a new code up to 3 times per day.</p>`
    );

    return {
      message: 'Verification code sent successfully.',
      email: annaUser.email,
      name: annaUser.name,
      resendCount: resendCount + 1,
    };
  }

  // Send reset code - handle admin separately
  async sendResetCode(college: string, role: string, id: string) {
    // Validate college
    if (college !== 'Anna_university') {
      throw new Error('Invalid college selected.');
    }

    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");
    const doc = await this.universityConnection.collection('user').findOne({ _id: universityObjectId });
    if (!doc) throw new Error("University data not found.");

    let user: any = null;
    let userEmail: string = '';

    if (role === "admin") {
      // For admin, check only university database
      if (doc.admin_id === id) {
        user = doc;
        userEmail = doc.email;
      } else {
        throw new Error("Admin account not found.");
      }
    } else {
      // For other users, check university database and validate email from Anna database
      let arrayField = "";
      let idField = "";
      if (role === "student") { arrayField = "students"; idField = "student_id"; }
      else if (role === "faculty") { arrayField = "faculty"; idField = "faculty_id"; }
      else if (role === "scholar") { arrayField = "scholar"; idField = "scholar_id"; }
      else if (role === "official") { arrayField = "officials"; idField = "official_id"; }
      else throw new Error("Invalid role.");

      user = (doc[arrayField] || []).find((u: any) => u[idField] === id);
      if (!user) throw new Error("Account not found. Please sign up first.");

      // Get email from Anna University database
      const annaUser = await this.findAnnaUser(role, id);
      if (!annaUser) throw new Error("User not found in Anna University records.");
      userEmail = annaUser.email;
    }

    // Check resend count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resendRecord = await this.universityConnection.collection('reset_verifications').findOne({ role, id });
    let resendCount = 0;
    let lastSentDate: Date | null = null;
    if (resendRecord && resendRecord.lastSentDate) {
      lastSentDate = new Date(resendRecord.lastSentDate);
      if (lastSentDate >= today) {
        resendCount = resendRecord.resendCount || 0;
      }
    }
    if (resendCount >= 3) {
      throw new Error('You have reached the maximum number of resends for today. Please try again tomorrow.');
    }

    // Generate code and expiry
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.universityConnection.collection('reset_verifications').updateOne(
      { role, id },
      {
        $set: {
          code,
          expiresAt,
          resendCount: resendCount + 1,
          lastSentDate: new Date(),
        },
      },
      { upsert: true }
    );

    // Send only the code (no link)
    await this.sendMail(
      userEmail,
      'Your Password Reset Code',
      `<p>Hello ${role === 'admin' ? 'Admin' : user.name || ''},</p>
       <p>Your password reset code is: <b>${code}</b></p>
       <p>This code is valid for 5 minutes. You can request a new code up to 3 times per day.</p>`
    );

    return {
      message: 'Reset code sent successfully.',
      email: userEmail,
      name: role === 'admin' ? 'Admin' : (user.name || ''),
      resendCount: resendCount + 1,
    };
  }

  async sendMail(to: string, subject: string, html: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  }

  async verifyCodeWithInput(role: string, id: string, code: string) {
    const record = await this.universityConnection.collection('verifications').findOne({ role, id, code });
    if (!record) throw new Error('Invalid verification code.');
    if (new Date(record.expiresAt) < new Date()) throw new Error('Verification code expired.');
    return { message: 'Code valid' };
  }

  async verify(token: string, password: string, college: string) {
    if (college !== 'Anna_university') {
      throw new Error('Invalid college selected.');
    }

    const [role, id] = Buffer.from(token, 'base64').toString().split(':');
    
    if (role === 'admin') {
      throw new Error('Admin accounts cannot be created through verification.');
    }

    const annaUser = await this.findAnnaUser(role, id);
    if (!annaUser) throw new Error('User not found in Anna University records.');

    const hashed = await bcrypt.hash(password, 10);
    const userDoc = {
      ...annaUser,
      password: hashed,
      createdAt: new Date(),
    };

    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");
    let arrayField = "";
    if (role === "student") arrayField = "students";
    else if (role === "faculty") arrayField = "faculty";
    else if (role === "scholar") arrayField = "scholars";
    else if (role === "official") arrayField = "officials";
    else throw new Error("Invalid role for signup.");

    await this.universityConnection.collection('user').updateOne(
      { _id: universityObjectId },
      { $push: { [arrayField]: userDoc } }
    );

    // create per-user rate_limit entry
    try {
      await this.adminService.createUserRateLimit(role, id, annaUser.name || userDoc.name || '');
    } catch (err: any) {
      // log full error details (keeps signup successful)
      console.error('Failed to create rate limit entry for new user:', err && err.message ? `${err.name}: ${err.message}` : err);
    }

    // Ensure memory document exists for the role before calling ChatbotService.addUser
    try {
      const ROLE_MEMORY: Record<string, { array: string; doc: any }> = {
        student: { array: "student", doc: new ObjectId("68d7e0b04f788da2cf74e392") },
        faculty: { array: "faculty", doc: new ObjectId("68d7e9464f788da2cf74e397") },
        scholar:  { array: "scholar",  doc: new ObjectId("68d7e9614f788da2cf74e399") },
        official: { array: "official", doc: new ObjectId("68d7e9764f788da2cf74e39b") },
      };

      const memCfg = ROLE_MEMORY[role];
      if (!memCfg) {
        console.warn(`No memory configuration for role: ${role}`);
      } else {
        // create memory document if missing and ensure the role array is initialized
        await this.universityConnection.collection('memory').updateOne(
          { _id: memCfg.doc },
          {
            $setOnInsert: { _id: memCfg.doc, [memCfg.array]: [] }
          },
          { upsert: true }
        );
      }
    } catch (memPrepErr: any) {
      console.error('Failed to prepare memory document before addUser:', memPrepErr && memPrepErr.message ? `${memPrepErr.name}: ${memPrepErr.message}` : memPrepErr);
    }

    // NEW: create memory entry by calling ChatbotService.addUser
    try {
      await this.chatbotService.addUser({ role, id, name: annaUser.name || userDoc.name || '' });
    } catch (memErr: any) {
      // show detailed error instead of [object Object]
      if (memErr instanceof Error) {
        console.error('Memory creation failed after signup:', memErr.stack || memErr.message);
      } else {
        try {
          console.error('Memory creation failed after signup:', JSON.stringify(memErr, Object.getOwnPropertyNames(memErr)));
        } catch {
          console.error('Memory creation failed after signup (non-serializable):', memErr);
        }
      }
    }

    await this.universityConnection.collection('verifications').deleteOne({ role, id });

    return {
      message: 'Signup complete.',
      name: annaUser.name,
      role: role,
      id: id
    };
  }

  async verifyResetCode(role: string, id: string, code: string) {
    const record = await this.universityConnection.collection('reset_verifications').findOne({ role, id, code });
    if (!record) throw new Error('Invalid or expired reset code.');
    if (new Date(record.expiresAt) < new Date()) throw new Error('Reset code expired.');
    return { message: 'Code valid' };
  }

  async resetPassword(college: string, role: string, id: string, code: string, password: string) {
    if (college !== 'Anna_university') {
      throw new Error('Invalid college selected.');
    }

    await this.verifyResetCode(role, id, code);
    const hashed = await bcrypt.hash(password, 10);
    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");

    if (role === "admin") {
      await this.universityConnection.collection('user').updateOne(
        { _id: universityObjectId, admin_id: id },
        { $set: { password: hashed } }
      );
    } else {
      let arrayField = "";
      let idField = "";
      if (role === "student") { arrayField = "students"; idField = "student_id"; }
      else if (role === "faculty") { arrayField = "faculty"; idField = "faculty_id"; }
      else if (role === "scholar") { arrayField = "scholars"; idField = "scholar_id"; }
      else if (role === "official") { arrayField = "officials"; idField = "official_id"; }
      else throw new Error("Invalid role.");

      await this.universityConnection.collection('user').updateOne(
        { _id: universityObjectId, [`${arrayField}.${idField}`]: id },
        { $set: { [`${arrayField}.$.password`]: hashed } }
      );
    }

    await this.universityConnection.collection('reset_verifications').deleteOne({ role, id });
    return { message: 'Password reset successful.' };
  }

  async getAllAnnaDetails() {
    const doc = await this.annaConnection.collection('user').findOne({});
    if (!doc) {
      throw new Error('No Anna University data found.');
    }
    return doc;
  }

  async incrementGuestVisit(college: string, guestType: "visitor" | "university_member") {
    if (college !== 'Anna_university') {
      throw new Error('Invalid college selected.');
    }

    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");
    const visitField = guestType === "visitor" ? "visit.visitor" : "visit.university_member";

    const doc = await this.universityConnection.collection('user').findOne({ _id: universityObjectId });
    let current = 0;
    if (doc && doc.visit) {
      if (guestType === "visitor") {
        current = parseInt(doc.visit.visitor || "0", 10);
      } else {
        current = parseInt(doc.visit.university_member || "0", 10);
      }
    }
    const newCount = current + 1;

    await this.universityConnection.collection('user').updateOne(
      { _id: universityObjectId },
      { $set: { [visitField]: String(newCount) } },
      { upsert: true }
    );

    return { count: newCount };
  }

  // New helper: return current resendCount and remaining attempts
  async getVerificationStatus(role: string, id: string) {
    if (!role || !id) {
      throw new Error('role and id are required');
    }
    const record = await this.universityConnection.collection('verifications').findOne({ role, id });
    const resendCount = (record && record.resendCount) ? Number(record.resendCount) : 0;
    return {
      resendCount,
      remaining: Math.max(0, 3 - resendCount)
    };
  }
}