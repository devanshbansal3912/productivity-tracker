import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/analytics/procrastination - Detect tasks that keep getting postponed
export async function GET() {
    try {
        // Get all task history grouped by task
        const { data: history, error: historyError } = await supabase
            .from('task_history')
            .select('task_id, old_due_date, new_due_date, changed_at')
            .order('changed_at', { ascending: false });

        if (historyError) throw historyError;

        // Count postponements per task
        const taskPostponements = new Map<string, number>();
        history?.forEach((record) => {
            const count = taskPostponements.get(record.task_id) || 0;
            taskPostponements.set(record.task_id, count + 1);
        });

        // Get tasks that were postponed 3+ times
        const procrastinatedTaskIds = Array.from(taskPostponements.entries())
            .filter(([_, count]) => count >= 3)
            .map(([taskId]) => taskId);

        if (procrastinatedTaskIds.length === 0) {
            return NextResponse.json({ procrastinated_tasks: [] });
        }

        // Get full task details
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .in('id', procrastinatedTaskIds)
            .eq('completed', false);

        if (tasksError) throw tasksError;

        // Get original dates from history
        const procrastinatedTasks = tasks?.map((task) => {
            const taskHistory = history?.filter((h) => h.task_id === task.id) || [];
            const originalDate = taskHistory[taskHistory.length - 1]?.old_due_date || task.due_date;

            return {
                task_id: task.id,
                task_name: task.task_name,
                times_postponed: taskPostponements.get(task.id) || 0,
                original_date: originalDate,
                current_date: task.due_date,
            };
        }) || [];

        return NextResponse.json({ procrastinated_tasks: procrastinatedTasks });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
