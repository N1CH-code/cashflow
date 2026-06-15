import {
  Controller,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('gamification')
@UseGuards(AuthGuard)
export class GamificationController {
  constructor(private readonly service: GamificationService) {}

  @Get('profile')
  getProfile(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getProfile(userId);
  }

  @Get('levels')
  getLevels() {
    return this.service.getLevels();
  }
}
