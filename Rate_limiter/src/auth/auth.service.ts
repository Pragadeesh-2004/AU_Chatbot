import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async validateUserAndLogin(body: { name: string; email: string; password: string }) {
    const user = await this.userModel.findOne({ name: body.name, email: body.email });
    if (!user) throw new UnauthorizedException('User not found');

    // ✅ Simple plaintext password check
    if (body.password !== user.password) {
      throw new UnauthorizedException('Invalid password');
    }

    // ✅ JWT payload
    const payload = {
      sub: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organisationId: user['organisation_id'] || null
    };

    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      organisationId: user['organisation_id'] || null
    };
  }
}
