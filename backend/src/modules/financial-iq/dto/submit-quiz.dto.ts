import { IsArray, IsNumber, ArrayMinSize, ArrayMaxSize, Min, Max } from 'class-validator';

export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(3, { each: true })
  answers: number[];
}
