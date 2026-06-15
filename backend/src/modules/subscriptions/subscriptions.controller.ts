import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { ManageSubscriptionDto } from './dto/manage-subscription.dto';
import { Request } from 'express';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get('plans')
  getPlans() {
    return this.service.getPlans();
  }

  @Get('my')
  @UseGuards(AuthGuard)
  getMySubscription(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getMySubscription(userId);
  }

  @Post('upgrade')
  @UseGuards(AuthGuard)
  upgradePlan(@Req() req: Request, @Body() dto: UpgradePlanDto) {
    const userId = (req as any).user.id;
    return this.service.upgradePlan(userId, dto.plan);
  }

  @Post('cancel')
  @UseGuards(AuthGuard)
  cancel(@Req() req: Request, @Body() _dto?: ManageSubscriptionDto) {
    const userId = (req as any).user.id;
    return this.service.cancel(userId);
  }

  @Post('reactivate')
  @UseGuards(AuthGuard)
  reactivate(@Req() req: Request, @Body() _dto?: ManageSubscriptionDto) {
    const userId = (req as any).user.id;
    return this.service.reactivate(userId);
  }

  @Get('features')
  @UseGuards(AuthGuard)
  getFeatures(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getFeatures(userId);
  }
}
