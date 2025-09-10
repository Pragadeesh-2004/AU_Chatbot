import {
  IsString,
  IsNotEmpty,
  IsIn,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['central', 'state'])
  level: string;

  @IsString()
  @IsIn(['active', 'inactive'])
  status: string;

}
