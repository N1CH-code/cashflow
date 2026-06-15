import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLoanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseFloat(value) : value;
  })
  totalAmount: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseFloat(value) : value;
  })
  interestRate: number;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseInt(value, 10) : value;
  })
  termMonths: number;

  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseFloat(value) : value;
  })
  monthlyPayment: number;

  @IsDateString()
  startDate: string;
}
