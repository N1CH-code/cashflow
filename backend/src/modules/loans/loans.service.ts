import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { addMonths, format } from 'date-fns';

export interface AmortizationRow {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateLoanDto) {
    const loan = await this.prisma.loan.create({
      data: {
        userId,
        name: dto.name,
        totalAmount: dto.totalAmount,
        interestRate: dto.interestRate,
        termMonths: dto.termMonths,
        monthlyPayment: dto.monthlyPayment,
        remainingAmount: dto.totalAmount,
        startDate: new Date(dto.startDate),
      },
    });

    return this.enrichLoan(loan);
  }

  async findAll(userId: string) {
    const loans = await this.prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return loans.map((l) => this.enrichLoan(l));
  }

  async findOne(userId: string, id: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    const enriched = this.enrichLoan(loan);
    const schedule = this.calculateSchedule(loan);

    return { ...enriched, schedule };
  }

  async update(userId: string, id: string, dto: UpdateLoanDto) {
    await this.findOne(userId, id);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.totalAmount !== undefined) updateData.totalAmount = dto.totalAmount;
    if (dto.interestRate !== undefined) updateData.interestRate = dto.interestRate;
    if (dto.termMonths !== undefined) updateData.termMonths = dto.termMonths;
    if (dto.monthlyPayment !== undefined) updateData.monthlyPayment = dto.monthlyPayment;
    if (dto.paidAmount !== undefined) updateData.paidAmount = dto.paidAmount;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.totalAmount !== undefined && dto.paidAmount === undefined) {
      updateData.remainingAmount = dto.totalAmount;
    } else if (dto.paidAmount !== undefined) {
      const total = dto.totalAmount ?? (await this.prisma.loan.findUnique({ where: { id } }))?.totalAmount ?? 0;
      updateData.remainingAmount = Math.max(0, total - dto.paidAmount);
    }

    const loan = await this.prisma.loan.update({
      where: { id },
      data: updateData,
    });

    return this.enrichLoan(loan);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.loan.delete({ where: { id } });
    return { id };
  }

  async getSchedule(userId: string, id: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return this.calculateSchedule(loan);
  }

  async getEarlyPayoff(userId: string, id: string, extraPerMonth?: number) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    const defaultExtra = extraPerMonth ?? 50;
    const originalSchedule = this.calculateSchedule(loan);
    const originalTotalInterest = originalSchedule.reduce((s, r) => s + r.interest, 0);
    const originalMonths = originalSchedule.length;

    const remainingBalance = loan.remainingAmount;
    const monthlyRate = (loan.interestRate / 100) / 12;

    let balance = remainingBalance;
    let months = 0;
    const newSchedule: AmortizationRow[] = [];
    const startDate = new Date(loan.startDate);

    while (balance > 0.001 && months < 600) {
      months++;
      const interest = balance * monthlyRate;
      let payment = (loan.monthlyPayment + defaultExtra);
      let principal = payment - interest;

      if (principal <= 0) {
        return {
          loanId: id,
          loanName: loan.name,
          error: 'Extra payment is insufficient to cover the monthly interest. Increase the extra amount.',
        };
      }

      if (principal > balance) {
        principal = balance;
        payment = principal + interest;
      }

      balance -= principal;
      if (balance < 0) balance = 0;

      newSchedule.push({
        month: months,
        date: format(addMonths(startDate, months), 'yyyy-MM-dd'),
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      });
    }

    const newTotalInterest = newSchedule.reduce((s, r) => s + r.interest, 0);
    const interestSaved = Math.max(0, originalTotalInterest - newTotalInterest);
    const monthsEarly = Math.max(0, originalMonths - months);

    return {
      loanId: id,
      loanName: loan.name,
      currentRemaining: remainingBalance,
      original: {
        months: originalMonths,
        totalInterest: Math.round(originalTotalInterest * 100) / 100,
        totalPaid: Math.round((originalTotalInterest + loan.totalAmount) * 100) / 100,
      },
      earlyPayoff: {
        extraPerMonth: defaultExtra,
        months,
        totalInterest: Math.round(newTotalInterest * 100) / 100,
        totalPaid: Math.round((newTotalInterest + loan.totalAmount) * 100) / 100,
        monthsSaved: monthsEarly,
        interestSaved: Math.round(interestSaved * 100) / 100,
        paysOffBy: format(addMonths(startDate, months), 'yyyy-MM-dd'),
      },
      schedule: newSchedule,
    };
  }

  private calculateSchedule(loan: {
    totalAmount: number;
    interestRate: number;
    termMonths: number;
    monthlyPayment: number;
    remainingAmount: number;
    startDate: Date;
    paidAmount: number;
  }): AmortizationRow[] {
    const schedule: AmortizationRow[] = [];
    const monthlyRate = (loan.interestRate / 100) / 12;
    let balance = loan.remainingAmount;
    const startDate = new Date(loan.startDate);

    let monthsToShow = loan.termMonths;

    for (let month = 1; month <= monthsToShow; month++) {
      if (balance <= 0.001) break;

      const interest = balance * monthlyRate;
      let principal = loan.monthlyPayment - interest;

      if (principal <= 0) break;

      if (principal > balance) {
        principal = balance;
      }

      balance -= principal;
      if (balance < 0) balance = 0;

      schedule.push({
        month,
        date: format(addMonths(startDate, month), 'yyyy-MM-dd'),
        payment: Math.round((principal + interest) * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      });
    }

    return schedule;
  }

  private enrichLoan(loan: any) {
    const totalInterest = this.calculateTotalInterest(loan);
    const progress = loan.totalAmount > 0
      ? Math.min(100, Math.round((loan.paidAmount / loan.totalAmount) * 10000) / 100)
      : 0;

    return {
      ...loan,
      progress,
      totalInterest: Math.round(totalInterest * 100) / 100,
      remainingInterest: Math.round(this.calculateRemainingInterest(loan) * 100) / 100,
    };
  }

  private calculateTotalInterest(loan: {
    totalAmount: number;
    interestRate: number;
    termMonths: number;
    monthlyPayment: number;
  }): number {
    const monthlyRate = (loan.interestRate / 100) / 12;
    let balance = loan.totalAmount;
    let totalInterest = 0;

    for (let month = 0; month < loan.termMonths; month++) {
      if (balance <= 0.001) break;
      const interest = balance * monthlyRate;
      let principal = loan.monthlyPayment - interest;
      if (principal <= 0) break;
      if (principal > balance) principal = balance;
      balance -= principal;
      totalInterest += interest;
    }

    return totalInterest;
  }

  private calculateRemainingInterest(loan: {
    remainingAmount: number;
    interestRate: number;
    termMonths: number;
    monthlyPayment: number;
  }): number {
    const monthlyRate = (loan.interestRate / 100) / 12;
    let balance = loan.remainingAmount;
    let totalInterest = 0;

    for (let month = 0; month < loan.termMonths; month++) {
      if (balance <= 0.001) break;
      const interest = balance * monthlyRate;
      let principal = loan.monthlyPayment - interest;
      if (principal <= 0) break;
      if (principal > balance) principal = balance;
      balance -= principal;
      totalInterest += interest;
    }

    return totalInterest;
  }
}
