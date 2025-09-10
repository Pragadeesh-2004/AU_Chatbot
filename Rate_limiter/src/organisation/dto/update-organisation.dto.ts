import {
  IsString,
  IsOptional,
  IsIn,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganisationDto } from './create-organisation.dto';

export class UpdateOrganisationDto extends PartialType(CreateOrganisationDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['central', 'state'])
  level?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}
