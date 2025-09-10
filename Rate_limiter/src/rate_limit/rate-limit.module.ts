import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RateLimitService } from './rate-limit.service';
import { RateLimitController } from './rate-limit.controller';
import { RateLimit, RateLimitSchema } from 'src/rate_limit/schemas/rate_limits.schema';
import { OrganisationSchema } from 'src/organisation/schema/organisation.schema';
import { AssistantSchema } from 'src/assistants/schema/assistants.schema';
import { RateLimitLogSchema } from './schemas/rate_limit_logs.schema';

import { OrganisationModule } from 'src/organisation/organisation.module'; 
import { AssistantsModule } from 'src/assistants/assistants.module';        
import { PaginationService } from '../common/services/pagination.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RateLimit.name, schema: RateLimitSchema },
      { name: 'Organisation', schema: OrganisationSchema },
      { name: 'Assistant', schema: AssistantSchema },
      { name: 'ratelimit_logs', schema: RateLimitLogSchema },
    ]),
    OrganisationModule, 
    AssistantsModule    
  ],
  controllers: [RateLimitController],
  providers: [RateLimitService, PaginationService], 
  exports: [
    RateLimitService,
    MongooseModule
  ],
})
export class RateLimitModule {}
