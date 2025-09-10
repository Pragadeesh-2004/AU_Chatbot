// dto/update-rate-limit.dto.ts

import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRateLimitDto } from './create-rate-limit.dto';
import {
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateAssistantLimitDto } from './update-assistant-limit.dto';

export class UpdateRateLimitDto extends PartialType(
  OmitType(CreateRateLimitDto, ['assistants'] as const)
) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAssistantLimitDto)
  assistants?: UpdateAssistantLimitDto[];
}
