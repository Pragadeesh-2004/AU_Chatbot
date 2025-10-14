import { IsEnum, IsString } from 'class-validator';

export class DeleteUserDto {
  @IsEnum(["student", "faculty", "scholar", "official"])
  role: "student" | "faculty" | "scholar" | "official";

  @IsString()
  id: string;
}
