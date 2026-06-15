import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class AnalyzeTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class LoanAdviceDto {
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  totalAmount: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  interestRate: number;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  termMonths: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  monthlyPayment: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  remainingAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  paidAmount?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
