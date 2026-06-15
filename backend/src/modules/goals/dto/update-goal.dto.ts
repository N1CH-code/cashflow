import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseFloat(value) : value;
  })
  targetAmount?: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
