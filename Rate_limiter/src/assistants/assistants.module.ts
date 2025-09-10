// assistants.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssistantsController } from './assistants.controller';
import { AssistantsService } from './assistants.service';
import { Assistant, AssistantSchema } from './schema/assistants.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assistant.name, schema: AssistantSchema }
    ])
  ],
  controllers: [AssistantsController],
  providers: [AssistantsService],
  exports: [AssistantsService, MongooseModule],
})
export class AssistantsModule {}
