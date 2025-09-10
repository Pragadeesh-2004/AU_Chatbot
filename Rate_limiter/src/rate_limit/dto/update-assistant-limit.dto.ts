import { IsOptional, IsNumber, IsString, IsMongoId } from 'class-validator';

export class UpdateAssistantLimitDto {
  @IsOptional()
  @IsString()
  @IsMongoId()
  assistant_id?: string; // ✅ Simple string instead of { $oid: string }

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