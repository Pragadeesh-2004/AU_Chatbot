import { IsString, IsNotEmpty, IsEnum, Matches, IsMongoId } from 'class-validator';

export class CreateAssistantDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z\s]+$/, { message: 'name must only contain letters and spaces' })
  name: string;

  @IsEnum(['active', 'inactive'])
  status: string;

  @IsMongoId()
  org_id: string;
}
