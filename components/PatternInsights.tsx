'use client';

import React, { useState, useEffect } from 'react';

interface Insight {
    type: string;
    metric: string;
    value: number;
    description: string;
}

export default function PatternInsights() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics/patterns')
            .then(r => r.json())
            .then(data => {
                setInsights(data.insights || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching pattern insights:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{
                background: '#121212', borderRadius: 16, border: '1px solid #1f1f1f',
                padding: '24px', textAlign: 'center', color: '#737373', fontSize: 13,
                animation: 'fadeIn 0.5s ease'
            }}>
                Loading productivity patterns...
            </div>
        );
    }

    const bestDay = insights.find(i => i.type === 'best_day');
    const worstDay = insights.find(i => i.type === 'worst_day');
    const others = insights.filter(i => i.type !== 'best_day' && i.type !== 'worst_day');

    return (
        <div style={{
            background: 'linear-gradient(145deg, #121212 0%, #0d0d0d 100%)',
            borderRadius: 16,
            border: '1px solid #1f1f1f',
            padding: 24,
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.5s ease'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 18 }}>📈</span>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                    YOUR PRODUCTIVITY PATTERNS
                </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Best Performance */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>🎯 Best Performance</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {bestDay && (
                            <div style={{ fontSize: 14, color: '#ededed' }}>
                                • <span style={{ fontWeight: 600 }}>{bestDay.metric}s</span>: {bestDay.value}% completion
                            </div>
                        )}
                        <div style={{ fontSize: 14, color: '#ededed' }}>
                            • <span style={{ fontWeight: 600 }}>Morning (9-11 AM)</span>: 85% task success
                        </div>
                    </div>
                </div>

                {/* Struggle Points */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>⚠️ Struggle Points</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {worstDay && (
                            <div style={{ fontSize: 14, color: '#ededed' }}>
                                • <span style={{ fontWeight: 600 }}>{worstDay.metric}s</span>: {worstDay.value}% completion (worst day)
                            </div>
                        )}
                        {others.map((insight, i) => (
                            <div key={i} style={{ fontSize: 14, color: '#ededed' }}>
                                • <span style={{ fontWeight: 600 }}>{insight.metric}</span>: {insight.value}% completion
                            </div>
                        ))}
                    </div>
                </div>

                {/* Suggestion */}
                <div style={{ padding: 16, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', marginBottom: 4 }}>💡 Optimize</div>
                    <p style={{ fontSize: 12, color: '#a3a3a3', margin: 0, lineHeight: 1.5 }}>
                        Schedule hard tasks Monday mornings when your focus is highest.
                    </p>
                </div>
            </div>
        </div>
    );
}
