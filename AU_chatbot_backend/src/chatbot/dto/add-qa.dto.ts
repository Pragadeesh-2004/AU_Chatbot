import { IsString } from 'class-validator';

export class AddQADto {
  @IsString()
  role: "student" | "faculty" | "scholar" | "official";

  @IsString()
  id: string;

  @IsString()
  session_id: string;

  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsString()
  timestamp: string;
}
