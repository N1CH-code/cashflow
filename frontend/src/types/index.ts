export type Currency = 'EUR' | 'USD' | 'GBP' | 'RUB' | 'UAH' | 'PLN' | 'CHF';
export type UserRole = 'USER' | 'PREMIUM' | 'MAX' | 'ADMIN';
export type SubscriptionPlan = 'FREE' | 'PRO' | 'MAX';
export type FinancialType = 'SAVER' | 'INVESTOR' | 'IMPULSIVE' | 'RATIONALIST' | 'ADVENTURER';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionSource = 'MANUAL' | 'AI_RECOGNITION' | 'FAST_BUTTON' | 'RECURRING' | 'IMPORT';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type AchievementType =
  | 'STREAK_7' | 'STREAK_30' | 'FIRST_GOAL' | 'SAVINGS_1000'
  | 'FIRST_SAVING' | 'NO_OVERRUN_MONTH' | 'BUDGET_MASTER'
  | 'ANALYTICS_PRO' | 'FINANCIAL_GURU' | 'SHARING_SOCIAL' | 'REFERRAL_5';

export interface User {
  id: string;
  telegramId: string;
  telegramUsername?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  languageCode: string;
  role: UserRole;
  plan: SubscriptionPlan;
  onboardingComplete: boolean;
  onboardingStep: number;
  currency: Currency;
  monthlyIncome?: number;
  salaryDate?: number;
  dailyLimit?: number;
  financialType?: FinancialType;
  financialScore?: number;
  financialIQ?: number;
  xp: number;
  level: number;
  streak: number;
  referralCode: string;
  referralCount: number;
  createdAt: string;
  settings?: UserSettings;
}

export interface UserSettings {
  aiEnabled: boolean;
  notificationsEnabled: boolean;
  darkMode: boolean;
  language: string;
  weeklyReport: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId?: string;
  category?: Category;
  type: TransactionType;
  source: TransactionSource;
  amount: number;
  currency: Currency;
  description?: string;
  note?: string;
  date: string;
  isRecurring: boolean;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  nameRu?: string;
  nameUk?: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Budget {
  id: string;
  categoryId?: string;
  category?: Category;
  amount: number;
  spent: number;
  period: string;
  month: number;
  year: number;
}

export interface BudgetOverview {
  totalIncome: number;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  dailyLimit: number;
  daysUntilSalary: number;
  overspendWarning?: string;
  categories: (Budget & { progress: number })[];
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  savedAmount: number;
  status: GoalStatus;
  deadline?: string;
  progress: number;
  daysRemaining?: number;
  projectedDate?: string;
  avgMonthlySave?: number;
}

export interface Loan {
  id: string;
  name: string;
  totalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: string;
  isActive: boolean;
  progress: number;
  totalInterest: number;
  remainingInterest: number;
}

export interface LoanScheduleEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface AIAdvice {
  tip: string;
  type: 'tip' | 'warning' | 'insight';
}

export interface AIPrediction {
  willRunOut: boolean;
  runOutDate?: string;
  projectedBalance: number;
  dailyAverage: number;
  daysRemaining: number;
}

export interface AIAnalysis {
  patterns: string[];
  impulsePurchases: { amount: number; description?: string }[];
  subscriptions: { name: string; amount: number }[];
  overspendCategories: { category: string; amount: number; limit: number }[];
  recommendations: string[];
}

export interface DashboardData {
  budget: BudgetOverview;
  recentTransactions: Transaction[];
  dailyLimit: { limit: number; spent: number; remaining: number };
  daysUntilSalary: number;
  aiTip: AIAdvice;
  activeGoals: Goal[];
  prediction?: AIPrediction;
}

export interface GamificationProfile {
  level: number;
  title: string;
  xp: number;
  xpToNext: number;
  progress: number;
  streak: number;
}

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface IQBreakdown {
  total: number;
  quizScore: number;
  savingRate: number;
  consistency: number;
  budgetAdherence: number;
  debtManagement: number;
  goalProgress: number;
}

export interface ReferralInfo {
  code: string;
  count: number;
  rewards: { type: string; claimed: boolean }[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: string;
  trialEnd?: string;
  endDate?: string;
  autoRenew: boolean;
  features: string[];
}

export interface Challenge {
  id: string;
  title: string;
  titleRu?: string;
  description: string;
  descriptionRu?: string;
  icon: string;
  type: string;
  goal: Record<string, any>;
  xpReward: number;
  startDate?: string;
  endDate?: string;
  progress?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface ChallengeResponse {
  available: Challenge[];
  active: Challenge[];
  completed: Challenge[];
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  members: FamilyMember[];
}

export interface FamilyMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    telegramUsername?: string;
  };
}

export interface FamilyStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  memberCount: number;
}

export interface EducationArticle {
  id: string;
  title: string;
  titleRu: string | null;
  summary: string;
  summaryRu: string | null;
  category: string;
  icon: string;
  readTime: number;
  createdAt: string;
}

export interface EducationArticleFull extends EducationArticle {
  content: string;
  contentRu: string | null;
}

export interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
  popular?: boolean;
}
