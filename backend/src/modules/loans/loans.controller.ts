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
import { LoansService } from './loans.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Request } from 'express';

@Controller('loans')
@UseGuards(AuthGuard)
export class LoansController {
  constructor(private readonly service: LoansService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateLoanDto) {
    const userId = (req as any).user.id;
    return this.service.create(userId, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.findAll(userId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.service.findOne(userId, id);
  }

  @Get(':id/schedule')
  getSchedule(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.service.getSchedule(userId, id);
  }

  @Get(':id/early-payoff')
  getEarlyPayoff(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('extraPerMonth') extraPerMonth?: string,
  ) {
    const userId = (req as any).user.id;
    const extra = extraPerMonth ? parseFloat(extraPerMonth) : undefined;
    return this.service.getEarlyPayoff(userId, id, extra);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateLoanDto,
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
