import { IsOptional, IsString } from 'class-validator';

export class ManageSubscriptionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
