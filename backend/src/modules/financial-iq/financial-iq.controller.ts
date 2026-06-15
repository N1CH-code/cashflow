import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FinancialIQService } from './financial-iq.service';
import { AuthGuard } from '../auth/auth.guard';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { Request } from 'express';

@Controller('financial-iq')
@UseGuards(AuthGuard)
export class FinancialIQController {
  constructor(private readonly service: FinancialIQService) {}

  @Get()
  getIQ(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getIQ(userId);
  }

  @Post('quiz')
  submitQuiz(@Req() req: Request, @Body() dto: SubmitQuizDto) {
    const userId = (req as any).user.id;
    return this.service.submitQuiz(userId, dto);
  }

  @Post('assess')
  assessBehavior(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.assessBehavior(userId);
  }
}
