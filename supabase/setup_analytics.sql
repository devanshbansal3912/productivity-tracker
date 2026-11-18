-- ==============================================================================
-- Productivity Tracker Database Setup
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 0. Enable UUID Extension (Postgres)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tasks Table (Core task management with time tracking & priority)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    duration TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER,    -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Daily Tasks Table (Recurring habits & daily routines)
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Daily Task Completions (Habit streak & completion log)
CREATE TABLE IF NOT EXISTS daily_task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_task_id UUID REFERENCES daily_tasks(id) ON DELETE CASCADE NOT NULL,
    completion_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(daily_task_id, completion_date)
);

-- 4. Task History Table (For Procrastination & Postponement Detection)
CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    old_due_date DATE,
    new_due_date DATE,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Optional / Legacy Tables (Supported by /api/activities and /api/goals)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('deep_work', 'work', 'personal', 'health', 'distraction', 'rest')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    goal_text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_created_at ON daily_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_daily_completions_date ON daily_task_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_daily_completions_task_id ON daily_task_completions(daily_task_id);
CREATE INDEX IF NOT EXISTS idx_daily_completions_created_at ON daily_task_completions(created_at);

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_at ON task_history(changed_at);

CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_daily_goals_date ON daily_goals(date);

-- 7. Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

-- 8. MVP Access Policies (Open access via Anon key - Single User)
DROP POLICY IF EXISTS "Allow public access to tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public access to daily_tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Allow public access to daily_task_completions" ON daily_task_completions;
DROP POLICY IF EXISTS "Allow public access to task_history" ON task_history;
DROP POLICY IF EXISTS "Allow public access to activities" ON activities;
DROP POLICY IF EXISTS "Allow public access to daily_goals" ON daily_goals;

-- Remove old restrictive policies if they exist
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage their own daily tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can manage their own daily task completions" ON daily_task_completions;
DROP POLICY IF EXISTS "Users can manage their own task history" ON task_history;

CREATE POLICY "Allow public access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to daily_tasks" ON daily_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to daily_task_completions" ON daily_task_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to task_history" ON task_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to activities" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to daily_goals" ON daily_goals FOR ALL USING (true) WITH CHECK (true);

-- NOTE: If you later implement Supabase Auth, replace the above policies with:
-- CREATE POLICY "Users can manage their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
