import { IsOptional, IsNumber, Min } from 'class-validator';

export class ReplaceAssistantLimitDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  input_token_per_user?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  input_token_per_assistant?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  output_token_per_user?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  output_token_per_assistant?: number;

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
  knowledge_base_index_size?: number;
}