import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        // read token from cookie named 'jwt'
        if (!req || !req.cookies) return null;
        return req.cookies['jwt'] ?? null;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change_this_secret',
    });
  }

  async validate(payload: any) {
    // payload should contain { sub: userId, role, name }
    return { id: payload.sub, role: payload.role, name: payload.name };
  }
}