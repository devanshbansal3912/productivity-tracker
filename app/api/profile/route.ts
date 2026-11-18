import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/profile - Get user profile (level, XP, gold)
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('user_profile')
            .select('*')
            .single();

        if (error) throw error;

        return NextResponse.json({ profile: data });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
