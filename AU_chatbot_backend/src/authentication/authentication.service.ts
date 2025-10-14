import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectConnection('anna') private annaConnection: Connection,
    @InjectConnection('university') private universityConnection: Connection,
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
    const annaUser = await this.findAnnaUser(role, id);
    if (!annaUser) {
      throw new Error('User not found. Please check your role and ID and try again.');
    }

    // Generate a 6-digit code and expiry (5 mins)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store code and expiry in a temp collection
    await this.universityConnection.collection('verifications').updateOne(
      { role, id },
      { $set: { code, expiresAt } },
      { upsert: true }
    );

    // Verification link with code as query param
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/modules/authentication/verify?role=${role}&id=${id}&code=${code}`;

    await this.sendMail(
      annaUser.email,
      'Verify your University Account',
      `<p>Hello ${annaUser.name || ''},</p>
      <p>Your verification code is: <b>${code}</b></p>
      <p>Or click <a href="${verifyUrl}">here</a> to verify your account. This code/link is valid for 5 minutes.</p>`
    );

    return {
      message: 'Verification email sent successfully.',
      email: annaUser.email,
      name: annaUser.name,
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
    console.log('Mock email sent to:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    // Email sending is mocked for now
  }

  // Complete signup (set password)
  async verify(token: string, password: string) {
    // token = base64(role:id)
    const [role, id] = Buffer.from(token, 'base64').toString().split(':');
    const annaUser = await this.findAnnaUser(role, id);
    if (!annaUser) throw new Error('User not found in Anna University records.');
    const hashed = await bcrypt.hash(password, 10);
    const userDoc = {
      ...annaUser,
      id,
      role,
      password: hashed,
      createdAt: new Date(),
    };
    await this.universityConnection.collection('user').insertOne(userDoc);
    // Remove verification record
    await this.universityConnection.collection('verifications').deleteOne({ role, id });
    return { message: 'Signup complete.' };
  }

  async getAllAnnaDetails() {
    const doc = await this.annaConnection.collection('user').findOne({});
    if (!doc) {
      throw new Error('No Anna University data found.');
    }
    return doc;
  }
}