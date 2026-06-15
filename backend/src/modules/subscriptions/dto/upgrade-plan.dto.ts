import { IsEnum, IsNotEmpty } from 'class-validator';

export enum UpgradePlan {
  PRO = 'PRO',
  MAX = 'MAX',
}

export class UpgradePlanDto {
  @IsEnum(UpgradePlan)
  @IsNotEmpty()
  plan: UpgradePlan;
}
