import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req as any).user.id;
    return this.service.findAll(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getUnreadCount(userId);
  }

  @Patch(':id/read')
  markAsRead(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.service.markAsRead(userId, id);
  }

  @Post('read-all')
  markAllAsRead(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.markAllAsRead(userId);
  }
}
