# Reality Tracker

A sleek, high-contrast productivity dashboard and reality tracker. Track daily habits, manage tasks with time estimations, detect procrastination patterns, and review weekly performance metrics.

Built with **Next.js 14**, **Supabase**, **Tailwind CSS**, and **Framer Motion**.

---

## ⚡ Key Features

- **Hybrid Planner:** Unified workflow for daily habits, active tasks, and backlog management.
- **Habit & Routine Tracking:** Daily recurring habits with completion tracking and consistency logging.
- **Task Management & Durations:** Task scheduling with due dates, priority labels, duration estimates, and completion timestamps.
- **Procrastination Detection:** Automatic tracking of rescheduled tasks (`task_history`) to highlight postponement trends.
- **Weekly Analytics & Insights:** Performance breakdowns, completion rates, focus time metrics, and pattern analysis powered by **Recharts**.
- **Dark Aesthetic:** Built with a minimal dark palette, high contrast, smooth motion, and responsive layout.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/), [Lenis](https://github.com/darkroomengineering/lenis)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Date Utilities:** [date-fns](https://date-fns.org/)
- **Notifications:** [react-hot-toast](https://react-hot-toast.com/)
- **Language:** TypeScript

---

## 📁 Project Structure

```text
├── app/
│   ├── api/
│   │   ├── activities/       # Activity tracking endpoints
│   │   ├── analytics/        # Patterns, procrastination, & weekly summary APIs
│   │   ├── daily-tasks/      # Daily routines & completion endpoints
│   │   ├── tasks/            # Task CRUD & reschedule history
│   │   └── settings/         # Database statistics & settings
│   ├── layout.tsx            # Root layout & providers
│   ├── page.tsx              # Main dashboard entry
│   └── globals.css           # Global Tailwind and custom styles
├── components/
│   ├── HybridPlanner.tsx     # Central planner dashboard component
│   ├── PatternInsights.tsx   # Productivity pattern indicators
│   ├── ProcrastinationAlert.tsx # Alerts for postponed tasks
│   └── WeeklySummary.tsx     # Performance analytics charts
├── docs/                     # Development notes, plans, and documentation
├── lib/
│   ├── supabase.ts           # Supabase client & TypeScript models
│   └── utils.ts              # Helper functions & date formatters
├── public/                   # Static public assets
└── supabase/
    └── setup_analytics.sql   # SQL schema migrations & RLS policies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.17.0 or later recommended)
- **npm**, **pnpm**, or **yarn**
- A **Supabase** project ([create one for free](https://database.new))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/productivity-tracker.git
cd productivity-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Duplicate `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Database Setup

Navigate to your Supabase project's **SQL Editor** and run the contents of [`supabase/setup_analytics.sql`](supabase/setup_analytics.sql):

This provisions:
- `tasks`: Core task list with duration tracking and timestamps
- `daily_tasks`: Recurring daily habit definitions
- `daily_task_completions`: Daily completion logs with uniqueness constraints
- `task_history`: Change history tracking old vs. new due dates for procrastination analysis
- Row Level Security (RLS) policies

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `npm run dev`: Starts the local development server with hot-reloading.
- `npm run build`: Compiles and builds the production application.
- `npm run start`: Runs the built Next.js production server.
- `npm run lint`: Checks for linting errors with ESLint.
