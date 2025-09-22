import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  
  getApplicationInfo() {
    return {
      message: 'Welcome to Rate Limiter Application!',
      description: 'A NestJS application for managing rate limits across organizations and assistants',
      version: '1.0.0',
      status: 'Running',
      endpoints: {
        organisations: '/organisation',
        assistants: '/organisation/:orgId/assistants',
        dashboard: '/dashboard'
      },
      timestamp: new Date().toISOString()
    };
  }
}
