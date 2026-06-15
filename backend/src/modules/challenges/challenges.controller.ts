import { Controller, Get, Post, UseGuards, Req, Body, Param } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('challenges')
@UseGuards(AuthGuard)
export class ChallengesController {
  constructor(private readonly service: ChallengesService) {}

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.findAll(userId);
  }

  @Get('active')
  getActive(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getActive(userId);
  }

  @Post(':id/join')
  join(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.service.joinChallenge(userId, id);
  }

  @Post('seed')
  seed(@Req() req: Request) {
    return this.service.seedChallenges();
  }
}
