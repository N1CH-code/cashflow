import {
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AddFundsDto {
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return typeof value === 'string' ? parseFloat(value) : value;
  })
  amount: number;
}
