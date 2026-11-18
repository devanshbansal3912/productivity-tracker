import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('daily_tasks')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const mappedData = (data || []).map(t => ({
            ...t,
            name: t.task_name // Map for frontend compatibility
        }));

        return NextResponse.json({ daily_tasks: mappedData });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'name is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('daily_tasks')
            .insert([{ task_name: name, description }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ daily_task: data });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
