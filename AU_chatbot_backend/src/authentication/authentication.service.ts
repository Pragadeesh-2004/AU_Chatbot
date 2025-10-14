import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { ObjectId } from "mongodb";
import { AdminService } from '../admin/admin.service';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectConnection('anna') private annaConnection: Connection,
    @InjectConnection('university') private universityConnection: Connection,
    private adminService: AdminService,
  ) {}

  // Find user in Anna_university by role and id
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
    } else if (role === 'admin') {
      if (doc.admin_id === id) user = { admin_id: id, email: doc.email, name: 'Admin' };
    }
    return user;
  }

  // Generate and send verification code
  async signupAndSendEmail(role: string, id: string) {
    // Check if already signed up
    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");
    let arrayField = "";
    let idField = "";
    if (role === "student") { arrayField = "students"; idField = "student_id"; }
    else if (role === "faculty") { arrayField = "faculty"; idField = "faculty_id"; }
    else if (role === "scholar") { arrayField = "scholars"; idField = "scholar_id"; }
    else if (role === "official") { arrayField = "officials"; idField = "official_id"; }
    else if (role === "admin") { arrayField = "admin_id"; idField = "admin_id"; }
    else throw new Error("Invalid role.");

    const doc = await this.universityConnection.collection('user').findOne({ _id: universityObjectId });
    if (!doc) throw new Error("University data not found.");

    let alreadyExists = false;
    if (role === "admin") {
      alreadyExists = doc.admin_id === id;
    } else {
      alreadyExists = (doc[arrayField] || []).some((u: any) => u[idField] === id);
    }
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

  // Verify code (called by frontend when link is clicked)
  async verifyCode(role: string, id: string, code: string) {
    const record = await this.universityConnection.collection('verifications').findOne({ role, id, code });
    if (!record) throw new Error('Invalid or expired verification code.');
    if (new Date(record.expiresAt) < new Date()) throw new Error('Verification code expired.');
    return { message: 'Code valid' };
  }

  async sendMail(to: string, subject: string, html: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM, // your Gmail address
        pass: process.env.EMAIL_PASS, // your Gmail App Password
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  }

  // Complete signup (set password)
  async verify(token: string, password: string) {
    // token = base64(role:id:timestamp)
    const [role, id] = Buffer.from(token, 'base64').toString().split(':');
    const annaUser = await this.findAnnaUser(role, id);
    if (!annaUser) throw new Error('User not found in Anna University records.');

    const hashed = await bcrypt.hash(password, 10);

    // Prepare the user object: copy all fields from Anna University, add password
    const userDoc = {
      ...annaUser,
      password: hashed,
      createdAt: new Date(),
    };

    // The university document ObjectId
    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");

    // Determine which array to push to
    let arrayField = "";
    if (role === "student") arrayField = "students";
    else if (role === "faculty") arrayField = "faculty";
    else if (role === "scholar") arrayField = "scholars";
    else if (role === "official") arrayField = "officials";
    else throw new Error("Invalid role for signup.");

    // Push the userDoc into the correct array of the university document
    await this.universityConnection.collection('user').updateOne(
      { _id: universityObjectId },
      { $push: { [arrayField]: userDoc } }
    );

    // Remove verification record
    await this.universityConnection.collection('verifications').deleteOne({ role, id });

    return {
  message: 'Signup complete.',
  name: annaUser.name,   // <-- add this line
  role: role,
  id: id,
};

  }

  async getAllAnnaDetails() {
    const doc = await this.annaConnection.collection('user').findOne({});
    if (!doc) {
      throw new Error('No Anna University data found.');
    }
    return doc;
  }

  async verifyCodeWithInput(role: string, id: string, code: string) {
    const record = await this.universityConnection.collection('verifications').findOne({ role, id, code });
    if (!record) throw new Error('Invalid verification code.');
    if (new Date(record.expiresAt) < new Date()) throw new Error('Verification code expired.');
    return { message: 'Code valid' };
  }

  // Modify the login method to create rate limits
  async login(role: string, id: string, password: string) {
    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");
    const doc = await this.universityConnection.collection('user').findOne({ _id: universityObjectId });
    if (!doc) throw new Error("University data not found.");

    // Search all roles for the ID
    let foundUser: any = null;
    let foundRole: string | null = null;

    if (doc.admin_id === id) {
      foundUser = doc;
      foundRole = "admin";
    } else {
      const roleArrays = [
        { array: "students", idField: "student_id" },
        { array: "faculty", idField: "faculty_id" },
        { array: "scholars", idField: "scholar_id" },
        { array: "officials", idField: "official_id" },
      ];
      for (const { array, idField } of roleArrays) {
        const user = (doc[array] || []).find((u: any) => u[idField] === id);
        if (user) {
          foundUser = user;
          foundRole = array.slice(0, -1); // "students" -> "student"
          break;
        }
      }
    }

    if (!foundUser) {
      throw new Error("Account not found for the given ID.");
    }

    if (foundRole !== role) {
      throw new Error("Role mismatch: The ID exists, but not under the selected role.");
    }

    const valid = await bcrypt.compare(password, foundUser.password);
    if (!valid) throw new Error("Incorrect password.");

    // Create/update rate limits for user
    await this.adminService.createUserRateLimit(role, id, foundUser.name);

    return { message: "Login successful.", user: { ...foundUser, password: undefined } };
  }

  // Send reset code (max 3 per day)
  async sendResetCode(role: string, id: string) {
    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");
    let arrayField = "";
    let idField = "";
    if (role === "student") { arrayField = "students"; idField = "student_id"; }
    else if (role === "faculty") { arrayField = "faculty"; idField = "faculty_id"; }
    else if (role === "scholar") { arrayField = "scholars"; idField = "scholar_id"; }
    else if (role === "official") { arrayField = "officials"; idField = "official_id"; }
    else if (role === "admin") { arrayField = "admin_id"; idField = "admin_id"; }
    else throw new Error("Invalid role.");

    const doc = await this.universityConnection.collection('user').findOne({ _id: universityObjectId });
    if (!doc) throw new Error("University data not found.");

    let user: any = null;
    if (role === "admin") {
      if (doc.admin_id === id) user = doc;
    } else {
      user = (doc[arrayField] || []).find((u: any) => u[idField] === id);
    }
    if (!user) throw new Error("Account not found. Please sign up first.");

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
      user.email,
      'Your Password Reset Code',
      `<p>Hello ${user.name || ''},</p>
       <p>Your password reset code is: <b>${code}</b></p>
       <p>This code is valid for 5 minutes. You can request a new code up to 3 times per day.</p>`
    );

    return {
      message: 'Reset code sent successfully.',
      email: user.email,
      name: user.name,
      resendCount: resendCount + 1,
    };
  }

  // Verify reset code
  async verifyResetCode(role: string, id: string, code: string) {
    const record = await this.universityConnection.collection('reset_verifications').findOne({ role, id, code });
    if (!record) throw new Error('Invalid or expired reset code.');
    if (new Date(record.expiresAt) < new Date()) throw new Error('Reset code expired.');
    return { message: 'Code valid' };
  }

  // Update password after code verification
  async resetPassword(role: string, id: string, code: string, password: string) {
    // Verify code first
    await this.verifyResetCode(role, id, code);

    const hashed = await bcrypt.hash(password, 10);

    const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");
    let arrayField = "";
    let idField = "";
    if (role === "student") { arrayField = "students"; idField = "student_id"; }
    else if (role === "faculty") { arrayField = "faculty"; idField = "faculty_id"; }
    else if (role === "scholar") { arrayField = "scholars"; idField = "scholar_id"; }
    else if (role === "official") { arrayField = "officials"; idField = "official_id"; }
    else if (role === "admin") { arrayField = "admin_id"; idField = "admin_id"; }
    else throw new Error("Invalid role.");

    // Update password in the correct array
    if (role === "admin") {
      await this.universityConnection.collection('user').updateOne(
        { _id: universityObjectId, admin_id: id },
        { $set: { password: hashed } }
      );
    } else {
      await this.universityConnection.collection('user').updateOne(
        { _id: universityObjectId, [`${arrayField}.${idField}`]: id },
        { $set: { [`${arrayField}.$.password`]: hashed } }
      );
    }

    // Remove reset verification record
    await this.universityConnection.collection('reset_verifications').deleteOne({ role, id });

    return { message: 'Password reset successful.' };
  }

  async incrementGuestVisit(guestType: "visitor" | "university") {
  const universityObjectId = new ObjectId("68d3d10671bbe5af3a79a45b");
  const visitField = guestType === "visitor" ? "visit.visitor" : "visit.university_member";

  // Get current value as string, parse to int, increment, and store as string
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

  // Update the field as string
  await this.universityConnection.collection('user').updateOne(
    { _id: universityObjectId },
    { $set: { [visitField]: String(newCount) } },
    { upsert: true }
  );

  return { count: newCount };
}

}