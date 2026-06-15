import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApplyReferralDto } from './dto/apply-referral.dto';
import { Request } from 'express';

@Controller('referrals')
@UseGuards(AuthGuard)
export class ReferralsController {
  constructor(private readonly service: ReferralsService) {}

  @Get()
  getReferralInfo(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getReferralInfo(userId);
  }

  @Post('apply')
  applyReferral(@Req() req: Request, @Body() dto: ApplyReferralDto) {
    const userId = (req as any).user.id;
    return this.service.applyReferral(userId, dto);
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.service.getLeaderboard();
  }
}
