import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBudgetDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseFloat(value) : value;
  })
  amount: number;

  @IsOptional()
  @IsString()
  period?: string;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseInt(value, 10) : value;
  })
  month: number;

  @IsNumber()
  @Min(2000)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseInt(value, 10) : value;
  })
  year: number;
}
