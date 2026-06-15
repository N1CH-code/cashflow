import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('achievements')
@UseGuards(AuthGuard)
export class AchievementsController {
  constructor(private readonly service: AchievementsService) {}

  @Get()
  getAll(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getAllWithStatus(userId);
  }

  @Get('my')
  getMyAchievements(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getUserAchievements(userId);
  }

  @Post('check')
  checkAchievements(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.checkAndUnlock(userId);
  }
}
