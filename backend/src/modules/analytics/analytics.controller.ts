import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  getOverview(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getOverview(userId);
  }

  @Get('monthly-breakdown')
  getMonthlyBreakdown(
    @Req() req: Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const userId = (req as any).user.id;
    return this.service.getMonthlyBreakdown(
      userId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Get('trends')
  getTrends(
    @Req() req: Request,
    @Query('months') months?: string,
  ) {
    const userId = (req as any).user.id;
    return this.service.getTrends(
      userId,
      months ? parseInt(months, 10) : 6,
    );
  }

  @Get('income-vs-expenses')
  getIncomeVsExpenses(
    @Req() req: Request,
    @Query('months') months?: string,
  ) {
    const userId = (req as any).user.id;
    return this.service.getIncomeVsExpenses(
      userId,
      months ? parseInt(months, 10) : 6,
    );
  }

  @Get('category-comparison')
  getCategoryComparison(
    @Req() req: Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const userId = (req as any).user.id;
    return this.service.getCategoryComparison(
      userId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }
}
