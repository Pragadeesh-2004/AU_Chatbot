// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OrganisationModule } from 'src/organisation/organisation.module'; 
import { AssistantsModule } from 'src/assistants/assistants.module';
import { RateLimitModule } from 'src/rate_limit/rate-limit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost/rate_limiter_db',
    ),

    OrganisationModule, 
    AssistantsModule, 
    RateLimitModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
