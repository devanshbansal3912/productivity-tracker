import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Task System Types
export interface Task {
    id: string;
    task_name: string;
    description: string | null;
    due_date: string | null;
    completed: boolean;
    completed_at: string | null;
    estimated_duration: number | null; // minutes
    actual_duration: number | null;
    created_at: string;
}

export interface DailyTask {
    id: string;
    task_name: string;
    description: string | null;
    created_at: string;
}

export interface DailyTaskCompletion {
    id: string;
    daily_task_id: string;
    completion_date: string;
    completed_at: string;
}

export interface TaskHistory {
    id: string;
    task_id: string;
    old_due_date: string | null;
    new_due_date: string | null;
    changed_at: string;
    reason: string | null;
}

// Analytics Types
export interface ProcrastinationData {
    task_id: string;
    task_name: string;
    times_postponed: number;
    original_date: string;
    current_date: string;
}

export interface PatternInsight {
    type: 'best_day' | 'worst_day' | 'best_time' | 'task_type_struggle';
    metric: string;
    value: number;
    description: string;
}

export interface WeeklySummary {
    week_range: string;
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    daily_breakdown: Array<{
        date: string;
        completed: number;
        total: number;
    }>;
    streak: number;
    trend: 'up' | 'down' | 'stable';
    total_focus_time: number; // minutes
}