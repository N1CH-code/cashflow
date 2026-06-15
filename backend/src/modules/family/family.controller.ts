import { Controller, Get, Post, Patch, Delete, UseGuards, Req, Body, Param } from '@nestjs/common';
import { FamilyService } from './family.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('family')
@UseGuards(AuthGuard)
export class FamilyController {
  constructor(private readonly service: FamilyService) {}

  @Get()
  getMyFamily(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getMyFamily(userId);
  }

  @Post('create')
  create(@Req() req: Request, @Body() body: { name: string }) {
    const userId = (req as any).user.id;
    return this.service.create(userId, body.name);
  }

  @Post('join')
  join(@Req() req: Request, @Body() body: { inviteCode: string }) {
    const userId = (req as any).user.id;
    return this.service.join(userId, body.inviteCode);
  }

  @Get('members')
  getMembers(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getMembers(userId);
  }

  @Patch('members/:memberId/role')
  updateRole(
    @Req() req: Request,
    @Param('memberId') memberId: string,
    @Body() body: { role: string },
  ) {
    const userId = (req as any).user.id;
    return this.service.updateMemberRole(userId, memberId, body.role);
  }

  @Delete('members/:memberId')
  removeMember(@Req() req: Request, @Param('memberId') memberId: string) {
    const userId = (req as any).user.id;
    return this.service.removeMember(userId, memberId);
  }

  @Delete('leave')
  leave(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.leave(userId);
  }

  @Get('goals')
  getFamilyGoals(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getFamilyGoals(userId);
  }

  @Get('transactions')
  getFamilyTransactions(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getFamilyTransactions(userId);
  }

  @Get('stats')
  getFamilyStats(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getFamilyStats(userId);
  }
}
