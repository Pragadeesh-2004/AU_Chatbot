/*import {
  IsInt,
  IsString,
  IsNotEmpty,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrganisationDto } from './create-organisation.dto';

export class CreateSuperAdminDto {
  @IsInt({ message: '_id must be an integer' })
  _id!: number;

  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'name must only contain letters and spaces',
  })
  name!: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOrganisationDto)
  organizations!: CreateOrganisationDto[];
}
*/