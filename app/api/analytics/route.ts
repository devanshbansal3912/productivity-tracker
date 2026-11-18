import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getToday, getCurrentWeekDates, formatDate } from '@/lib/utils';

export async function GET() {
    try {
        const today = getToday();
        const { start: weekStart, end: weekEnd } = getCurrentWeekDates();
        const weekStartStr = formatDate(weekStart);
        const weekEndStr = formatDate(weekEnd);

        // Fetch all tasks for the week
        const { data: weekTasks } = await supabase
            .from('tasks')
            .select('*')
            .gte('due_date', weekStartStr)
            .lte('due_date', weekEndStr);

        // Fetch overdue tasks
        const { data: overdueTasks } = await supabase
            .from('tasks')
            .select('*')
            .lt('due_date', today)
            .eq('completed', false)
            .not('due_date', 'is', null);

        // Fetch backlog tasks
        const { data: backlogTasks } = await supabase
            .from('tasks')
            .select('*')
            .is('due_date', null)
            .eq('completed', false);

        // Fetch all completed tasks (for completion rate)
        const { data: allTasks } = await supabase
            .from('tasks')
            .select('*')
            .not('due_date', 'is', null);

        // Fetch task history for procrastination detection
        const { data: taskHistory } = await supabase
            .from('task_history')
            .select('task_id, old_due_date, new_due_date, changed_at')
            .order('changed_at', { ascending: false });

        // Calculate metrics
        const totalTasks = weekTasks?.length || 0;
        const completedTasks = weekTasks?.filter(t => t.completed).length || 0;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Find best and worst days
        const dayStats = {} as Record<string, { total: number; completed: number }>;
        weekTasks?.forEach(task => {
            const date = task.due_date;
            if (!dayStats[date]) dayStats[date] = { total: 0, completed: 0 };
            dayStats[date].total++;
            if (task.completed) dayStats[date].completed++;
        });

        let bestDay = null;
        let worstDay = null;
        let bestRate = -1;
        let worstRate = 101;

        Object.entries(dayStats).forEach(([date, stats]) => {
            const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
            if (rate > bestRate && stats.total > 0) {
                bestRate = rate;
                bestDay = { date, ...stats };
            }
            if (rate < worstRate && stats.total > 0) {
                worstRate = rate;
                worstDay = { date, ...stats };
            }
        });

        // Calculate streak (consecutive days completing all tasks)
        let streak = 0;
        const sortedDates = Object.keys(dayStats).sort().reverse();
        for (const date of sortedDates) {
            const stats = dayStats[date];
            if (stats.completed === stats.total && stats.total > 0) {
                streak++;
            } else {
                break;
            }
        }

        // Detect procrastinated tasks (moved 3+ times)
        const taskMoveCount = {} as Record<string, number>;
        taskHistory?.forEach(record => {
            taskMoveCount[record.task_id] = (taskMoveCount[record.task_id] || 0) + 1;
        });

        const procrastinatedTaskIds = Object.entries(taskMoveCount)
            .filter(([_, count]) => count >= 3)
            .map(([taskId]) => taskId);

        const { data: procrastinatedTasks } = await supabase
            .from('tasks')
            .select('*')
            .in('id', procrastinatedTaskIds.length > 0 ? procrastinatedTaskIds : ['']);

        // Old backlog tasks (created >30 days ago)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const oldBacklogTasks = backlogTasks?.filter(task =>
            new Date(task.created_at) < thirtyDaysAgo
        ) || [];

        // Estimate total planned hours vs realistic
        const totalPlannedHours = weekTasks?.reduce((sum, task) => {
            if (!task.duration) return sum;
            const match = task.duration.match(/(\d+)\s*(hour|hr|h)/i);
            return sum + (match ? parseInt(match[1]) : 0);
        }, 0) || 0;

        const avgCompletionRate = allTasks && allTasks.length > 0
            ? (allTasks.filter(t => t.completed).length / allTasks.length) * 100
            : 0;

        return NextResponse.json({
            weeklyStats: {
                totalTasks,
                completedTasks,
                completionRate,
                streak,
                overdue: overdueTasks?.length || 0,
                backlog: backlogTasks?.length || 0,
            },
            bestDay,
            worstDay,
            procrastinatedTasks: procrastinatedTasks?.map(t => ({
                id: t.id,
                task_text: t.task_text,
                moveCount: taskMoveCount[t.id],
            })) || [],
            oldBacklogTasks: oldBacklogTasks.map(t => ({
                id: t.id,
                task_text: t.task_text,
                daysInBacklog: Math.floor((new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            })),
            insights: {
                totalPlannedHours,
                avgCompletionRate: Math.round(avgCompletionRate),
                overestimating: totalPlannedHours > 40, // More than full work week
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}