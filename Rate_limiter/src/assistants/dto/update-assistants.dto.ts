import { IsString, IsNotEmpty, IsEnum, Matches, IsMongoId, IsOptional } from 'class-validator';

export class UpdateAssistantDto {
   @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z\s]+$/, { message: 'name must only contain letters and spaces' })
  name: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status: string;

  @IsMongoId()
  org_id: string;
}
