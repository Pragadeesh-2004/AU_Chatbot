import { IsString, IsOptional, IsArray } from "class-validator";

export class AddQADto {
  @IsString()
  role: string;

  @IsString()
  id: string;

  @IsString()
  session_id: string;

  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  session_name?: string;

  @IsOptional()
  @IsArray()
  files?: Array<{ name: string; size: number; type: string }>; // File metadata
}
