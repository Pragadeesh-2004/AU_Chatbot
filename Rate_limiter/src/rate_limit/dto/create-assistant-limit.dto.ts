// dto/create-assistant-limit.dto.ts

import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';


export class CreateAssistantLimitDto {
  
  @IsNotEmpty()
  assistant_id: string;

  @IsOptional()
  @IsNumber()
  input_token_per_user?: number;

  @IsOptional()
  @IsNumber()
  input_token_per_assistant?: number;

  @IsOptional()
  @IsNumber()
  output_token_per_user?: number;

  @IsOptional()
  @IsNumber()
  output_token_per_assistant?: number;

  @IsOptional()
  @IsNumber()
  file_count?: number;

  @IsOptional()
  @IsNumber()
  file_size?: number;

  @IsOptional()
  @IsNumber()
  knowledge_base_index_size?: number;
}
