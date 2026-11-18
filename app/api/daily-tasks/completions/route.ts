import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let query = supabase.from('daily_task_completions').select('*');

        if (startDate) {
            query = query.gte('completion_date', startDate);
        }
        if (endDate) {
            query = query.lte('completion_date', endDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ completions: data || [] });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
