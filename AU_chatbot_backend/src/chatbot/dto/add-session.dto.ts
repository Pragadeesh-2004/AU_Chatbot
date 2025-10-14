import { IsEnum, IsString } from 'class-validator';

export class AddSessionDto {
  @IsEnum(["student", "faculty", "scholar", "official"])
  role: "student" | "faculty" | "scholar" | "official";

  @IsString()
  id: string;

  @IsString()
  session_name: string;
}
