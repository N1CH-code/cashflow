import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class EducationService {
  constructor(private readonly prisma: PrismaService) {}

  async getArticles() {
    const articles = await this.prisma.educationArticle.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
    });

    return articles.map((a) => ({
      id: a.id,
      title: a.title,
      titleRu: a.titleRu,
      summary: a.summary,
      summaryRu: a.summaryRu,
      category: a.category,
      icon: a.icon,
      readTime: a.readTime,
      createdAt: a.createdAt,
    }));
  }

  async getArticle(id: string) {
    const article = await this.prisma.educationArticle.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');

    return {
      id: article.id,
      title: article.title,
      titleRu: article.titleRu,
      summary: article.summary,
      summaryRu: article.summaryRu,
      content: article.content,
      contentRu: article.contentRu,
      category: article.category,
      icon: article.icon,
      readTime: article.readTime,
      createdAt: article.createdAt,
    };
  }

  async seedArticles() {
    const existing = await this.prisma.educationArticle.count();
    if (existing > 0) return { seeded: false, message: 'Articles already exist' };

    const articles = [
      {
        title: 'What is a Budget?',
        titleRu: 'Что такое бюджет?',
        summary: 'Learn the basics of budgeting and why it matters for your financial health.',
        summaryRu: 'Узнай основы бюджетирования и почему это важно для твоего финансового здоровья.',
        content: `A budget is a plan for your money. It helps you track income, control spending, and save for goals.\n\n## Why Budget?\n- See where your money goes\n- Avoid debt\n- Save for the future\n- Reduce financial stress\n\n## The 50/30/20 Rule\n- **50%** for needs (rent, food, bills)\n- **30%** for wants (entertainment, dining)\n- **20%** for savings & debt\n\nStart small: track just one week of expenses to see your habits.`,
        contentRu: `Бюджет — это план твоих денег. Он помогает отслеживать доходы, контролировать расходы и копить на цели.\n\n## Зачем нужен бюджет?\n- Видеть, куда уходят деньги\n- Избегать долгов\n- Копить на будущее\n- Уменьшить финансовый стресс\n\n## Правило 50/30/20\n- **50%** на нужды (аренда, еда, счета)\n- **30%** на желания (развлечения, рестораны)\n- **20%** на сбережения и долги\n\nНачни с малого: отследи всего неделю расходов, чтобы увидеть свои привычки.`,
        category: 'BASICS',
        icon: 'book-open',
        readTime: 5,
        sortOrder: 1,
      },
      {
        title: 'The Power of Compound Interest',
        titleRu: 'Сила сложного процента',
        summary: 'Understand how compound interest can grow your savings exponentially over time.',
        summaryRu: 'Пойми, как сложный процент может экспоненциально увеличить твои сбережения.',
        content: `Compound interest is interest earned on interest. It's the eighth wonder of the world.\n\n## How It Works\nIf you invest $100 at 10% annual return:\n- Year 1: $110\n- Year 2: $121\n- Year 3: $133.10\n- Year 10: $259.37\n\n## The Rule of 72\nDivide 72 by your interest rate to see how long until your money doubles.\n- 10% → 7.2 years\n- 7% → ~10.3 years\n- 5% → ~14.4 years\n\n## Start Early\nThe best time to start investing was yesterday. The second best is today.`,
        contentRu: `Сложный процент — это процент, начисленный на проценты. Это восьмое чудо света.\n\n## Как это работает\nЕсли инвестировать $100 под 10% годовых:\n- Год 1: $110\n- Год 2: $121\n- Год 3: $133.10\n- Год 10: $259.37\n\n## Правило 72\nРаздели 72 на свою процентную ставку, чтобы узнать, через сколько лет деньги удвоятся.\n- 10% → 7.2 года\n- 7% → ~10.3 лет\n- 5% → ~14.4 лет\n\n## Начинай рано\nЛучшее время начать инвестировать было вчера. Второе лучшее — сегодня.`,
        category: 'INVESTING',
        icon: 'trending-up',
        readTime: 4,
        sortOrder: 2,
      },
      {
        title: 'Emergency Fund Basics',
        titleRu: 'Резервный фонд',
        summary: 'Why you need 3-6 months of expenses saved and how to build your safety net.',
        summaryRu: 'Почему тебе нужно 3-6 месяцев расходов и как создать подушку безопасности.',
        content: `An emergency fund is money set aside for unexpected expenses.\n\n## Why You Need One\n- Job loss\n- Medical emergencies\n- Car repairs\n- Home repairs\n\n## How Much?\nStart with $1,000 or €1,000, then build to 3-6 months of essential expenses.\n\n## Where to Keep It\n- High-yield savings account\n- Easy to access\n- Separate from daily spending\n\nStart small: save just 5% of each paycheck until you reach your goal.`,
        contentRu: `Резервный фонд — это деньги, отложенные на непредвиденные расходы.\n\n## Зачем он нужен\n- Потеря работы\n- Медицинские emergencies\n- Ремонт автомобиля\n- Ремонт дома\n\n## Сколько нужно?\nНачни с $1000 или €1000, затем увеличь до 3-6 месяцев основных расходов.\n\n## Где хранить\n- Высокодоходный сберегательный счёт\n- Лёгкий доступ\n- Отдельно от повседневных трат\n\nНачни с малого: откладывай 5% каждой зарплаты.`,
        category: 'SAVING',
        icon: 'shield',
        readTime: 4,
        sortOrder: 3,
      },
      {
        title: 'Understanding Credit Scores',
        titleRu: 'Понимание кредитных рейтингов',
        summary: 'What affects your credit score and how to improve it.',
        summaryRu: 'Что влияет на твой кредитный рейтинг и как его улучшить.',
        content: `Your credit score affects your ability to borrow money and the interest rates you get.\n\n## Key Factors\n- Payment history (35%)\n- Credit utilization (30%)\n- Length of credit history (15%)\n- New credit (10%)\n- Credit mix (10%)\n\n## Tips to Improve\n- Pay bills on time\n- Keep credit utilization under 30%\n- Don't close old accounts\n- Limit new applications\n- Check your report regularly`,
        contentRu: `Твой кредитный рейтинг влияет на возможность получить кредит и процентные ставки.\n\n## Ключевые факторы\n- История платежей (35%)\n- Использование кредита (30%)\n- Длина кредитной истории (15%)\n- Новые кредиты (10%)\n- Разнообразие кредитов (10%)\n\n## Как улучшить\n- Плати по счетам вовремя\n- Используй не более 30% лимита\n- Не закрывай старые счета\n- Ограничь новые заявки\n- Регулярно проверяй отчёт`,
        category: 'CREDIT',
        icon: 'credit-card',
        readTime: 6,
        sortOrder: 4,
      },
      {
        title: 'Smart Saving Strategies',
        titleRu: 'Умные стратегии сбережения',
        summary: 'Practical techniques to save more money without feeling deprived.',
        summaryRu: 'Практические техники, чтобы откладывать больше без чувства лишений.',
        content: `Saving money doesn't mean giving up everything you enjoy.\n\n## Strategies\n1. **Pay Yourself First** — Automate savings right after payday\n2. **The Envelope System** — Cash for each category\n3. **52-Week Challenge** — Save $1 more each week\n4. **No-Spend Days** — Pick 1-2 days per week to spend nothing\n5. **Round-Up Savings** — Round up purchases and save the difference\n\n## Automate It\nSet up automatic transfers to savings. You can't spend what you don't see.`,
        contentRu: `Экономия денег не означает отказ от всего, что тебе нравится.\n\n## Стратегии\n1. **Плати себе сначала** — Автоматически откладывай после зарплаты\n2. **Система конвертов** — Наличные для каждой категории\n3. **Челлендж 52 недели** — Откладывай на $1 больше каждую неделю\n4. **Дни без трат** — Выбери 1-2 дня в неделю без расходов\n5. **Округление** — Округляй покупки и сохраняй разницу\n\n## Автоматизируй\nНастрой автоматические переводы в сбережения. Не потратишь то, чего не видишь.`,
        category: 'SAVING',
        icon: 'piggy-bank',
        readTime: 5,
        sortOrder: 5,
      },
    ];

    for (const a of articles) {
      await this.prisma.educationArticle.create({ data: a as any });
    }

    return { seeded: true, count: articles.length };
  }
}
