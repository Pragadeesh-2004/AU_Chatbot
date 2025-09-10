import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsMongoId,
  IsArray,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAssistantLimitDto } from './create-assistant-limit.dto';

export class CreateRateLimitDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  org_id: string; // ✅ Now accepts simple string instead of { $oid: string }

  @IsOptional()
  @IsNumber()
  max_input_token?: number;

  @IsOptional()
  @IsNumber()
  max_output_token?: number;

  @IsOptional()
  @IsNumber()
  file_count?: number;

  @IsOptional()
  @IsNumber()
  file_size?: number;

  @IsOptional()
  @IsNumber()
  knowledge_base_count?: number;

  @IsOptional()
  @IsNumber()
  knowledge_base_index_size?: number;

  @IsOptional()
  @IsNumber()
  active_assistant_count?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssistantLimitDto)
  assistants?: CreateAssistantLimitDto[];
}