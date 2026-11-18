import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { startOfWeek, endOfWeek, format } from 'date-fns';

// GET /api/analytics/patterns - Detect productivity patterns
export async function GET() {
    try {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

        // Get last 4 weeks of data
        const fourWeeksAgo = new Date(weekStart);
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const startDate = format(fourWeeksAgo, 'yyyy-MM-dd');
        const endDate = format(weekEnd, 'yyyy-MM-dd');

        // Get all tasks in date range
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .gte('due_date', startDate)
            .lte('due_date', endDate);

        if (error) throw error;

        // Analyze by day of week
        const dayStats = new Map<string, { completed: number; total: number }>();

        tasks?.forEach((task) => {
            if (!task.due_date) return;

            const date = new Date(task.due_date);
            const dayName = format(date, 'EEEE'); // Monday, Tuesday, etc.

            const stats = dayStats.get(dayName) || { completed: 0, total: 0 };
            stats.total++;
            if (task.completed) stats.completed++;
            dayStats.set(dayName, stats);
        });

        // Find best and worst days
        let bestDay = { day: '', rate: 0 };
        let worstDay = { day: '', rate: 100 };

        dayStats.forEach((stats, day) => {
            const rate = (stats.completed / stats.total) * 100;
            if (rate > bestDay.rate) {
                bestDay = { day, rate };
            }
            if (rate < worstDay.rate && stats.total > 0) {
                worstDay = { day, rate };
            }
        });

        // Analyze by task duration
        const longTasks = tasks?.filter((t) => t.estimated_duration && t.estimated_duration > 120) || [];
        const longTaskCompletionRate = longTasks.length > 0
            ? (longTasks.filter((t) => t.completed).length / longTasks.length) * 100
            : 0;

        const insights = [
            {
                type: 'best_day',
                metric: bestDay.day,
                value: Math.round(bestDay.rate),
                description: `${bestDay.day}s are your most productive day (${Math.round(bestDay.rate)}% completion)`,
            },
            {
                type: 'worst_day',
                metric: worstDay.day,
                value: Math.round(worstDay.rate),
                description: `${worstDay.day}s need work (${Math.round(worstDay.rate)}% completion)`,
            },
        ];

        if (longTaskCompletionRate < 60 && longTasks.length >= 3) {
            insights.push({
                type: 'task_type_struggle',
                metric: 'Long tasks (>2 hours)',
                value: Math.round(longTaskCompletionRate),
                description: `You struggle with long tasks (${Math.round(longTaskCompletionRate)}% completion). Try breaking them into smaller chunks.`,
            });
        }

        return NextResponse.json({ insights });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
