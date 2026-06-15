import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { AddFundsDto } from './dto/add-funds.dto';
import { Request } from 'express';

@Controller('goals')
@UseGuards(AuthGuard)
export class GoalsController {
  constructor(private readonly service: GoalsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateGoalDto) {
    const userId = (req as any).user.id;
    return this.service.create(userId, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.findAll(userId);
  }

  @Get('suggestions')
  getSuggestions(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getSuggestions(userId);
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
    @Body() dto: UpdateGoalDto,
  ) {
    const userId = (req as any).user.id;
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.service.remove(userId, id);
  }

  @Post(':id/add-funds')
  addFunds(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddFundsDto,
  ) {
    const userId = (req as any).user.id;
    return this.service.addFunds(userId, id, dto);
  }
}
