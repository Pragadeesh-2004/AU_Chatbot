/*import {
  IsInt,
  IsMongoId,
  Min,
  ValidateNested,
  IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';

class TokenLimitDto {
  @Type(() => Number)
  @IsInt({ message: 'user must be an integer' })
  @Min(0, { message: 'user must be 0 or greater' })
  user!: number;

  @Type(() => Number)
  @IsInt({ message: 'assistant must be an integer' })
  @Min(0, { message: 'assistant must be 0 or greater' })
  assistant!: number;
}

export class CreateRateLimitDto {
  @IsMongoId({ message: 'org_id must be a valid MongoDB ObjectId' })
  org_id!: string;

  @IsMongoId({ message: 'assistant_id must be a valid MongoDB ObjectId' })
  assistant_id!: string;

  @ValidateNested()
  @Type(() => TokenLimitDto)
  input_token!: TokenLimitDto;

  @ValidateNested()
  @Type(() => TokenLimitDto)
  output_token!: TokenLimitDto;

  @Type(() => Number)
  @IsInt({ message: 'fileCount must be an integer' })
  @Min(0, { message: 'fileCount must be 0 or greater' })
  fileCount!: number;
}
*/