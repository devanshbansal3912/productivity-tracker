import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    let query = supabase
        .from('activities')
        .select('*')
        .order('start_time', { ascending: true });

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activities: data });
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { date, start_time, end_time, title, category } = body;

    // Validation
    if (!date || !start_time || !end_time || !title || !category) {
        return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
        );
    }

    if (start_time >= end_time) {
        return NextResponse.json(
            { error: 'End time must be after start time' },
            { status: 400 }
        );
    }

    const validCategories = ['deep_work', 'work', 'personal', 'health', 'distraction', 'rest'];
    if (!validCategories.includes(category)) {
        return NextResponse.json(
            { error: 'Invalid category' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('activities')
        .insert([{ date, start_time, end_time, title, category }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, activity: data });
}
