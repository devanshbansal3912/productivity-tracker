import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    let query = supabase
        .from('daily_goals')
        .select('*')
        .order('created_at', { ascending: true });

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ goals: data });
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { date, goal_text } = body;

    if (!date || !goal_text) {
        return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
        );
    }

    // Check max 3 goals per day
    const { count } = await supabase
        .from('daily_goals')
        .select('*', { count: 'exact', head: true })
        .eq('date', date);

    if (count && count >= 3) {
        return NextResponse.json(
            { error: 'Maximum 3 goals per day' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('daily_goals')
        .insert([{ date, goal_text, completed: false }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, goal: data });
}
