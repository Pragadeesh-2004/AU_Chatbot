import { IsEnum, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEnum(["student", "faculty", "scholar", "official"])
  role: "student" | "faculty" | "scholar" | "official";

  @IsString()
  id: string;

  @IsString()
  name: string;
}
