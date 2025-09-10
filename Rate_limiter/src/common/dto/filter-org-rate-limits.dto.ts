import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

export class FilterOrgRateLimitsDto extends PaginationDto {
  // Input Token Filters
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_input_token?: number; // Exact match

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_input_token_min?: number; // Minimum value

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_input_token_max?: number; // Maximum value

  // Output Token Filters
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_output_token?: number; // Exact match

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_output_token_min?: number; // Minimum value

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_output_token_max?: number; // Maximum value
}