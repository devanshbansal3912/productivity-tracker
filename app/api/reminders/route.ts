import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/reminders - fetch all incomplete + today's reminders, carry forward overdue ones
export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Carry forward any overdue incomplete reminders
        const { data: overdue } = await supabase
            .from('reminders')
            .select('*')
            .eq('completed', false)
            .lt('due_date', today);

        if (overdue && overdue.length > 0) {
            for (const reminder of overdue) {
                const newCarriedDays = reminder.carried_days + 1;
                const newXPPenalty = reminder.xp_penalty * 2;
                const newGoldPenalty = reminder.gold_penalty * 2;

                // Deduct penalty from user profile
                const { data: profile } = await supabase
                    .from('user_profile')
                    .select('*')
                    .single();

                if (profile) {
                    await supabase
                        .from('user_profile')
                        .update({
                            current_xp: Math.max(0, profile.current_xp - reminder.xp_penalty),
                            total_gold: Math.max(0, profile.total_gold - reminder.gold_penalty),
                        })
                        .eq('id', profile.id);
                }

                // Update reminder: carry forward to today, increase penalty
                await supabase
                    .from('reminders')
                    .update({
                        due_date: today,
                        carried_days: newCarriedDays,
                        xp_penalty: newXPPenalty,
                        gold_penalty: newGoldPenalty,
                    })
                    .eq('id', reminder.id);
            }
        }

        // Now fetch all incomplete reminders (due today or earlier)
        const { data, error } = await supabase
            .from('reminders')
            .select('*')
            .eq('completed', false)
            .lte('due_date', today)
            .order('carried_days', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ reminders: data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/reminders - create a new reminder
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, xp_reward = 30, gold_reward = 15 } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title required' }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('reminders')
            .insert([{
                title,
                xp_reward,
                gold_reward,
                xp_penalty: 10,
                gold_penalty: 5,
                created_date: today,
                due_date: today,
                carried_days: 0,
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ reminder: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
