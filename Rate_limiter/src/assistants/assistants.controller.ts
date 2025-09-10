import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { AssistantsService } from './assistants.service';
import { CreateAssistantDto } from './dto/create-assistants.dto';
import { UpdateAssistantDto } from './dto/update-assistants.dto';

@Controller()
export class AssistantsController {
  constructor(private readonly assistantsService: AssistantsService) {}

  // ✅ GET all assistants with rate limit for a specific organisation
  @Get('organisation/:orgId/assistants')
  findByOrganisation(@Param('orgId') orgId: string) {
    return this.assistantsService.findByOrganisationWithRateLimit(orgId);
  }

  // GET specific assistant with rate limit under an organisation
  @Get('organisation/:orgId/assistants/:assistantId')
  getSpecificAssistant(
    @Param('orgId') orgId: string,
    @Param('assistantId') assistantId: string,
  ) {
    return this.assistantsService.findOneByOrganisation(orgId, assistantId);
  }


  // ✅ POST create assistant under a specific organisation
  @Post('organisation/:orgId/assistants')
  createForOrganisation(
    @Param('orgId') orgId: string,
    @Body() createDto: CreateAssistantDto,
  ) {
    return this.assistantsService.createForOrganisation(orgId, createDto);
  }

  // ✅ PATCH update assistant by ID
  @Patch('organisation/:orgId/assistants/:id')
  updateAssistant(
    @Param('id') id: string,
    @Body() updateDto: UpdateAssistantDto,
  ) {
    return this.assistantsService.update(id, updateDto);
  }

  // ✅ DELETE assistant by ID
  @Delete('organisation/:orgId/assistants/:id')
  removeAssistant(@Param('id') id: string) {
    return this.assistantsService.remove(id);
  }
}
