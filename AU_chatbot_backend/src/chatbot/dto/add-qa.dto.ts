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
  timestamp?: string;

  @IsOptional()
  @IsArray()
  files?: Array<{
    name: string;
    size: number;
    type: string;
    buffer?: Buffer; // ✅ File buffer from FormData
    data?: string; // ✅ Base64 encoded content (legacy)
  }>; // File metadata

  @IsOptional()
  @IsString()
  collegeName?: string; // ✅ Add this field
}
