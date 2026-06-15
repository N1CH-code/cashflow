import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateLoanDto {
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
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseFloat(value) : value;
  })
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseInt(value, 10) : value;
  })
  termMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseFloat(value) : value;
  })
  monthlyPayment?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseFloat(value) : value;
  })
  paidAmount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
