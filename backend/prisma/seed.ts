import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Groceries', nameRu: 'Продукты', nameUk: 'Продукти', icon: 'shopping-cart', color: '#22C55E', sortOrder: 1 },
    { name: 'Transport', nameRu: 'Транспорт', nameUk: 'Транспорт', icon: 'car', color: '#3B82F6', sortOrder: 2 },
    { name: 'Cafe', nameRu: 'Кафе', nameUk: 'Кафе', icon: 'coffee', color: '#F59E0B', sortOrder: 3 },
    { name: 'Restaurants', nameRu: 'Рестораны', nameUk: 'Ресторани', icon: 'utensils-crossed', color: '#EF4444', sortOrder: 4 },
    { name: 'Entertainment', nameRu: 'Развлечения', nameUk: 'Розваги', icon: 'popcorn', color: '#EC4899', sortOrder: 5 },
    { name: 'Subscriptions', nameRu: 'Подписки', nameUk: 'Підписки', icon: 'repeat', color: '#8B5CF6', sortOrder: 6 },
    { name: 'Travel', nameRu: 'Путешествия', nameUk: 'Подорожі', icon: 'plane', color: '#06B6D4', sortOrder: 7 },
    { name: 'Clothing', nameRu: 'Одежда', nameUk: 'Одяг', icon: 'shirt', color: '#F97316', sortOrder: 8 },
    { name: 'Health', nameRu: 'Здоровье', nameUk: "Здоров'я", icon: 'heart-pulse', color: '#DC2626', sortOrder: 9 },
    { name: 'Education', nameRu: 'Образование', nameUk: 'Освіта', icon: 'book-open', color: '#6366F1', sortOrder: 10 },
    { name: 'Shopping', nameRu: 'Покупки', nameUk: 'Покупки', icon: 'package', color: '#A855F7', sortOrder: 11 },
    { name: 'Bills', nameRu: 'Счета', nameUk: 'Рахунки', icon: 'file-text', color: '#64748B', sortOrder: 12 },
    { name: 'Salary', nameRu: 'Зарплата', nameUk: 'Зарплата', icon: 'wallet', color: '#22C55E', sortOrder: 13 },
    { name: 'Freelance', nameRu: 'Фриланс', nameUk: 'Фріланс', icon: 'laptop', color: '#3B82F6', sortOrder: 14 },
    { name: 'Investments', nameRu: 'Инвестиции', nameUk: 'Інвестиції', icon: 'trending-up', color: '#10B981', sortOrder: 15 },
    { name: 'Other', nameRu: 'Другое', nameUk: 'Інше', icon: 'more-horizontal', color: '#94A3B8', sortOrder: 16 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.name },
      update: cat,
      create: { id: cat.name, ...cat, isDefault: true },
    });
  }

  const achievements = [
    { type: 'STREAK_7' as const, name: '7 Days Streak', nameRu: '7 дней учета', nameUk: '7 днів обліку', description: 'Track expenses for 7 days in a row', icon: 'flame', xpReward: 50, sortOrder: 1 },
    { type: 'STREAK_30' as const, name: '30 Days Streak', nameRu: '30 дней учета', nameUk: '30 днів обліку', description: 'Track expenses for 30 days in a row', icon: 'zap', xpReward: 200, sortOrder: 2 },
    { type: 'FIRST_GOAL' as const, name: 'First Goal', nameRu: 'Первая цель', nameUk: 'Перша ціль', description: 'Create your first savings goal', icon: 'target', xpReward: 30, sortOrder: 3 },
    { type: 'SAVINGS_1000' as const, name: '€1000 Saved', nameRu: '€1000 накоплений', nameUk: '€1000 заощаджень', description: 'Save €1000', icon: 'piggy-bank', xpReward: 300, sortOrder: 4 },
    { type: 'FIRST_SAVING' as const, name: 'First Saving', nameRu: 'Первая экономия', nameUk: 'Перша економія', description: 'Save money for the first time', icon: 'sparkles', xpReward: 20, sortOrder: 5 },
    { type: 'NO_OVERRUN_MONTH' as const, name: 'Perfect Month', nameRu: 'Без перерасхода', nameUk: 'Без перевитрати', description: 'Stay within budget for a full month', icon: 'award', xpReward: 150, sortOrder: 6 },
    { type: 'BUDGET_MASTER' as const, name: 'Budget Master', nameRu: 'Мастер бюджета', nameUk: 'Майстер бюджету', description: 'Stay within budget for 3 months', icon: 'crown', xpReward: 500, sortOrder: 7 },
    { type: 'ANALYTICS_PRO' as const, name: 'Analytics Pro', nameRu: 'Про аналитики', nameUk: 'Про аналітики', description: 'Add 500 transactions', icon: 'bar-chart-3', xpReward: 400, sortOrder: 8 },
    { type: 'FINANCIAL_GURU' as const, name: 'Financial Guru', nameRu: 'Финансовый гуру', nameUk: 'Фінансовий гуру', description: 'Reach level 10', icon: 'graduation-cap', xpReward: 1000, sortOrder: 9 },
    { type: 'SHARING_SOCIAL' as const, name: 'Social Sharer', nameRu: 'Шеринг', nameUk: 'Шеринг', description: 'Share your financial IQ card', icon: 'share-2', xpReward: 30, sortOrder: 10 },
    { type: 'REFERRAL_5' as const, name: 'Referral Star', nameRu: 'Звезда рефералов', nameUk: 'Зірка рефералів', description: 'Invite 5 friends', icon: 'users', xpReward: 200, sortOrder: 11 },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { type: ach.type },
      update: ach,
      create: ach,
    });
  }

  console.log('Seed completed: categories & achievements');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
