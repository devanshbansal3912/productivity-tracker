import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const { date } = body; // e.g., '2026-02-15'

        if (!date) {
            return NextResponse.json({ error: 'date is required' }, { status: 400 });
        }

        // 1. Check if completion already exists for this date
        const { data: existing, error: checkError } = await supabase
            .from('daily_task_completions')
            .select('id')
            .eq('daily_task_id', id)
            .eq('completion_date', date)
            .single();

        // 2. Toggle logic
        if (existing) {
            // Delete it (Undo)
            const { error: deleteError } = await supabase
                .from('daily_task_completions')
                .delete()
                .eq('id', existing.id);

            if (deleteError) throw deleteError;
            return NextResponse.json({ success: true, action: 'removed' });
        } else {
            // Insert it (Complete)
            const { data: newCompletion, error: insertError } = await supabase
                .from('daily_task_completions')
                .insert([{ daily_task_id: id, completion_date: date }])
                .select()
                .single();

            if (insertError) throw insertError;
            return NextResponse.json({ success: true, action: 'added', completion: newCompletion });
        }

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
