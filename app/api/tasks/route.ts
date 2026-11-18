import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/tasks - Fetch all tasks
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tasks: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, task_name, description, duration, estimated_duration, deadline, due_date, priority } = body;

    const nameToUse = title || task_name;
    const dateToUse = deadline || due_date;
    const durationToUse = duration || estimated_duration;

    if (!nameToUse) {
      return NextResponse.json(
        { error: 'task_name (or title) is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        task_name: nameToUse,
        description,
        estimated_duration: durationToUse,
        due_date: dateToUse,
        priority: priority || 'medium',
        completed: false,
        completed_at: null
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ task: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}