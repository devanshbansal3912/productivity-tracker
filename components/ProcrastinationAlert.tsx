'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

interface ProcrastinationTask {
    task_id: string;
    task_name: string;
    times_postponed: number;
    original_date: string;
    current_date: string;
}

export default function ProcrastinationAlert() {
    const [tasks, setTasks] = useState<ProcrastinationTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics/procrastination')
            .then(r => r.json())
            .then(data => {
                setTasks(data.procrastinated_tasks || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching procrastination data:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return null;

    if (tasks.length === 0) {
        return (
            <div style={{
                background: '#121212', borderRadius: 16, border: '1px solid #1f1f1f',
                padding: '20px', textAlign: 'center', color: '#737373', fontSize: 13,
                animation: 'fadeIn 0.5s ease'
            }}>
                ✅ No procrastination detected
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            borderRadius: 16,
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: 24,
            animation: 'fadeIn 0.5s ease',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#ef4444' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                    PROCRASTINATION ALERT
                </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {tasks.map((task, i) => (
                    <div key={i} style={{ borderBottom: i < tasks.length - 1 ? '1px solid #1f1f1f' : 'none', paddingBottom: i < tasks.length - 1 ? 16 : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>📌 "{task.task_name}"</div>
                            <div style={{ fontSize: 11, fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: 4 }}>
                                Moved {task.times_postponed} times
                            </div>
                        </div>
                        <div style={{ fontSize: 13, color: '#a3a3a3' }}>
                            Originally: <span style={{ textDecoration: 'line-through' }}>{format(parseISO(task.original_date), 'Feb d')}</span> → Now: <span style={{ color: '#ef4444', fontWeight: 600 }}>{format(parseISO(task.current_date), 'Feb d')}</span>
                        </div>
                    </div>
                ))}

                <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.1)', marginTop: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>💡 Suggestion</div>
                    <p style={{ fontSize: 12, color: '#a3a3a3', margin: 0, lineHeight: 1.5 }}>
                        Break it into smaller tasks or schedule a 2-hour focus block.
                    </p>
                </div>
            </div>
        </div>
    );
}
