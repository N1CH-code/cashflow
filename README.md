# CashFlow — AI Financial Assistant in Telegram

> **"Узнай, куда на самом деле уходят твои деньги."**

Premium Telegram Mini App with AI-powered personal finance management.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Telegram Client                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Telegram Mini App (WebView)            │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │         Next.js 14 Frontend               │  │   │
│  │  │  ● App Router (18 pages)                  │  │   │
│  │  │  ● Tailwind + Glassmorphism               │  │   │
│  │  │  ● Framer Motion                          │  │   │
│  │  │  ● Zustand Store                          │  │   │
│  │  │  ● Telegram Mini Apps SDK                 │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
                       ▼
┌─────────────────────────────────────────────────────────┐
│                NestJS Backend (Railway)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Auth Guard → JWT Validation                    │   │
│  │  Modules:                                       │   │
│  │  ● Auth ● Users ● Transactions                  │   │
│  │  ● Budget ● Goals ● Loans ● Subscriptions       │   │
│  │  ● AI ● Analytics ● Gamification                │   │
│  │  ● FinancialIQ ● Achievements ● Referrals       │   │
│  │  ● Notifications ● Onboarding ● Categories      │   │
│  │  Scheduled Tasks:                               │   │
│  │  ● Daily budget recalculation                   │   │
│  │  ● Weekly AI report generation                  │   │
│  │  ● Subscription expiry checks                   │   │
│  └──────────────┬──────────────────────────────────┘   │
└─────────────────┼──────────────────────────────────────┘
                  │ Prisma ORM
                  ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL (Supabase)                       │
│  17 tables + 5 enums + 20+ indexes                      │
└─────────────────────────────────────────────────────────┘
```

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│    User     │1──N│  Transaction      │N──1│  Category    │
├─────────────┤     ├──────────────────┤     ├──────────────┤
│ id          │     │ id               │     │ id           │
│ telegramId  │     │ userId (FK)      │     │ name         │
│ plan        │     │ categoryId (FK)  │     │ icon         │
│ currency    │     │ type (INCOME/    │     │ color        │
│ monthlyIncome│    │       EXPENSE)   │     │ isDefault    │
│ salaryDate  │     │ amount           │     └──────────────┘
│ financialType│    │ currency         │
│ level       │     │ description      │     ┌──────────────┐
│ xp          │     │ date             │     │   Budget     │
│ referralCode│     │ source           │─────│              │
│ streak      │     └──────────────────┘     │ userId (FK)  │
│ financialIQ │                              │ categoryId   │
└───┬───┬───┬──┘                              │ amount/spent │
    │   │   │                                 │ month/year   │
    │   │   │                                 └──────────────┘
    │   │   │
    │   │   └─────────────────────────────────┐
    │   │                                     │
┌───┴───────────┐    ┌──────────────┐    ┌────┴───────────┐
│    Goal       │    │    Loan      │    │  DailyLimit    │
├───────────────┤    ├──────────────┤    ├────────────────┤
│ userId (FK)   │    │ userId (FK)  │    │ userId (FK)    │
│ name          │    │ name         │    │ date           │
│ targetAmount  │    │ totalAmount  │    │ limitAmount    │
│ savedAmount   │    │ interestRate │    │ spentAmount    │
│ status        │    │ termMonths   │    └────────────────┘
│ deadline      │    │ monthlyPayment│
│ visibility    │    │ paidAmount   │    ┌──────────────────┐
└───────────────┘    │ aiAnalysis   │    │  UserAchievement │
                     └──────────────┘    ├──────────────────┤
┌──────────────┐     ┌──────────────┐    │ userId (FK)      │
│ Subscription │     │  Referral    │    │ achievement (FK) │
├──────────────┤     ├──────────────┤    │ unlockedAt       │
│ userId (FK)  │     │ inviterId(FK)│    └──────────────────┘
│ name         │     │ refereeId(FK)│
│ amount       │     │ rewardType   │    ┌──────────────────┐
│ billingCycle │     │ rewardClaimed│    │    AIReport      │
│ nextPayment  │     └──────────────┘    ├──────────────────┤
│ isActive     │                        │ userId (FK)      │
└──────────────┘     ┌──────────────┐    │ type             │
                     │Notification  │    │ content (JSON)   │
┌──────────────┐     ├──────────────┤    │ recommendations  │
│UserSettings  │     │ userId (FK)  │    └──────────────────┘
├──────────────┤     │ type         │
│ userId (FK)  │     │ title        │
│ aiEnabled    │     │ body         │
│ darkMode     │     │ isRead       │
│ language     │     │ data (JSON)  │
└──────────────┘     └──────────────┘
```

---

## User Flow

```
                    ┌─────────────────┐
                    │   Splash Screen  │
                    │  Telegram Auth   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Onboarding     │
                    │  Steps 1-5      │
                    │  ● Welcome      │
                    │  ● Currency     │
                    │  ● Income       │
                    │  ● Quiz         │
                    │  ● Result       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────────────────────────┐
                    │         MAIN DASHBOARD              │
                    │  ┌──────────────────────────────┐   │
                    │  │ Budget Card (Bal/Inc/Exp)    │   │
                    │  │ Salary Countdown             │   │
                    │  │ Daily Limit                  │   │
                    │  │ AI Tip of Day                │   │
                    │  │ Recent Transactions          │   │
                    │  │ Active Goals                 │   │
                    │  └──────────────────────────────┘   │
                    └───────┬───────┬───────┬──────┬──────┘
                            │       │       │      │
              ┌─────────────┘       │       │      └─────────────┐
              ▼                     ▼       ▼                    ▼
     ┌──────────────┐    ┌──────────────┐    ┌──────────┐  ┌──────────┐
     │  Transactions│    │  Analytics   │    │  Goals   │  │  AI Chat │
     │  List/Add    │    │  Charts/Trend│    │  List/Add│  │  Advice  │
     └──────────────┘    └──────────────┘    └──────────┘  └──────────┘
              │                                     │
              ▼                                     ▼
     ┌──────────────┐                       ┌──────────────┐
     │   Loans      │                       │   Profile    │
     │  + Schedule  │                       │  ● Level     │
     │  + AI Advice │                       │  ● IQ        │
     └──────────────┘                       │  ● Referrals │
                                            │  ● Subscribe │
                                            │  ● Achieve   │
                                            └──────────────┘
```

---

## Project Structure

```
cashflow/
├── prisma/
│   ├── schema.prisma          # Full database schema (17 tables)
│   └── seed.ts                # Categories + Achievements seed
│
├── backend/                   # NestJS API
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   └── modules/
│   │       ├── auth/          # Telegram Login + JWT
│   │       ├── users/         # Profile, Dashboard, Stats
│   │       ├── transactions/  # CRUD + AI Recognition
│   │       ├── categories/    # Seeded categories
│   │       ├── budget/        # Monthly budget tracking
│   │       ├── goals/         # Savings goals
│   │       ├── loans/         # Loan calculator + Amortization
│   │       ├── subscriptions/ # Plans, Trials, Payments
│   │       ├── referrals/     # Referral system
│   │       ├── achievements/  # Auto-unlock system
│   │       ├── ai/            # OpenAI integration
│   │       ├── analytics/     # Spending analytics
│   │       ├── financial-iq/  # IQ scoring
│   │       ├── gamification/  # XP, Levels, Streaks
│   │       ├── notifications/ # Push notifications
│   │       └── onboarding/    # 5-step onboarding
│   └── .env.example
│
├── frontend/                  # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx      # Splash + Main Dashboard
│   │   │   ├── onboarding/   # 5-step flow
│   │   │   └── (main)/       # Authenticated pages
│   │   │       ├── page.tsx  (moved to root)
│   │   │       ├── transactions/
│   │   │       ├── goals/
│   │   │       ├── loans/
│   │   │       ├── analytics/
│   │   │       ├── ai/
│   │   │       ├── profile/
│   │   │       ├── iq/
│   │   │       ├── achievements/
│   │   │       ├── referral/
│   │   │       ├── subscribe/
│   │   │       └── stories/
│   │   ├── components/
│   │   │   ├── ui/           # 10 base components
│   │   │   ├── layout/       # MainLayout, TabBar, FAB
│   │   │   └── shared/       # BudgetCard, GoalCard, etc.
│   │   ├── stores/           # Zustand
│   │   ├── lib/              # API client, utils
│   │   └── types/            # TypeScript types
│   └── tailwind.config.ts
│
└── README.md
```

---

## Subscription System

| Feature | FREE | PRO (€4.99/mo) | MAX (€9.99/mo) |
|---------|------|----------------|----------------|
| Transactions | 50/mo | Unlimited | Unlimited |
| Basic Analytics | ✅ | ✅ | ✅ |
| Financial IQ | ✅ | ✅ | ✅ |
| Savings Goals | ✅ | ✅ | ✅ |
| AI Analytics | ✗ | ✅ | ✅ |
| Budget Prediction | ✗ | ✅ | ✅ |
| Loan Management | ✗ | ✅ | ✅ |
| AI Consultant | ✗ | ✅ | ✅ |
| Subscription Tracking | ✗ | ✅ | ✅ |
| PDF Reports | ✗ | ✅ | ✅ |
| Data Export | ✗ | ✅ | ✅ |
| Family Budget | ✗ | ✗ | ✅ |
| Multiple Wallets | ✗ | ✗ | ✅ |
| Shared Goals | ✗ | ✗ | ✅ |
| Advanced AI | ✗ | ✗ | ✅ |
| Priority Support | ✗ | ✗ | ✅ |

**Trial**: 7 days full access (PRO features), no credit card required.

---

## AI System

### Capabilities
1. **Daily Advice** — analyzes last 7 days, returns 1 actionable tip
2. **Spending Patterns** — deep analysis of 30 days, identifies patterns, impulse buys, subscriptions
3. **Monthly Prediction** — projects budget runway based on current spend rate
4. **Conversational AI** — chat with context of 60 days of financial data
5. **Natural Language Recognition** — extracts transactions from text ("spent 18 euro on coffee")
6. **Weekly Reports** — comprehensive JSON reports with overview, top categories, discipline score
7. **Loan Advice** — personalized payoff strategies
8. **Financial IQ** — scores 0-1000 across 5 categories

### Technology
- Model: GPT-4o-mini
- Rate limiting: 5 queries/day for FREE, unlimited for PRO/MAX
- Function calling for transaction extraction
- Bilingual prompts (RU/EN)

---

## Gamification System

### Levels (1-10)
| Level | Title | XP Required |
|-------|-------|-------------|
| 1 | Novice | 0 |
| 2 | Controller | 100 |
| 3 | Economist | 300 |
| 4 | Strategist | 600 |
| 5 | Investor | 1,000 |
| 6 | Financial Master | 2,000 |
| 7 | Wealth Guardian | 3,500 |
| 8 | Money Sage | 5,000 |
| 9 | Prosperity Legend | 7,500 |
| 10 | CashFlow King | 10,000 |

### XP Sources
| Action | XP |
|--------|----|
| Add Transaction | +5 |
| Stay in Budget (month) | +20 |
| Complete Goal | +50 |
| Achievement Unlock | Varies |

### Achievements (11)
1. **7 Days Streak** — Track 7 consecutive days
2. **30 Days Streak** — Track 30 consecutive days
3. **First Goal** — Create first savings goal
4. **€1000 Saved** — Reach €1000 in savings
5. **First Saving** — Save for the first time
6. **Perfect Month** — Stay within budget for a month
7. **Budget Master** — 3 months within budget
8. **Analytics Pro** — 500 transactions
9. **Financial Guru** — Reach level 10
10. **Social Sharer** — Share IQ card
11. **Referral Star** — Invite 5 friends

---

## Referral System

- Each user gets a unique referral code on registration
- Rewards for inviter: 7 days Premium OR 100 AI requests OR 100 XP
- Referral leaderboard
- Deep link sharing (`https://t.me/cashflow_bot?start=ref_CODE`)

---

## Financial IQ

**Score Range**: 0-1000

**Components**:
- Quiz Score (0-400): 10 financial literacy questions
- Saving Rate (0-200): % of income saved
- Consistency (0-150): Regular transaction logging
- Budget Adherence (0-150): % of categories within budget
- Debt Management (0-100): Loan health
- Goal Progress (0-100): Savings goal completion

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| **UI/UX** | Framer Motion, Recharts, Glassmorphism |
| **State** | Zustand |
| **Backend** | NestJS 10, TypeScript |
| **ORM** | Prisma |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Telegram Login + JWT |
| **AI** | OpenAI GPT-4o-mini |
| **Charts** | Recharts |
| **Deploy** | Vercel (FE), Railway (BE) |
| **TG SDK** | @telegram-apps/sdk |

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment Variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Fill in your values
```

### 3. Database
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Run
```bash
# Terminal 1 — Backend
cd backend && npm run start:dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### 5. Open
- Frontend: http://localhost:3000
- API: http://localhost:4000/api/v1

---

## API Endpoints (70+)

| Module | Endpoints |
|--------|-----------|
| **Auth** | POST /auth/login, GET /auth/me |
| **Users** | GET/PATCH /users/me, GET /users/me/stats, GET /users/me/dashboard |
| **Transactions** | CRUD + GET /transactions/stats |
| **Budget** | CRUD + GET /budget/overview |
| **Goals** | CRUD + POST /goals/:id/add-funds + GET /goals/suggestions |
| **Loans** | CRUD + GET /loans/:id/schedule + GET /loans/:id/early-payoff |
| **AI** | POST /ai/chat, POST /ai/analyze-text, GET /ai/daily-advice, GET /ai/analysis, GET /ai/prediction, GET /ai/weekly-report, POST /ai/loan-advice |
| **Subscriptions** | GET /plans, GET /my, POST /upgrade, POST /cancel, POST /reactivate, GET /features |
| **Referrals** | GET /referrals, POST /referrals/apply, GET /referrals/leaderboard |
| **Analytics** | GET /analytics/overview, /monthly-breakdown, /trends, /income-vs-expenses, /category-comparison |
| **Gamification** | GET /gamification/profile, /levels |
| **Achievements** | GET /achievements, /my, POST /achievements/check |
| **Financial IQ** | GET /financial-iq, POST /financial-iq/quiz, POST /financial-iq/assess |
| **Onboarding** | GET /status, POST /step, /currency, /income, /quiz, /complete |
| **Notifications** | GET /notifications, PATCH /:id/read, POST /read-all, GET /unread-count |
| **Categories** | GET /categories |

---

## Design System

### Colors
```
Dark BG:    #0A0A0F
Dark Card:  #12121A
Dark Surf:  #1A1A26
Border:     #2A2A3A (opacity: 0.15)

Accent Green:   #22C55E
Accent Blue:    #3B82F6
Accent Purple:  #8B5CF6
Accent Orange:  #F59E0B
Accent Red:     #EF4444
Accent Pink:    #EC4899
Accent Cyan:    #06B6D4
```

### Typography
- Font: Inter (Latin + Cyrillic)
- Mono: JetBrains Mono
- Hierarchy: 5xl → xl → base → sm → xs

### Effects
- Glassmorphism: backdrop-blur-xl + semi-transparent bg
- Cards: rounded-2xl with subtle borders
- Gradients: Purple → Pink → Orange for branding
- Animations: spring-based with framer-motion
- Dark mode only (matching Telegram dark theme)

---

## Viral Features

1. **Financial IQ Card** — Shareable score card for Telegram stories
2. **Financial Type** — Personality type with emoji, shareable
3. **Monthly Summary** — Visual spending report card
4. **Referral Competition** — Leaderboard with rewards
5. **Achievement Sharing** — Unlock → Share to story
6. **Inline Queries** — Share financial tips via @cashflow_bot

---

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Railway)
```bash
cd backend
railway up
```

### Environment Variables (Production)
Ensure all variables from `.env.example` are set in your hosting platform.

---

## License

MIT
