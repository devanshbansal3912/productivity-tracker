
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WeeklySummaryData {
    week_range: string;
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    streak: number;
    trend: 'up' | 'down' | 'stable';
    trend_change: number;
    total_focus_time: number;
    daily_breakdown: Array<{
        date: string;
        day_name: string;
        completed: number;
        total: number;
    }>;
}

export default function WeeklySummary() {
    const [data, setData] = useState<WeeklySummaryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics/weekly-summary')
            .then(r => r.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching weekly summary:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{
                background: '#121212',
                borderRadius: 16,
                border: '1px solid #1f1f1f',
                padding: '24px',
                textAlign: 'center',
                color: '#737373',
                fontSize: 13
            }}>
                Loading weekly overview...
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{
                background: '#121212',
                borderRadius: 16,
                border: '1px solid #1f1f1f',
                padding: '24px',
                textAlign: 'center',
                color: '#737373',
                fontSize: 13
            }}>
                No data available yet. Add some tasks to see insights!
            </div>
        );
    }

    const focusHours = Math.floor(data.total_focus_time / 60);
    const focusMinutes = data.total_focus_time % 60;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(145deg, #121212 0%, #0d0d0d 100%)',
                borderRadius: 16,
                border: '1px solid #1f1f1f',
                padding: 24,
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                    WEEKLY OVERVIEW - {data.week_range}
                </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                {/* Completion Rate */}
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid #1f1f1f' }}>
                    <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Completion Rate</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', fontFamily: '"JetBrains Mono", monospace' }}>
                            {data.completion_rate}%
                        </span>
                    </div>
                    <div style={{ height: 3, background: '#1f1f1f', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.completion_rate}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ height: '100%', background: '#10b981' }}
                        />
                    </div>
                </div>

                {/* Streak */}
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid #1f1f1f' }}>
                    <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Streak</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', fontFamily: '"JetBrains Mono", monospace' }}>
                            {data.streak}
                        </span>
                        <span style={{ fontSize: 12, color: '#737373' }}>🔥</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#525252', marginTop: 8 }}>consecutive days</div>
                </div>

                {/* Focus Time */}
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid #1f1f1f' }}>
                    <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Focus Time</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', fontFamily: '"JetBrains Mono", monospace' }}>
                            {focusHours}h {focusMinutes}m
                        </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 8 }}>
                        {data.trend === 'up' && '↗️ Up ' + data.trend_change + '%'}
                        {data.trend === 'down' && '↘️ Down ' + Math.abs(data.trend_change) + '%'}
                        {data.trend === 'stable' && '↔️ Stable'}
                    </div>
                </div>
            </div>

            {/* Daily Breakdown */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1f1f1f' }}>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12 }}>Daily Breakdown</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {data.daily_breakdown.map((day) => (
                        <div
                            key={day.date}
                            style={{
                                padding: '8px 12px',
                                background: day.total > 0 && day.completed === day.total ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                                border: '1px solid ' + (day.total > 0 && day.completed === day.total ? '#10b981' : '#1f1f1f'),
                                borderRadius: 8,
                                fontSize: 11,
                                color: day.total > 0 && day.completed === day.total ? '#10b981' : '#737373'
                            }}
                        >
                            <div style={{ fontWeight: 600 }}>{day.day_name}</div>
                            <div style={{ fontSize: 10, marginTop: 4 }}>
                                {day.total > 0 ? `${day.completed}/${day.total}` : '-'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1f1f1f', fontSize: 12, color: '#737373' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>{data.completed_tasks}/{data.total_tasks}</span> tasks completed this week
            </div>
        </motion.div>
    );
}