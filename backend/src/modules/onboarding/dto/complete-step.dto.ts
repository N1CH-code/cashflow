import {
  IsNumber,
  IsOptional,
  IsObject,
  Min,
  Max,
} from 'class-validator';

export class CompleteStepDto {
  @IsNumber()
  @Min(1)
  @Max(6)
  step: number;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
