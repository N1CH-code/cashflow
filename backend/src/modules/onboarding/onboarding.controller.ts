import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { AuthGuard } from '../auth/auth.guard';
import { CompleteStepDto } from './dto/complete-step.dto';
import { Request } from 'express';

@Controller('onboarding')
@UseGuards(AuthGuard)
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Get('status')
  getStatus(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getStatus(userId);
  }

  @Post('step')
  completeStep(@Req() req: Request, @Body() dto: CompleteStepDto) {
    const userId = (req as any).user.id;
    return this.service.completeStep(userId, dto);
  }

  @Post('currency')
  setCurrency(@Req() req: Request, @Body() body: { currency: string }) {
    const userId = (req as any).user.id;
    return this.service.setCurrency(userId, body.currency);
  }

  @Post('income')
  setIncome(
    @Req() req: Request,
    @Body() body: { monthlyIncome: number; salaryDate: number },
  ) {
    const userId = (req as any).user.id;
    return this.service.setIncome(userId, body.monthlyIncome, body.salaryDate);
  }

  @Post('quiz')
  submitQuiz(
    @Req() req: Request,
    @Body() body: { answers: number[] },
  ) {
    const userId = (req as any).user.id;
    return this.service.submitFinancialTypeQuiz(userId, body.answers);
  }

  @Post('complete')
  completeOnboarding(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.completeOnboarding(userId);
  }
}
