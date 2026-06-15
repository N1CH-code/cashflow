import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => {
        console.error(`[API] ${err.config?.method?.toUpperCase()} ${err.config?.url} failed:`, err.response?.status, err.message);
        return Promise.reject(err);
      },
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cf_token', token);
    }
  }

  loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('cf_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cf_token');
    }
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const { data } = await this.client.get<T>(url, { params });
    return data;
  }

  async post<T>(url: string, body?: any): Promise<T> {
    const { data } = await this.client.post<T>(url, body);
    return data;
  }

  async patch<T>(url: string, body?: any): Promise<T> {
    const { data } = await this.client.patch<T>(url, body);
    return data;
  }

  async delete<T>(url: string): Promise<T> {
    const { data } = await this.client.delete<T>(url);
    return data;
  }

  // Auth
  login = (initData: string) => this.post<{ access_token: string }>('/auth/login', { initData });
  devLogin = () => this.post<{ access_token: string }>('/auth/dev-login');
  getMe = () => this.get<any>('/users/me');
  updateUser = (body: any) => this.patch<any>('/users/me', body);

  // Transactions
  getTransactions = (params?: any) => this.get<{ data: any[]; meta: any }>('/transactions', params);
  createTransaction = (body: any) => this.post<any>('/transactions', body);
  updateTransaction = (id: string, body: any) => this.patch<any>(`/transactions/${id}`, body);
  deleteTransaction = (id: string) => this.delete(`/transactions/${id}`);
  getTransactionStats = () => this.get<any>('/transactions/stats');

  // Budget
  getBudgetOverview = () => this.get<any>('/budget/overview');
  createBudget = (body: any) => this.post<any>('/budget', body);
  updateBudget = (id: string, body: any) => this.patch<any>(`/budget/${id}`, body);

  // Goals
  getGoals = () => this.get<any[]>('/goals');
  createGoal = (body: any) => this.post<any>('/goals', body);
  updateGoal = (id: string, body: any) => this.patch<any>(`/goals/${id}`, body);
  deleteGoal = (id: string) => this.delete(`/goals/${id}`);
  addFundsToGoal = (id: string, body: any) => this.post<any>(`/goals/${id}/add-funds`, body);

  // Loans
  getLoans = () => this.get<any[]>('/loans');
  createLoan = (body: any) => this.post<any>('/loans', body);
  updateLoan = (id: string, body: any) => this.patch<any>(`/loans/${id}`, body);
  deleteLoan = (id: string) => this.delete(`/loans/${id}`);
  getLoanSchedule = (id: string) => this.get<any[]>(`/loans/${id}/schedule`);
  getLoanEarlyPayoff = (id: string, extra: number) => this.get<any>(`/loans/${id}/early-payoff`, { extraPerMonth: extra });

  // AI
  getDailyAdvice = () => this.get<any>('/ai/daily-advice');
  getAIAnalysis = () => this.get<any>('/ai/analysis');
  getAIPrediction = () => this.get<any>('/ai/prediction');
  chatWithAI = (message: string) => this.post<any>('/ai/chat', { message });
  analyzeText = (text: string) => this.post<any>('/ai/analyze-text', { text });
  getWeeklyReport = () => this.get<any>('/ai/weekly-report');
  getLoanAdvice = (body: any) => this.post<any>('/ai/loan-advice', body);

  // Gamification
  getGamificationProfile = () => this.get<any>('/gamification/profile');
  getAchievements = () => this.get<any[]>('/achievements');
  getMyAchievements = () => this.get<any[]>('/achievements/my');

  // Financial IQ
  getFinancialIQ = () => this.post<any>('/financial-iq/assess');
  submitQuiz = (answers: number[]) => this.post<any>('/financial-iq/quiz', { answers });

  // Referrals
  getReferrals = () => this.get<any>('/referrals');
  applyReferral = (code: string) => this.post<any>('/referrals/apply', { code });

  // Onboarding
  getOnboardingStatus = () => this.get<any>('/onboarding/status');
  completeOnboardingStep = (step: number, data?: any) => this.post<any>('/onboarding/step', { step, data });
  setCurrency = (currency: string) => this.post<any>('/onboarding/currency', { currency });
  setIncome = (monthlyIncome: number, salaryDate: number) =>
    this.post<any>('/onboarding/income', { monthlyIncome, salaryDate });
  submitQuizAnswers = (answers: number[]) => this.post<any>('/onboarding/quiz', { answers });
  completeOnboarding = () => this.post<any>('/onboarding/complete');

  // Subscriptions
  getPlans = () => this.get<any[]>('/subscriptions/plans');
  getMySubscription = () => this.get<any>('/subscriptions/my');
  upgradePlan = (plan: string) => this.post<any>('/subscriptions/upgrade', { plan });
  getDashboard = () => this.get<any>('/users/me/dashboard');

  // Challenges
  getChallenges = () => this.get<any>('/challenges');
  joinChallenge = (id: string) => this.post<any>(`/challenges/${id}/join`);
  getActiveChallenges = () => this.get<any[]>('/challenges/active');

  // Family
  getMyFamily = () => this.get<any>('/family');
  createFamily = (body: { name: string }) => this.post<any>('/family/create', body);
  joinFamily = (code: string) => this.post<any>('/family/join', { inviteCode: code });
  getFamilyMembers = () => this.get<any[]>('/family/members');
  getFamilyGoals = () => this.get<any[]>('/family/goals');
  getFamilyTransactions = () => this.get<any[]>('/family/transactions');
  getFamilyStats = () => this.get<any>('/family/stats');
  leaveFamily = () => this.delete('/family/leave');

  // Education
  getEducationArticles = () => this.get<any[]>('/education/articles');
  getEducationArticle = (id: string) => this.get<any>(`/education/articles/${id}`);

  // Calculator endpoints (frontend-only, will compute locally)
  
  // Categories
  getCategories = () => this.get<any[]>('/categories');

  // Notifications
  getNotifications = (page?: number) => this.get<any[]>('/notifications', { page });
  markNotificationRead = (id: string) => this.patch(`/notifications/${id}/read`);
  markAllNotificationsRead = () => this.post('/notifications/read-all');
  getUnreadCount = () => this.get<{ count: number }>('/notifications/unread-count');

  // Analytics
  getAnalyticsOverview = () => this.get<any>('/analytics/overview');
  getMonthlyBreakdown = (month: number, year: number) =>
    this.get<any>('/analytics/monthly-breakdown', { month, year });
  getTrends = (months: number = 6) => this.get<any>('/analytics/trends', { months });
}

export const api = new ApiClient();
