import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcryptjs'; // Use bcryptjs for compatibility

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
    } else if (role === 'scholar') {
      user = doc.scholars.find((s: any) => s.scholar_id === id);
    } else if (role === 'official') {
      user = doc.officials.find((o: any) => o.official_id === id);
    } else if (role === 'admin') {
      if (doc.admin_id === id) user = { admin_id: id, email: doc.email, name: 'Admin' };
    }
    return user;
  }

  async signup(role: string, id: string) {
    const annaUser = await this.findAnnaUser(role, id);
    if (!annaUser) {
      throw new Error('User not found for this role and ID in Anna University records.');
    }

    // Send verification email
    const token = Buffer.from(`${role}:${id}:${Date.now()}`).toString('base64');
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/modules/authentication/verify?token=${encodeURIComponent(token)}`;
    await this.sendMail(
      annaUser.email,
      'Verify your University Account',
      `<p>Hello ${annaUser.name || ''},</p><p>Click <a href="${verifyUrl}">here</a> to verify your account and set your password.</p>`
    );

    // Return user details (for placeholder replacement in frontend)
    return {
      message: 'Verification email sent.',
      user: annaUser,
      email: annaUser.email,
      name: annaUser.name,
      department: annaUser.department,
      degree: annaUser.degree,
      branch: annaUser.branch,
      year: annaUser.year,
      designation: annaUser.designation,
    };
  }

  async sendMail(to: string, subject: string, html: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_FROM || 'noreply@university.com',
        pass: process.env.EMAIL_PASS || 'password',
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@university.com',
      to,
      subject,
      html,
    });
  }

  async verify(token: string, password: string) {
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