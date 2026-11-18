import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const { data: reminder, error: reminderError } = await supabase
            .from('reminders')
            .select('*')
            .eq('id', id)
            .single();

        if (reminderError) throw reminderError;
        if (reminder.completed) {
            return NextResponse.json({ error: 'Already completed' }, { status: 400 });
        }

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profile')
            .select('*')
            .single();

        if (profileError) throw profileError;

        // Award XP and Gold
        const newXP = profile.current_xp + reminder.xp_reward;
        const newGold = profile.total_gold + reminder.gold_reward;

        await supabase
            .from('user_profile')
            .update({ current_xp: newXP, total_gold: newGold })
            .eq('id', profile.id);

        // Mark reminder complete
        await supabase
            .from('reminders')
            .update({ completed: true, completed_at: new Date().toISOString() })
            .eq('id', id);

        return NextResponse.json({
            success: true,
            xp_earned: reminder.xp_reward,
            gold_earned: reminder.gold_reward,
            carried_days: reminder.carried_days,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
