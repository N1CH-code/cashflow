import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';
import OpenAI from 'openai';
import { subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, differenceInDays } from 'date-fns';

const FREE_DAILY_LIMIT = 5;

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  private async getUserContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });
    return user!;
  }

  private getLanguage(user: any): string {
    return user?.settings?.language || user?.languageCode || 'en';
  }

  private systemPrompt(lang: string): string {
    const isEn = lang === 'en';
    return isEn
      ? `You are CashFlow AI — a friendly, data-driven personal financial advisor. You have access to the user's transaction history, budgets, goals, and financial profile. Your answers must be concise (max 3 paragraphs), helpful, and based on real data. You provide actionable financial tips, spending insights, and savings strategies. You never invent numbers — if you don't have data, say so. Be encouraging and non-judgmental.`
      : `Ты CashFlow AI — дружелюбный, основанный на данных персональный финансовый советник. У тебя есть доступ к истории транзакций пользователя, бюджетам, целям и финансовому профилю. Твои ответы должны быть краткими (макс 3 абзаца), полезными и основанными на реальных данных. Ты даёшь практические финансовые советы, анализируешь расходы и предлагаешь стратегии накопления. Никогда не выдумывай цифры — если данных нет, так и скажи. Будь поддерживающим и без осуждения.`;
  }

  private async checkAiLimit(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user || user.plan === 'FREE') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const count = await this.prisma.aIReport.count({
        where: {
          userId,
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (count >= FREE_DAILY_LIMIT) {
        throw new ForbiddenException(
          'You have reached your daily AI query limit. Upgrade your plan to remove this limit.',
        );
      }
    }
  }

  private async storeReport(
    userId: string,
    type: string,
    content: any,
    recommendations?: any,
  ) {
    return this.prisma.aIReport.create({
      data: {
        userId,
        type,
        content,
        recommendations: recommendations ?? undefined,
      },
    });
  }

  private async getRecentTransactions(userId: string, days = 30) {
    const since = subDays(new Date(), days);
    return this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: since },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  private async getLastWeekTransactions(userId: string) {
    const weekAgo = subDays(new Date(), 7);
    return this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: weekAgo },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  private async fetchBudgets(userId: string) {
    const now = new Date();
    return this.prisma.budget.findMany({
      where: {
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
      include: { category: true },
    });
  }

  private async fetchGoals(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
    });
  }

  private async fetchLoans(userId: string) {
    return this.prisma.loan.findMany({
      where: { userId, isActive: true },
    });
  }

  private buildFinancialSummary(transactions: any[], budgets: any[], goals: any[], loans: any[], user: any, lang: string): string {
    const income = transactions.filter((t: any) => t.type === 'INCOME').reduce((s: number, t: any) => s + t.amount, 0);
    const expense = transactions.filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + t.amount, 0);
    const balance = income - expense;

    const byCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'EXPENSE') {
        const name = t.category?.name || 'Uncategorized';
        byCategory[name] = (byCategory[name] || 0) + t.amount;
      }
    }
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amt]) => `${cat}: ${amt.toFixed(2)}`);

    const isEn = lang === 'en';
    const lines: string[] = [];

    lines.push(isEn
      ? `User profile: Plan=${user.plan}, Currency=${user.currency}, Monthly Income=${user.monthlyIncome ?? 'unknown'}, Language=${lang}`
      : `Профиль пользователя: План=${user.plan}, Валюта=${user.currency}, Месячный доход=${user.monthlyIncome ?? 'неизвестно'}, Язык=${lang}`);

    lines.push('');
    lines.push(isEn
      ? `Last ${transactions.length} transactions summary (recent period):`
      : `Сводка по ${transactions.length} транзакциям (за последний период):`);
    lines.push(isEn
      ? `Total Income: ${income.toFixed(2)} ${user.currency}`
      : `Всего доходов: ${income.toFixed(2)} ${user.currency}`);
    lines.push(isEn
      ? `Total Expense: ${expense.toFixed(2)} ${user.currency}`
      : `Всего расходов: ${expense.toFixed(2)} ${user.currency}`);
    lines.push(isEn
      ? `Net Balance: ${balance.toFixed(2)} ${user.currency}`
      : `Чистый баланс: ${balance.toFixed(2)} ${user.currency}`);

    if (topCategories.length > 0) {
      lines.push('');
      lines.push(isEn ? 'Top spending categories:' : 'Основные категории расходов:');
      topCategories.forEach((c) => lines.push(`  - ${c} ${user.currency}`));
    }

    if (budgets.length > 0) {
      lines.push('');
      lines.push(isEn ? 'Budgets:' : 'Бюджеты:');
      for (const b of budgets) {
        const pct = b.amount > 0 ? ((b.spent / b.amount) * 100).toFixed(1) : '0';
        const name = b.category?.name || 'General';
        lines.push(`  ${name}: ${b.spent.toFixed(2)} / ${b.amount.toFixed(2)} (${pct}%)`);
      }
    }

    if (goals.length > 0) {
      lines.push('');
      lines.push(isEn ? 'Active goals:' : 'Активные цели:');
      for (const g of goals) {
        const pct = g.targetAmount > 0 ? ((g.savedAmount / g.targetAmount) * 100).toFixed(1) : '0';
        lines.push(`  ${g.name}: ${g.savedAmount.toFixed(2)} / ${g.targetAmount.toFixed(2)} (${pct}%)`);
      }
    }

    if (loans.length > 0) {
      lines.push('');
      lines.push(isEn ? 'Active loans:' : 'Активные кредиты:');
      for (const l of loans) {
        lines.push(`  ${l.name}: ${l.remainingAmount.toFixed(2)} / ${l.totalAmount.toFixed(2)} remaining (${l.interestRate}% APR)`);
      }
    }

    return lines.join('\n');
  }

  async getDailyAdvice(userId: string) {
    await this.checkAiLimit(userId);
    const user = await this.getUserContext(userId);
    const lang = this.getLanguage(user);
    const transactions = await this.getRecentTransactions(userId, 7);
    const budgets = await this.fetchBudgets(userId);
    const goals = await this.fetchGoals(userId);
    const loans = await this.fetchLoans(userId);

    const summary = this.buildFinancialSummary(transactions, budgets, goals, loans, user, lang);

    const isEn = lang === 'en';
    const prompt = isEn
      ? `Based on the user's recent financial data, give ONE specific, actionable financial tip for today. Keep it short and practical.\n\n${summary}`
      : `На основе последних финансовых данных пользователя дай ОДИН конкретный, применимый финансовый совет на сегодня. Держи его коротким и практичным.\n\n${summary}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.systemPrompt(lang) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const advice = response.choices[0]?.message?.content || (isEn ? 'No advice available.' : 'Нет доступных советов.');
    await this.storeReport(userId, 'daily_advice', { advice });

    return { advice, date: new Date().toISOString() };
  }

  async analyzeSpendingPatterns(userId: string) {
    await this.checkAiLimit(userId);
    const user = await this.getUserContext(userId);
    const lang = this.getLanguage(user);
    const transactions = await this.getRecentTransactions(userId, 30);
    const budgets = await this.fetchBudgets(userId);
    const goals = await this.fetchGoals(userId);
    const loans = await this.fetchLoans(userId);

    if (transactions.length === 0) {
      return {
        insights: lang === 'en'
          ? 'Not enough transaction data to analyze patterns. Start tracking your expenses!'
          : 'Недостаточно данных для анализа. Начните отслеживать расходы!',
        patterns: [],
        recommendations: [],
      };
    }

    const summary = this.buildFinancialSummary(transactions, budgets, goals, loans, user, lang);

    const isEn = lang === 'en';
    const prompt = isEn
      ? `Analyze the user's financial data for the last 30 days. Identify:
1. Spending patterns and trends
2. Potential impulse purchases
3. Recurring charges or subscriptions they might have forgotten
4. Categories where they are overspending
5. Specific actionable recommendations to save money

Format the response as JSON with keys: "patterns" (array of string findings), "impulsePurchases" (array of suspected impulse transactions with amounts), "recurringCharges" (array of suspected recurring items), "overspendCategories" (array of {category, budget, spent, diff}), "recommendations" (array of string tips).

User data:\n${summary}`
      : `Проанализируй финансовые данные пользователя за последние 30 дней. Определи:
1. Паттерны и тренды расходов
2. Возможные импульсивные покупки
3. Регулярные платежи или подписки, о которых могли забыть
4. Категории, где тратят слишком много
5. Конкретные рекомендации по экономии

Форматируй ответ как JSON с ключами: "patterns" (массив строк-находок), "impulsePurchases" (массив подозрительных импульсивных покупок с суммами), "recurringCharges" (массив подозрительных регулярных платежей), "overspendCategories" (массив {category, budget, spent, diff}), "recommendations" (массив строк-советов).

Данные пользователя:\n${summary}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.systemPrompt(lang) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    let parsed: any;
    try {
      parsed = JSON.parse(content || '{}');
    } catch {
      parsed = { patterns: [content], impulsePurchases: [], recurringCharges: [], overspendCategories: [], recommendations: [] };
    }

    await this.storeReport(userId, 'spending_analysis', parsed);
    return parsed;
  }

  async predictMonthlyOutcome(userId: string) {
    await this.checkAiLimit(userId);
    const user = await this.getUserContext(userId);
    const lang = this.getLanguage(user);
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = monthEnd.getDate();
    const dayOfMonth = now.getDate();
    const daysLeft = daysInMonth - dayOfMonth;

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: monthStart, lte: monthEnd },
      },
      include: { category: true },
    });

    const totalIncome = transactions.filter((t: any) => t.type === 'INCOME').reduce((s: number, t: any) => s + t.amount, 0);
    const totalExpense = transactions.filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + t.amount, 0);

    const dailyRate = dayOfMonth > 0 ? totalExpense / dayOfMonth : 0;
    const projectedExpense = totalExpense + dailyRate * daysLeft;

    const monthlyIncome = user.monthlyIncome ?? totalIncome;
    const projectedBalance = monthlyIncome - projectedExpense;

    const budget = await this.fetchBudgets(userId);
    const totalBudgeted = budget.reduce((s: number, b: any) => s + b.amount, 0);

    const prediction: any = {
      month: format(now, 'yyyy-MM'),
      currentDay: dayOfMonth,
      daysInMonth,
      daysLeft,
      incomeSoFar: Math.round(totalIncome * 100) / 100,
      expensesSoFar: Math.round(totalExpense * 100) / 100,
      dailyAverageSpend: Math.round(dailyRate * 100) / 100,
      projectedMonthlyExpense: Math.round(projectedExpense * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      projectedEndBalance: Math.round(projectedBalance * 100) / 100,
    };

    prediction.willRunOut = projectedBalance < 0;
    if (prediction.willRunOut && dailyRate > 0) {
      const runOutDay = Math.ceil(totalExpense / dailyRate);
      prediction.runsOutOnDay = runOutDay > daysInMonth ? daysInMonth : runOutDay;
      const runOutDate = new Date(now.getFullYear(), now.getMonth(), prediction.runsOutOnDay);
      prediction.runsOutDate = format(runOutDate, 'yyyy-MM-dd');
    }

    if (totalBudgeted > 0) {
      prediction.totalBudgeted = Math.round(totalBudgeted * 100) / 100;
      prediction.budgetRemaining = Math.round(Math.max(0, totalBudgeted - totalExpense) * 100) / 100;
      prediction.budgetUtilizationPercent = Math.round((totalExpense / totalBudgeted) * 100 * 10) / 10;
    }

    const isEn = lang === 'en';
    const prompt = isEn
      ? `Given the user's current spending trajectory, provide a short encouraging assessment of their financial outlook for this month. Budget remaining: ${prediction.budgetRemaining ?? 'N/A'} ${user.currency}. Projected end balance: ${prediction.projectedEndBalance} ${user.currency}. Days left: ${daysLeft}.`
      : `Учитывая текущую траекторию расходов пользователя, дай краткую обнадёживающую оценку финансового прогноза на этот месяц. Остаток бюджета: ${prediction.budgetRemaining ?? 'N/A'} ${user.currency}. Прогнозируемый остаток: ${prediction.projectedEndBalance} ${user.currency}. Осталось дней: ${daysLeft}.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.systemPrompt(lang) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    prediction.aiAssessment = response.choices[0]?.message?.content || '';
    await this.storeReport(userId, 'monthly_prediction', prediction);

    return prediction;
  }

  async chatWithAI(userId: string, message: string) {
    await this.checkAiLimit(userId);
    const user = await this.getUserContext(userId);
    const lang = this.getLanguage(user);
    const transactions = await this.getRecentTransactions(userId, 60);
    const budgets = await this.fetchBudgets(userId);
    const goals = await this.fetchGoals(userId);
    const loans = await this.fetchLoans(userId);

    const summary = this.buildFinancialSummary(transactions, budgets, goals, loans, user, lang);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.systemPrompt(lang) + `\n\nHere is the user's current financial context:\n${summary}` },
        { role: 'user', content: message },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content || (lang === 'en' ? 'Sorry, I could not process that.' : 'Извините, не удалось обработать запрос.');

    await this.storeReport(userId, 'chat', { userMessage: message, aiReply: reply });
    return { reply };
  }

  async analyzeTransaction(userId: string, text: string) {
    await this.checkAiLimit(userId);
    const user = await this.getUserContext(userId);
    const lang = this.getLanguage(user);

    const categories = await this.prisma.category.findMany({
      select: { id: true, name: true, nameRu: true, nameUk: true },
    });

    const categoryList = categories.map((c) => ({
      id: c.id,
      name: c.name,
      nameRu: c.nameRu || c.name,
    }));

    const isEn = lang === 'en';
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: isEn
            ? 'You extract structured financial transaction data from natural language text. Use the provided function to return the result.'
            : 'Извлекай структурированные данные финансовой транзакции из текста на естественном языке. Используй предоставленную функцию для возврата результата.',
        },
        { role: 'user', content: text },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'extract_transaction',
            description: isEn ? 'Extract transaction details from natural language' : 'Извлечь детали транзакции из текста',
            parameters: {
              type: 'object',
              properties: {
                amount: { type: 'number', description: 'Transaction amount (positive number)' },
                currency: { type: 'string', description: 'Currency code (EUR, USD, RUB, etc.)', default: user.currency || 'EUR' },
                type: { type: 'string', enum: ['INCOME', 'EXPENSE'], description: 'Whether money was received or spent' },
                description: { type: 'string', description: 'Cleaned transaction description' },
                categoryId: {
                  type: 'string',
                  description: isEn
                    ? `Best matching category ID from this list: ${JSON.stringify(categoryList)}`
                    : `ID наиболее подходящей категории из списка: ${JSON.stringify(categoryList)}`,
                  nullable: true,
                },
                confidence: { type: 'number', description: 'Confidence score 0-1' },
              },
              required: ['amount', 'currency', 'type', 'description', 'confidence'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'extract_transaction' } },
      max_tokens: 300,
      temperature: 0,
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    let result: any;

    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        result = { error: 'Failed to parse AI response', raw: toolCall.function.arguments };
      }
    } else {
      result = { error: 'AI did not return structured data', raw: response.choices[0]?.message?.content };
    }

    await this.storeReport(userId, 'text_analysis', { input: text, result });
    return result;
  }

  async generateWeeklyReport(userId: string) {
    await this.checkAiLimit(userId);
    const user = await this.getUserContext(userId);
    const lang = this.getLanguage(user);
    const transactions = await this.getLastWeekTransactions(userId);
    const budgets = await this.fetchBudgets(userId);
    const goals = await this.fetchGoals(userId);
    const loans = await this.fetchLoans(userId);

    const summary = this.buildFinancialSummary(transactions, budgets, goals, loans, user, lang);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const isEn = lang === 'en';
    const prompt = isEn
      ? `Generate a comprehensive weekly financial report for ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}. Include:
1. Week overview (total spent, earned, net)
2. Top spending categories
3. Comparison with budget (if any)
4. Notable transactions or patterns
5. Personalized tips for next week
6. A motivational score (0-100) for financial discipline this week

Format as JSON with keys: "weekStart", "weekEnd", "overview" (object with totals), "topCategories" (array), "budgetComparison" (object), "notableFindings" (array), "tips" (array), "disciplineScore" (number 0-100), "summary" (string - short human-readable summary paragraph).

Data:\n${summary}`
      : `Создай комплексный еженедельный финансовый отчёт за ${format(weekStart, 'd MMMM')} - ${format(weekEnd, 'd MMMM yyyy')}. Включи:
1. Обзор недели (всего потрачено, заработано, чисто)
2. Основные категории расходов
3. Сравнение с бюджетом (если есть)
4. Заметные транзакции или паттерны
5. Персонализированные советы на следующую неделю
6. Мотивационный балл (0-100) за финансовую дисциплину на этой неделе

Форматируй как JSON с ключами: "weekStart", "weekEnd", "overview" (объект с суммами), "topCategories" (массив), "budgetComparison" (объект), "notableFindings" (массив), "tips" (массив), "disciplineScore" (число 0-100), "summary" (строка - краткое резюме для чтения).

Данные:\n${summary}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.systemPrompt(lang) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    let report: any;
    try {
      report = JSON.parse(content || '{}');
    } catch {
      report = { summary: content };
    }

    report.weekStart = format(weekStart, 'yyyy-MM-dd');
    report.weekEnd = format(weekEnd, 'yyyy-MM-dd');

    await this.storeReport(userId, 'weekly_report', report, report.tips);
    return report;
  }

  async getLoanAdvice(userId: string, loanData: {
    totalAmount: number;
    interestRate: number;
    termMonths: number;
    monthlyPayment: number;
    remainingAmount?: number;
    paidAmount?: number;
    name?: string;
    currency?: string;
  }) {
    const user = await this.getUserContext(userId);
    const lang = this.getLanguage(user);
    const currency = loanData.currency || user.currency || 'EUR';

    const remaining = loanData.remainingAmount ?? loanData.totalAmount;
    const paid = loanData.paidAmount ?? 0;
    const progress = loanData.totalAmount > 0 ? Math.round((paid / loanData.totalAmount) * 100) : 0;
    const monthlyRate = (loanData.interestRate / 100) / 12;

    const totalPayments = loanData.termMonths * loanData.monthlyPayment;
    const totalInterest = totalPayments - loanData.totalAmount;

    const isEn = lang === 'en';
    const prompt = isEn
      ? `As a financial advisor, analyze this loan and provide payoff strategy recommendations:
- Loan Name: ${loanData.name || 'Unnamed'}
- Total Amount: ${loanData.totalAmount} ${currency}
- Remaining: ${remaining} ${currency}
- Paid: ${paid} (${progress}%)
- Interest Rate: ${loanData.interestRate}% APR (monthly: ${(monthlyRate * 100).toFixed(3)}%)
- Term: ${loanData.termMonths} months
- Monthly Payment: ${loanData.monthlyPayment} ${currency}
- Total Interest (if full term): ${totalInterest.toFixed(2)} ${currency}

Provide recommendations as JSON with keys:
- "loanSummary": object with key details
- "strategies": array of {name, description, monthlySaving?, interestSaved?, paysOffBy?}
- "recommendedStrategy": string
- "isHighInterest": boolean
- "priority": string (high/medium/low)
- "advice": string - friendly paragraph summary`
      : `Как финансовый советник, проанализируй этот кредит и предложи стратегии погашения:
- Название: ${loanData.name || 'Без названия'}
- Общая сумма: ${loanData.totalAmount} ${currency}
- Остаток: ${remaining} ${currency}
- Выплачено: ${paid} (${progress}%)
- Процентная ставка: ${loanData.interestRate}% годовых (месячная: ${(monthlyRate * 100).toFixed(3)}%)
- Срок: ${loanData.termMonths} месяцев
- Ежемесячный платёж: ${loanData.monthlyPayment} ${currency}
- Всего процентов (весь срок): ${totalInterest.toFixed(2)} ${currency}

Предоставь рекомендации в формате JSON с ключами:
- "loanSummary": объект с деталями
- "strategies": массив {name, description, monthlySaving?, interestSaved?, paysOffBy?}
- "recommendedStrategy": строка
- "isHighInterest": boolean
- "priority": строка (high/medium/low)
- "advice": строка - дружеское резюме`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.systemPrompt(lang) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    let advice: any;
    try {
      advice = JSON.parse(content || '{}');
    } catch {
      advice = { advice: content };
    }

    return advice;
  }

  async generateFinancialIQ(userId: string) {
    await this.checkAiLimit(userId);
    const user = await this.getUserContext(userId);
    const lang = this.getLanguage(user);
    const transactions = await this.getRecentTransactions(userId, 90);
    const budgets = await this.fetchBudgets(userId);
    const goals = await this.fetchGoals(userId);
    const loans = await this.fetchLoans(userId);

    if (transactions.length < 5) {
      const isEn = lang === 'en';
      return {
        score: 0,
        breakdown: {},
        message: isEn
          ? 'Not enough data to calculate Financial IQ. Track at least 5 transactions.'
          : 'Недостаточно данных для расчёта Финансового IQ. Добавьте минимум 5 транзакций.',
      };
    }

    const summary = this.buildFinancialSummary(transactions, budgets, goals, loans, user, lang);

    const isEn = lang === 'en';
    const prompt = isEn
      ? `Analyze this user's financial behavior over the last 3 months and assign a Financial IQ score (0-1000). Consider:

1. Budget Discipline (0-200): How well they stay within budgets
2. Savings Behavior (0-200): Regular saving patterns and goal progress
3. Spending Awareness (0-200): Are they mindful of expenses, avoiding impulse buys
4. Income Management (0-200): How well they manage their income-to-expense ratio
5. Debt & Loan Management (0-200): How they handle loans and credit

Return JSON with keys:
- "score": number 0-1000
- "level": string (e.g. "Financial novice" / "Smart spender" / "Money master" / "Financial guru")
- "breakdown": { "budgetDiscipline": number, "savingsBehavior": number, "spendingAwareness": number, "incomeManagement": number, "debtManagement": number }
- "strengths": string[]
- "weaknesses": string[]
- "actionItems": string[]
- "summary": string - friendly assessment paragraph

Data:\n${summary}`
      : `Проанализируй финансовое поведение пользователя за последние 3 месяца и назначь Финансовый IQ (0-1000). Учитывай:

1. Бюджетная дисциплина (0-200): Насколько хорошо соблюдает бюджеты
2. Поведение накоплений (0-200): Регулярность накоплений и прогресс по целям
3. Осознанность расходов (0-200): Внимательность к тратам, избегание импульсивных покупок
4. Управление доходом (0-200): Соотношение доходов и расходов
5. Управление долгами (0-200): Работа с кредитами и займами

Верни JSON с ключами:
- "score": число 0-1000
- "level": строка (например "Финансовый новичок" / "Умный тратитель" / "Мастер денег" / "Финансовый гуру")
- "breakdown": { "budgetDiscipline": число, "savingsBehavior": число, "spendingAwareness": число, "incomeManagement": число, "debtManagement": число }
- "strengths": string[]
- "weaknesses": string[]
- "actionItems": string[]
- "summary": строка - дружеская оценка

Данные:\n${summary}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.systemPrompt(lang) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    let result: any;
    try {
      result = JSON.parse(content || '{}');
    } catch {
      result = { score: 0, summary: content, breakdown: {} };
    }

    if (result.score && !isNaN(result.score)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { financialIQ: Math.round(result.score) },
      });
    }

    await this.storeReport(userId, 'financial_iq', result);
    return result;
  }
}
