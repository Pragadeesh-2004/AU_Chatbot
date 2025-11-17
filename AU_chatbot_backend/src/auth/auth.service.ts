import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signToken(payload: { sub: string; role: string; name?: string }) {
    const token = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
    return token;
  }
}