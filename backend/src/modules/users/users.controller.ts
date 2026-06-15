import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me')
  getProfile(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getProfile(userId);
  }

  @Patch('me')
  updateProfile(@Req() req: Request, @Body() dto: UpdateUserDto) {
    const userId = (req as any).user.id;
    return this.service.updateProfile(userId, dto);
  }

  @Get('me/stats')
  getStats(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getStats(userId);
  }

  @Get('me/dashboard')
  getDashboard(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getDashboard(userId);
  }
}
