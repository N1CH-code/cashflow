import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Request } from 'express';

@Controller('budget')
@UseGuards(AuthGuard)
export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  @Get('overview')
  getOverview(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getOverview(userId);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateBudgetDto) {
    const userId = (req as any).user.id;
    return this.service.create(userId, dto);
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const userId = (req as any).user.id;
    return this.service.findAll(
      userId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.service.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    const userId = (req as any).user.id;
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.service.remove(userId, id);
  }
}
