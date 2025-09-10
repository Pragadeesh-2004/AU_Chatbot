/*import { IsString, IsNotEmpty, IsEnum, IsOptional, Matches } from 'class-validator';

export class CreateOrganisationDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'name must only contain letters and spaces',
  })
  name!: string;

  @IsEnum(['central', 'state'], { message: 'level must be either central or state' })
  level!: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'pending'], { message: 'status must be active, inactive, or pending' })
  status?: string;
}
*/