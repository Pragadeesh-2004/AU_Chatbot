import { IsEnum, IsString } from 'class-validator';

export class DeleteSessionDto {
  @IsEnum(["student", "faculty", "scholar", "official"])
  role: "student" | "faculty" | "scholar" | "official";

  @IsString()
  id: string;

  @IsString()
  session_id: string;
}
