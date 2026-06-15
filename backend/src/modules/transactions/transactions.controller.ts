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
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { Request } from 'express';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateTransactionDto) {
    const userId = (req as any).user.id;
    return this.service.create(userId, dto);
  }

  @Get()
  findAll(@Req() req: Request, @Query() query: QueryTransactionDto) {
    const userId = (req as any).user.id;
    return this.service.findAll(userId, query);
  }

  @Get('stats')
  getStats(
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = (req as any).user.id;
    return this.service.getStats(userId, startDate, endDate);
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
    @Body() dto: UpdateTransactionDto,
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
