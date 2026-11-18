import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const tables = ['tasks', 'daily_tasks', 'daily_task_completions', 'task_history'];
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

        const stats: any = {
            counts: {},
            growth: 0,
            previousGrowth: 0,
            size_mb: 0,
            usagePercent: 0
        };

        // 1. Get counts and growth
        for (const table of tables) {
            // Current total
            const { count, error: countError } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (countError) throw countError;
            stats.counts[table] = count || 0;

            // Added in last 7 days
            const { count: currentWeekCount, error: currentError } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
                .gt('created_at', sevenDaysAgo);

            if (currentError) throw currentError;
            stats.growth += (currentWeekCount || 0);

            // Added in previous 7 days (for trend)
            const { count: previousWeekCount, error: previousError } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
                .gt('created_at', fourteenDaysAgo)
                .lt('created_at', sevenDaysAgo);

            if (previousError) throw previousError;
            stats.previousGrowth += (previousWeekCount || 0);
        }

        // 2. Estimate size (Supabase free tier is usually small, we estimate based on rows if we can't get raw size)
        // Since we can't run raw SQL pg_database_size easily here without an RPC, 
        // we'll provide a realistic estimate based on row counts (approx 1KB per record including indexes)
        // or try a simple RPC if the user has it.
        // For this MVP, we estimate: 0.1MB base + 0.005MB per row
        const totalRows = Object.values(stats.counts).reduce((a: any, b: any) => a + b, 0) as number;
        stats.size_mb = parseFloat((0.5 + (totalRows * 0.001)).toFixed(2));

        // 500MB is the free tier limit
        stats.usagePercent = Math.min(100, parseFloat(((stats.size_mb / 500) * 100).toFixed(2)));

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Database stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
