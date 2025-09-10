import { IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAssistantLimitDto } from './create-assistant-limit.dto';

export class ReplaceRateLimitDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_input_token?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_output_token?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  file_count?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  file_size?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  knowledge_base_count?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  knowledge_base_index_size?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  active_assistant_count?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssistantLimitDto)
  assistants?: CreateAssistantLimitDto[];
}