import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';
import { ChatDto } from './dto/ai-chat.dto';
import { AnalyzeTextDto, LoanAdviceDto } from './dto/ai-analysis.dto';
import { Request } from 'express';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  chat(@Req() req: Request, @Body() dto: ChatDto) {
    const userId = (req as any).user.id;
    return this.ai.chatWithAI(userId, dto.message);
  }

  @Post('analyze-text')
  analyzeText(@Req() req: Request, @Body() dto: AnalyzeTextDto) {
    const userId = (req as any).user.id;
    return this.ai.analyzeTransaction(userId, dto.text);
  }

  @Get('daily-advice')
  dailyAdvice(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.ai.getDailyAdvice(userId);
  }

  @Get('analysis')
  analysis(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.ai.analyzeSpendingPatterns(userId);
  }

  @Get('prediction')
  prediction(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.ai.predictMonthlyOutcome(userId);
  }

  @Get('weekly-report')
  weeklyReport(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.ai.generateWeeklyReport(userId);
  }

  @Post('loan-advice')
  loanAdvice(@Req() req: Request, @Body() dto: LoanAdviceDto) {
    const userId = (req as any).user.id;
    return this.ai.getLoanAdvice(userId, dto);
  }
}
