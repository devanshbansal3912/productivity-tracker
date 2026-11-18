'use client';

import { useState, useEffect } from "react";
import * as THREE from "three";
import { startOfWeek, endOfWeek, format, isSameDay } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import WeeklySummary from "@/components/WeeklySummary";
import PatternInsights from "./PatternInsights";
import ProcrastinationAlert from "./ProcrastinationAlert";

type Habit = {
    id: string;
    name: string;
    color: string;
};

type Task = {
    id: string;
    title: string;
    description?: string;
    deadline: string;
    priority: "high" | "medium" | "low";
    done: boolean;
};

const today = new Date();
const todayStr = format(today, "yyyy-MM-dd");

// Monday to Sunday logic
const weekStart = startOfWeek(today, { weekStartsOn: 1 });
const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
const weekStartStr = format(weekStart, "yyyy-MM-dd");
const weekEndStr = format(weekEnd, "yyyy-MM-dd");
const weeklyRangeLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`;

// HABITS and INITIAL_TASKS moved to database

const TABS = ["Overview", "Habits", "Tasks", "Analytics", "Database"];

export default function HybridPlanner() {
    const [tab, setTab] = useState("Overview");
    const [completions, setCompletions] = useState<Record<string, Record<number, boolean>>>({});
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState<{ title: string; description: string; deadline: string; priority: "high" | "medium" | "low" }>({ title: "", description: "", deadline: todayStr, priority: "medium" });
    const [showAddTask, setShowAddTask] = useState(false);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingHabit, setEditingHabit] = useState<any | null>(null);
    const [showHabitModal, setShowHabitModal] = useState(false);
    const [newHabitName, setNewHabitName] = useState("");
    const [dbStats, setDbStats] = useState<any>(null);
    const [dbLoading, setDbLoading] = useState(false);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        fetchAllData();
        if (sessionStorage.getItem('app-loaded')) {
            setIsLoaded(true);
            setLoadingProgress(100);
        }
    }, []);

    async function fetchAllData() {
        setLoading(true);
        try {
            await Promise.all([fetchTasks(), fetchDailyTasks(), fetchCompletions()]);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data from Supabase');
        } finally {
            setLoading(false);
        }
    }

    async function fetchTasks() {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        const mappedTasks = (data.tasks || []).map((t: any) => ({
            id: t.id,
            title: t.task_name,
            description: t.description,
            deadline: t.due_date || todayStr,
            priority: t.priority || 'medium',
            done: t.completed
        }));
        setTasks(mappedTasks);
    }

    async function fetchDailyTasks() {
        const res = await fetch('/api/daily-tasks');
        const data = await res.json();
        const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
        const mappedHabits = (data.daily_tasks || []).map((h: any, i: number) => ({
            id: h.id,
            name: h.name || h.task_name,
            color: h.color || colors[i % colors.length]
        }));
        setHabits(mappedHabits);
    }

    async function fetchCompletions() {
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const res = await fetch(`/api/daily-tasks/completions?year=${year}&month=${month}`);
        const data = await res.json();

        // Convert flat array to Record<habitId, Record<day, boolean>>
        const completionsMap: Record<string, Record<number, boolean>> = {};
        (data.completions || []).forEach((c: any) => {
            const hId = c.daily_task_id;
            const day = new Date(c.completion_date).getDate();
            if (!completionsMap[hId]) completionsMap[hId] = {};
            completionsMap[hId][day] = true;
        });
        setCompletions(completionsMap);
    }

    async function fetchDbStats() {
        setDbLoading(true);
        try {
            const res = await fetch('/api/settings/database-stats');
            const data = await res.json();
            setDbStats(data);
        } catch (error) {
            console.error('Error fetching db stats:', error);
            toast.error('Failed to load database stats');
        } finally {
            setDbLoading(false);
        }
    }

    useEffect(() => {
        if (tab === "Database") {
            fetchDbStats();
        }
    }, [tab]);

    const [showAnalytics, setShowAnalytics] = useState(true);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [big, setBig] = useState(false);

    // Cinematic Layer 6: Preloader State
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [initStatus, setInitStatus] = useState("Initializing core heartbeat...");
    const [isLoaded, setIsLoaded] = useState(false);
    const [showApp, setShowApp] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        const startTime = Date.now();
        const minDuration = 2800; // 2.8s minimum

        const statuses = [
            "Initializing core heartbeat...",
            "Synchronizing task state...",
            "Orchestrating UI components...",
            "Synchronized."
        ];

        let statusIdx = 0;
        const statusInterval = setInterval(() => {
            if (statusIdx < statuses.length - 1) {
                statusIdx++;
                setInitStatus(statuses[statusIdx]);
            }
        }, 800);

        const timer = setInterval(() => {
            setLoadingProgress(prev => {
                const timeElapsed = Date.now() - startTime;
                const progressByTime = Math.min((timeElapsed / minDuration) * 100, 100);

                if (timeElapsed >= minDuration && !loading) {
                    clearInterval(timer);
                    clearInterval(statusInterval);
                    setInitStatus("Synchronized.");
                    setTimeout(() => setIsLoaded(true), 200);
                    return 100;
                }

                // Mix random walk with time progress for "realistic" feel
                const randomBoost = Math.floor(Math.random() * 5);
                return Math.min(Math.max(prev + randomBoost, progressByTime), 99);
            });
        }, 50);

        return () => {
            clearInterval(timer);
            clearInterval(statusInterval);
        };
    }, [loading]);

    useEffect(() => {
        const lenis = new Lenis();
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Sync GSAP with Lenis
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.lagSmoothing(0);

        return () => {
            lenis.destroy();
        };
    }, []);

    // Cinematic Layer 4: Scroll Reveals (GSAP Upgrade)
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        // Slight delay to ensure DOM is ready after tab transition
        const timer = setTimeout(() => {
            ScrollTrigger.getAll().forEach(t => t.kill()); // Kill previous triggers

            gsap.utils.toArray(".reveal").forEach((el: any) => {
                gsap.from(el, {
                    opacity: 0,
                    y: 20,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 95%",
                        toggleActions: "play none none none"
                    }
                });
            });
            ScrollTrigger.refresh();
        }, 300); // 300ms to match tab transition

        return () => clearTimeout(timer);
    }, [tab, showAnalytics, isLoaded]);

    // Cinematic Layer 5: Custom Cursor tracking
    useEffect(() => {
        const handleMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
        const handleOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const style = window.getComputedStyle(target);
            if (
                style.cursor === 'pointer' ||
                target.tagName === 'BUTTON' ||
                target.tagName === 'INPUT' ||
                target.closest('button') ||
                target.closest('.hover-scale') ||
                target.closest('.tab-btn')
            ) {
                setBig(true);
            } else {
                setBig(false);
            }
        };
        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseover", handleOver);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseover", handleOver);
        };
    }, []);


    // Cinematic Layer 1: Vanta.js Background
    useEffect(() => {
        let vantaEffect: any = null;
        if (typeof window !== "undefined") {
            // @ts-ignore
            import("vanta/dist/vanta.net.min").then((NET) => {
                vantaEffect = NET.default({
                    el: "#vanta-bg",
                    THREE: THREE,
                    color: 0x10b981,
                    backgroundColor: 0x0a0a0a,
                    points: 8,
                    maxDistance: 20,
                    spacing: 18,
                    mouseControls: true,
                });
            });
        }
        return () => {
            if (vantaEffect) vantaEffect.destroy();
        };
    }, []);

    // Midnight Auto-Reset Logic
    useEffect(() => {
        const checkMidnight = setInterval(() => {
            const now = new Date();
            // If it's exactly midnight (or within the first minute of the new day), and we haven't already reset
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                // Clear the habits for the *new* today, leaving past days intact
                const newDay = now.getDate();
                setCompletions(prev => {
                    const next = { ...prev };
                    Object.keys(next).forEach(habitId => {
                        if (next[habitId]) {
                            next[habitId][newDay] = false;
                        }
                    });
                    return next;
                });
                toast('A new day begins. Daily tasks reset!', { icon: '🌅', style: { background: '#1e1b4b', color: '#fff' } });
            }
        }, 60000); // Check every minute

        return () => clearInterval(checkMidnight);
    }, []);

    function getDaysInMonth(year: number, month: number) {
        return new Date(year, month + 1, 0).getDate();
    }

    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const monthName = today.toLocaleString("default", { month: "long" });

    const toggleHabit = async (habitId: string, date: number) => {
        const dateStr = format(new Date(today.getFullYear(), today.getMonth(), date), 'yyyy-MM-dd');
        const res = await fetch(`/api/daily-tasks/${habitId}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr })
        });

        if (res.ok) {
            fetchCompletions();
        }
    };

    const toggleTask = async (id: string) => {
        const taskToToggle = tasks.find(t => t.id === id);
        if (taskToToggle?.done) return;

        const res = await fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: true })
        });

        if (res.ok) {
            toast.success("Task completed!", {
                style: { background: '#22c55e', color: '#fff', borderRadius: '8px' },
                iconTheme: { primary: '#fff', secondary: '#22c55e' }
            });
            fetchTasks();
        }
    };

    const addTask = async () => {
        if (!newTask.title.trim()) {
            toast.error("Please enter a task title", { style: { background: '#ef4444', color: '#fff' } });
            return;
        }

        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newTask.title,
                description: newTask.description,
                deadline: newTask.deadline,
                priority: newTask.priority
            })
        });

        if (res.ok) {
            toast.success("Task added", { style: { background: '#333', color: '#fff' }, icon: '📝' });
            setNewTask({ title: "", description: "", deadline: todayStr, priority: "medium" });
            setShowAddTask(false);
            fetchTasks();
        }
    };

    const deleteTask = async (id: string) => {
        const res = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            toast("Task deleted", { icon: '🗑️', style: { background: '#333', color: '#fff' } });
            fetchTasks();
        }
    };

    const handleSaveHabit = async () => {
        if (!newHabitName.trim()) return;

        const res = await fetch('/api/daily-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newHabitName,
                description: ''
            })
        });

        if (res.ok) {
            setNewHabitName("");
            setEditingHabit(null);
            setShowHabitModal(false);
            fetchDailyTasks();
        }
    };

    const deleteHabit = async (id: string) => {
        const res = await fetch(`/api/daily-tasks/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            fetchDailyTasks();
            setEditingHabit(null);
            setShowHabitModal(false);
        }
    };

    // Export to CSV
    const exportData = () => {
        let csv = "ID,Title,Description,Deadline,Priority,Status\n";
        tasks.forEach(t => {
            const desc = t.description ? `"${t.description.replace(/"/g, '""')}"` : "";
            csv += `${t.id},"${t.title.replace(/"/g, '""')}",${desc},${t.deadline},${t.priority},${t.done ? 'Completed' : 'Pending'}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `productivity_data_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Data exported successfully", { style: { background: '#3b82f6', color: '#fff' } });
    };

    // Stats
    const totalCells = habits.length * today.getDate();
    const totalHabitsDone = habits.reduce((acc, h) => {
        return acc + Object.values(completions[h.id] || {}).filter(Boolean).length;
    }, 0);
    const overallHabitRate = totalCells > 0 ? Math.round((totalHabitsDone / totalCells) * 100) : 0;

    const overdueTasks = tasks.filter((t) => !t.done && t.deadline < todayStr);
    const todayTasks = tasks.filter((t) => t.deadline === todayStr);
    const pendingTasks = tasks.filter((t) => !t.done);
    const doneTasks = tasks.filter((t) => t.done);

    const todayTasksDone = todayTasks.filter(t => t.done).length;

    // Streak
    const getStreak = (habitId: string) => {
        let streak = 0;
        for (let d = today.getDate(); d >= 1; d--) {
            if (completions[habitId]?.[d]) streak++;
            else break;
        }
        return streak;
    };

    const priorityColor = { high: "#ef4444", medium: "#f59e0b", low: "#6366f1" };

    return (
        <div style={{
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            background: "#0a0a0a",
            minHeight: "100vh",
            color: "#ededed"
        }}>
            {/* Global Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@200;400&family=Playfair+Display:wght@400;700&display=swap');
                
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hover-scale { transition: transform 0.15s ease, filter 0.15s ease; }
                .hover-scale:hover { transform: scale(1.15); filter: brightness(1.2); }
                .tab-btn { transition: all 0.2s ease; position: relative; }
                .tab-btn::after {
                    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
                    background: transparent; transition: background 0.2s ease;
                }
                .tab-btn.active::after { background: #fff; }
                /* Resilient reveal: starts visible, GSAP handles the hide/show */
                .reveal { opacity: 1; }
                * { cursor: none !important; user-select: none; }
                input, textarea, [contenteditable="true"] { cursor: text !important; user-select: text; }
                @keyframes loaderExit {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-100%); visibility: hidden; }
                }
                .loader-exit { animation: loaderExit 1s cubic-bezier(0.85, 0, 0.15, 1) forwards; }

                html.lenis { height: auto; }
                .lenis.lenis-smooth { scroll-behavior: auto !important; }
                .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
                .lenis.lenis-stopped { overflow: hidden; }
                .lenis.lenis-scrolling iframe { pointer-events: none; }
                
                .task-item:hover .hover-delete { visibility: visible !important; opacity: 1; }
                .hover-delete { transition: opacity 0.2s ease; opacity: 0; cursor: pointer; }
                .hover-delete:hover { color: #ef4444 !important; }

                @keyframes loader-pulse {
                    0% { transform: scale(1); opacity: 0.3; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                .loader-pulse { animation: loader-pulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
                @keyframes shimmer {
                    0% { transform: translateX(-150%); }
                    100% { transform: translateX(250%); }
                }
            `}} />

            {/* Cinematic Layer 6: Preloader Overlay */}
            {/* Cinematic Layer 6: Premium Preloader Overlay */}
            {!showApp && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "#000", zIndex: 100000,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    color: "#fff",
                    overflow: "hidden",
                    opacity: isLoaded && prefersReducedMotion ? 0 : 1,
                    transition: prefersReducedMotion ? "opacity 0.8s ease" : "none"
                }}>
                    {/* Split Curtains */}
                    {!prefersReducedMotion && (
                        <>
                            <div style={{
                                position: "absolute",
                                left: 0, top: 0,
                                width: "100%", height: "100%",
                                background: "#000",
                                zIndex: -1,
                                transform: isLoaded
                                    ? (window.innerWidth < 768 ? "translateY(-100%)" : "translateX(-100%)")
                                    : "translateY(0)",
                                transition: "transform 1.1s cubic-bezier(0.85, 0, 0.15, 1)",
                                clipPath: window.innerWidth < 768
                                    ? "inset(0 0 50% 0)"
                                    : "inset(0 50% 0 0)"
                            }} />
                            <div style={{
                                position: "absolute",
                                left: 0, top: 0,
                                width: "100%", height: "100%",
                                background: "#000",
                                zIndex: -1,
                                transform: isLoaded
                                    ? (window.innerWidth < 768 ? "translateY(100%)" : "translateX(100%)")
                                    : "translateY(0)",
                                transition: "transform 1.1s cubic-bezier(0.85, 0, 0.15, 1)",
                                clipPath: window.innerWidth < 768
                                    ? "inset(50% 0 0 0)"
                                    : "inset(0 0 0 50%)"
                            }} onTransitionEnd={() => setShowApp(true)} />
                        </>
                    )}

                    {/* Loader Content */}
                    <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
                        opacity: isLoaded ? 0 : 1,
                        transition: "opacity 0.4s ease",
                        zIndex: 1
                    }}>
                        {/* Premium SVG Pulsing Ring */}
                        <div style={{ position: "relative", width: 80, height: 80 }}>
                            <svg width="80" height="80" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                <circle
                                    className="loader-ring"
                                    cx="50" cy="50" r="45"
                                    fill="none" stroke="#fff" strokeWidth="1"
                                    strokeDasharray="283"
                                    strokeDashoffset={283 - (283 * loadingProgress) / 100}
                                    style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.3s ease" }}
                                />
                                <circle
                                    className="loader-pulse"
                                    cx="50" cy="50" r="45"
                                    fill="none" stroke="#fff" strokeWidth="0.5"
                                    style={{ opacity: 0.3 }}
                                />
                            </svg>
                            <div style={{
                                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                                fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#fff", opacity: 0.8
                            }}>
                                {loadingProgress}%
                            </div>
                        </div>

                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                                letterSpacing: "2px", color: "#fff", textTransform: "uppercase",
                                marginBottom: 8, opacity: 0.9
                            }}>
                                {initStatus}
                            </div>
                            <div style={{ width: 120, height: 1, background: "rgba(255,255,255,0.1)", margin: "0 auto", position: "relative", overflow: "hidden" }}>
                                <div style={{
                                    position: "absolute", left: 0, top: 0, height: "100%", width: "40%",
                                    background: "#fff", animation: "shimmer 2s infinite linear"
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main App Container - Guarded by FOUC check */}
            <div style={{
                visibility: showApp || (isLoaded && prefersReducedMotion) ? "visible" : "hidden",
                opacity: showApp || (isLoaded && prefersReducedMotion) ? 1 : 0,
                transition: "opacity 0.5s ease"
            }}>


                {/* Cinematic Layer 5: Custom Cursor render */}
                <div style={{
                    position: "fixed",
                    left: pos.x, top: pos.y,
                    width: big ? 40 : 12,
                    height: big ? 40 : 12,
                    borderRadius: "50%",
                    background: "rgba(16,185,129,0.3)",
                    pointerEvents: "none",
                    transform: "translate(-50%,-50%)",
                    transition: "width 0.2s, height 0.2s",
                    zIndex: 9999,
                }} />

                <div id="vanta-bg" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.12, pointerEvents: "none", zIndex: 0 }} />
                <Toaster position="bottom-right" reverseOrder={false} />
                {/* Header */}
                <div style={{
                    background: "rgba(10, 10, 10, 0.8)",
                    backdropFilter: "blur(12px)",
                    borderBottom: "1px solid #1f1f1f",
                    padding: "0 24px",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    overflow: "hidden"
                }}>
                    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>

                        {/* Cinematic Layer 3: Spline 3D Orb */}
                        {/* <!-- Replace with your specific Spline URL --> */}
                        <iframe
                            src='https://my.spline.design/yoursceneurl/'
                            style={{
                                position: "absolute", right: -50, top: -100,
                                width: "300px", height: "300px", border: "none", pointerEvents: "none",
                                zIndex: 0, opacity: 0.6
                            }}
                        />

                        <div style={{ padding: "16px 0", position: "relative", zIndex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px", color: "#fff" }}>Daily Planner</div>
                            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                                {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                            {TABS.map((t) => (
                                <button key={t} onClick={() => setTab(t)} className={`tab-btn ${tab === t ? "active" : ""}`} style={{
                                    padding: "8px 14px",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    background: "transparent",
                                    color: tab === t ? "#fff" : "#737373",
                                    transition: "color 0.2s ease",
                                }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 100px 24px" }}>
                    {loading ? (
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            padding: "100px 0", color: "#737373"
                        }}>
                            <div style={{
                                width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)",
                                borderTopColor: "#fff", borderRadius: "50%",
                                animation: "spin 1s linear infinite", marginBottom: 16
                            }} />
                            <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
                            <div style={{ fontSize: 14 }}>Loading your tasks...</div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={tab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {/* OVERVIEW TAB */}
                                {tab === "Overview" && (
                                    <div style={{ position: "relative", zIndex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 20, color: "#fff" }}>Overview</div>
                                        <div style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                            gap: 16,
                                            marginBottom: 32
                                        }}>
                                            {[
                                                { label: "Today's Tasks", value: `${todayTasksDone}/${todayTasks.length}`, icon: "🎯", color: "#3b82f6" },
                                                { label: "Completion Rate", value: `${overallHabitRate}%`, icon: "📈", color: "#10b981" },
                                                { label: "Pending Tasks", value: pendingTasks.length, icon: "⏳", color: "#f59e0b" },
                                                { label: "Overdue", value: overdueTasks.length, icon: "⚠️", color: "#ef4444" }
                                            ].map((stat) => (
                                                <div key={stat.label} className="reveal" style={{
                                                    background: "#121212",
                                                    padding: 20,
                                                    borderRadius: 12,
                                                    border: "1px solid #1f1f1f",
                                                    borderLeft: `4px solid ${stat.color}`,
                                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)"
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                                        <span>{stat.icon}</span>
                                                        <div style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>{stat.label}</div>
                                                    </div>
                                                    <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "start" }}>

                                            {/* Daily Tasks (Predefined Habits) */}
                                            <div className="reveal" style={{
                                                background: "linear-gradient(145deg, #121212 0%, #0d0d0d 100%)",
                                                borderRadius: 16, border: "1px solid #1f1f1f", padding: "24px",
                                                transition: "transform 0.2s ease, border-color 0.2s ease",
                                                boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>Daily Tasks</div>
                                                    </div>
                                                    <button onClick={() => { setEditingHabit(null); setNewHabitName(""); setShowHabitModal(true); }} style={{
                                                        background: "rgba(255,255,255,0.05)", border: "1px solid #333", color: "#ededed",
                                                        borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600
                                                    }}>+ New</button>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                    {habits.map((h) => {
                                                        const done = completions[h.id]?.[today.getDate()];
                                                        return (
                                                            <div key={h.id} className="hover-scale" style={{
                                                                display: "flex", alignItems: "center", gap: 12,
                                                                padding: "12px 14px", borderRadius: 10,
                                                                background: done ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                                                                border: `1px solid ${done ? "transparent" : "#1f1f1f"}`,
                                                                cursor: "pointer",
                                                                position: "relative"
                                                            }} onClick={() => toggleHabit(h.id, today.getDate())}>
                                                                <div style={{
                                                                    width: 28, height: 28, borderRadius: 8,
                                                                    background: done ? h.color : "transparent",
                                                                    border: `2px solid ${done ? h.color : "#333"}`,
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    flexShrink: 0,
                                                                    boxShadow: done ? `0 0 12px ${h.color}40` : "none"
                                                                }}>
                                                                    {done && <span style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>✓</span>}
                                                                </div>
                                                                <span style={{ fontSize: 13, fontWeight: 500, flex: 1, textDecoration: done ? "line-through" : "none", color: done ? "#525252" : "#ededed" }}>{h.name}</span>
                                                                <span style={{ fontSize: 11, color: done ? "#404040" : "#737373", fontWeight: 600 }}>🔥 {getStreak(h.id)}</span>
                                                                <div onClick={(e) => { e.stopPropagation(); setEditingHabit(h); setNewHabitName(h.name); setShowHabitModal(true); }} style={{ padding: 4, visibility: "hidden", color: "#666", fontSize: 10 }} className="hover-delete">Edit</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Today's Tasks */}
                                            <div className="reveal" style={{
                                                background: "linear-gradient(145deg, #121212 0%, #0d0d0d 100%)",
                                                borderRadius: 16, border: "1px solid #1f1f1f", padding: "24px",
                                                boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>Today's Tasks</div>
                                                    </div>
                                                    <button onClick={() => { setTab("Tasks"); setShowAddTask(true); }} style={{
                                                        background: "rgba(255,255,255,0.05)", border: "1px solid #333", color: "#ededed",
                                                        borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600,
                                                        transition: "all 0.2s ease"
                                                    }}>+ Add Task</button>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                    {(() => {
                                                        const shownTasks = [...overdueTasks, ...todayTasks.filter(t => !overdueTasks.includes(t))];
                                                        if (shownTasks.length === 0) return (
                                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", opacity: 0.8 }}>
                                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                                                <div style={{ fontSize: 14, color: "#a3a3a3", fontWeight: 600 }}>All caught up for today!</div>
                                                            </div>
                                                        );
                                                        return shownTasks.map((t) => {
                                                            const isOverdue = t.deadline < todayStr && !t.done;
                                                            return (
                                                                <div key={t.id} className="task-item" style={{
                                                                    display: "flex", alignItems: "center", gap: 12,
                                                                    padding: "12px 14px", borderRadius: 10,
                                                                    background: t.done ? "rgba(255,255,255,0.02)" : isOverdue ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.05)",
                                                                    border: `1px solid ${t.done ? "transparent" : isOverdue ? "rgba(239,68,68,0.2)" : "#1f1f1f"}`,
                                                                    cursor: "pointer",
                                                                    transition: "all 0.2s ease",
                                                                    position: "relative"
                                                                }} onClick={() => toggleTask(t.id)}>
                                                                    <div style={{
                                                                        width: 20, height: 20, borderRadius: 6,
                                                                        background: t.done ? "#fff" : "transparent",
                                                                        border: `2px solid ${t.done ? "#fff" : "#333"}`,
                                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                                        flexShrink: 0,
                                                                        boxShadow: t.done ? "0 0 12px rgba(255,255,255,0.2)" : "none"
                                                                    }}>
                                                                        {t.done && <span style={{ color: "#000", fontSize: 11, fontWeight: 900 }}>✓</span>}
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontSize: 13, fontWeight: 500, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#525252" : isOverdue ? "#fca5a5" : "#ededed" }}>{t.title}</div>
                                                                        {t.description && <div style={{ fontSize: 11, color: "#666", marginTop: 2, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.description}</div>}
                                                                    </div>
                                                                    {isOverdue && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" }}>Overdue</span>}
                                                                    <div onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }} style={{ padding: 4, visibility: "hidden", color: "#666" }} className="hover-delete">✕</div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>

                                            {/* This week's tasks */}
                                            <div className="reveal" style={{
                                                background: "linear-gradient(145deg, #121212 0%, #0d0d0d 100%)",
                                                borderRadius: 16, border: "1px solid #1f1f1f", padding: "24px",
                                                boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                                        <div style={{ fontWeight: 600, fontSize: 13, color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>This Week</div>
                                                    </div>
                                                    <button onClick={() => { setTab("Tasks"); setShowAddTask(true); setNewTask(prev => ({ ...prev, deadline: weekEndStr })); }} style={{
                                                        background: "rgba(255,255,255,0.05)", border: "1px solid #333", color: "#ededed",
                                                        borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600
                                                    }}>+ Add Task</button>
                                                </div>
                                                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "12px", marginBottom: 16, border: "1px solid #1f1f1f", textAlign: "center" }}>
                                                    <div style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>{weeklyRangeLabel}</div>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                    {(() => {
                                                        const thisWeekTasks = tasks.filter(t => !t.done && t.deadline > todayStr && t.deadline <= weekEndStr).sort((a, b) => a.deadline.localeCompare(b.deadline));
                                                        if (thisWeekTasks.length === 0) return (
                                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", opacity: 0.8 }}>
                                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                                                <div style={{ fontSize: 14, color: "#a3a3a3", fontWeight: 600 }}>No upcoming tasks this week.</div>
                                                            </div>
                                                        );
                                                        return thisWeekTasks.map((t) => {
                                                            return (
                                                                <div key={t.id} className="task-item" style={{
                                                                    display: "flex", alignItems: "center", gap: 12,
                                                                    padding: "10px 10px", borderBottom: "1px solid #1a1a1a",
                                                                    transition: "background 0.2s ease",
                                                                    cursor: "pointer"
                                                                }} onClick={() => toggleTask(t.id)}>
                                                                    <div style={{
                                                                        width: 12, height: 12, borderRadius: "50%", border: `2px solid ${priorityColor[t.priority as keyof typeof priorityColor] || priorityColor.medium}`,
                                                                        cursor: "pointer", flexShrink: 0,
                                                                        boxShadow: `0 0 8px ${priorityColor[t.priority as keyof typeof priorityColor] || priorityColor.medium}40`
                                                                    }} />
                                                                    <span style={{ flex: 1, fontSize: 13, color: "#a3a3a3", fontWeight: 500 }}>{t.title}</span>
                                                                    <span style={{
                                                                        fontSize: 11, padding: "2px 0",
                                                                        color: "#525252",
                                                                        fontWeight: 600,
                                                                        marginRight: 8
                                                                    }}>{format(new Date(t.deadline), "MMM d")}</span>
                                                                    <div onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }}
                                                                        style={{ padding: 4, visibility: "hidden", color: "#666", fontSize: 12 }}
                                                                        className="hover-delete">✕</div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* HABITS TAB */}
                                {tab === "Habits" && (
                                    <div className="reveal" style={{ position: "relative", zIndex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                            <div style={{ fontWeight: 600, fontSize: 16, color: "#fff" }}>{monthName} {year}</div>
                                            <button onClick={() => { setEditingHabit(null); setNewHabitName(""); setShowHabitModal(true); }} style={{
                                                padding: "8px 16px", borderRadius: 6, border: "1px solid #333",
                                                background: "#ededed", color: "#000", cursor: "pointer",
                                                fontWeight: 600, fontSize: 13, transition: "all 0.2s"
                                            }}>+ Add Daily Task</button>
                                        </div>

                                        {habits.length === 0 ? (
                                            <div style={{
                                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                                background: "rgba(255,255,255,0.02)", border: "1px dashed #1f1f1f", borderRadius: 12, padding: "60px 0", textAlign: "center"
                                            }}>
                                                <div style={{ fontSize: 40, marginBottom: 16 }}>🌱</div>
                                                <div style={{ fontSize: 15, fontWeight: 600, color: "#a3a3a3", marginBottom: 4 }}>No daily tasks yet</div>
                                                <div style={{ fontSize: 13, color: "#525252", maxWidth: 300 }}>
                                                    Add tasks you want to do every day, like "Exercise" or "Read", to track your consistency.
                                                </div>
                                                <button onClick={() => { setEditingHabit(null); setNewHabitName(""); setShowHabitModal(true); }} style={{
                                                    marginTop: 20, padding: "8px 24px", borderRadius: 6, background: "rgba(16, 185, 129, 0.1)",
                                                    border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981", fontWeight: 600, fontSize: 13, cursor: "pointer"
                                                }}>+ Create Your First Daily Task</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                {habits.map((h) => {
                                                    const completedDays = Object.values(completions[h.id] || {}).filter(Boolean).length;
                                                    const rate = Math.round((completedDays / today.getDate()) * 100);
                                                    return (
                                                        <div key={h.id} style={{
                                                            background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f",
                                                            padding: "20px", display: "flex", flexDirection: "column",
                                                            position: "relative"
                                                        }}>
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                                                <div
                                                                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                                                                    onClick={() => { setEditingHabit(h); setNewHabitName(h.name); setShowHabitModal(true); }}
                                                                >
                                                                    <div style={{ width: 12, height: 12, borderRadius: 3, background: h.color, boxShadow: `0 0 10px ${h.color}40` }} />
                                                                    <span style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{h.name}</span>
                                                                    <span style={{ fontSize: 10, color: "#444" }}>✎</span>
                                                                </div>
                                                                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#737373" }}>
                                                                    <span>🔥 {getStreak(h.id)}</span>
                                                                    <span style={{ fontWeight: 600, color: h.color }}>{rate}%</span>
                                                                </div>
                                                            </div>
                                                            {/* Grid */}
                                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "auto" }}>
                                                                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                                                                    const done = completions[h.id]?.[day];
                                                                    const isToday = day === today.getDate();
                                                                    const isFuture = day > today.getDate();
                                                                    return (
                                                                        <div
                                                                            key={day}
                                                                            onClick={() => !isFuture && toggleHabit(h.id, day)}
                                                                            title={`${monthName} ${day}`}
                                                                            style={{
                                                                                width: 24, height: 24, borderRadius: 4,
                                                                                background: isFuture ? "#1a1a1a" : done ? h.color : "#262626",
                                                                                border: isToday ? `1px solid ${done ? "#fff" : "#525252"}` : "1px solid transparent",
                                                                                cursor: isFuture ? "default" : "pointer",
                                                                                opacity: isFuture ? 0.3 : done ? 1 : 0.6,
                                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                                fontSize: 10, color: done ? "#fff" : "transparent",
                                                                                transition: "all 0.15s ease",
                                                                                boxShadow: done ? `0 0 8px ${h.color}30` : "none"
                                                                            }}
                                                                        >
                                                                            {isToday && !done ? "•" : done ? "✓" : ""}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TASKS TAB */}
                                {tab === "Tasks" && (
                                    <div className="reveal" style={{ position: "relative", zIndex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                            <div style={{ fontWeight: 600, fontSize: 16, color: "#fff" }}>Tasks</div>
                                            <button onClick={() => setShowAddTask(!showAddTask)} style={{
                                                padding: "8px 16px", borderRadius: 6, border: "1px solid #333",
                                                background: "#ededed", color: "#000", cursor: "pointer",
                                                fontWeight: 600, fontSize: 13, transition: "all 0.2s"
                                            }}>+ Add Task</button>
                                        </div>

                                        {/* Add task form */}
                                        {showAddTask && (
                                            <div style={{
                                                background: "#121212", borderRadius: 12, border: "1px solid #262626",
                                                padding: "16px", marginBottom: 24,
                                                animation: "slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards", transformOrigin: "top"
                                            }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center" }}>
                                                        <input
                                                            placeholder="What needs to be done?"
                                                            value={newTask.title}
                                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                            onKeyDown={(e) => e.key === "Enter" && addTask()}
                                                            style={{
                                                                padding: "10px 14px", borderRadius: 8, border: "1px solid #262626",
                                                                fontSize: 14, outline: "none", color: "#fff", background: "#0a0a0a",
                                                                width: "100%"
                                                            }}
                                                        />
                                                        <select
                                                            value={newTask.priority}
                                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                                                            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #262626", fontSize: 13, outline: "none", color: "#ededed", background: "#0a0a0a" }}
                                                        >
                                                            <option value="high">High</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="low">Low</option>
                                                        </select>
                                                        <input
                                                            type="date"
                                                            value={newTask.deadline}
                                                            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                                            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #262626", fontSize: 13, outline: "none", color: "#ededed", background: "#0a0a0a", colorScheme: "dark" }}
                                                        />
                                                    </div>
                                                    <input
                                                        placeholder="Add description (optional)..."
                                                        value={newTask.description}
                                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                                        onKeyDown={(e) => e.key === "Enter" && addTask()}
                                                        style={{
                                                            padding: "10px 14px", borderRadius: 8, border: "1px solid #262626",
                                                            fontSize: 13, outline: "none", color: "#a3a3a3", background: "#0a0a0a",
                                                        }}
                                                    />
                                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
                                                        <button onClick={() => setShowAddTask(false)} style={{ padding: "8px 16px", borderRadius: 6, color: "#737373", border: "none", background: "none", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                                                        <button onClick={addTask} style={{ padding: "8px 24px", borderRadius: 6, background: "#fff", color: "#000", fontWeight: 600, border: "none", cursor: "pointer", fontSize: 13 }}>Create Task</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Overdue */}
                                        {overdueTasks.length > 0 && (
                                            <div style={{ marginBottom: 24 }}>
                                                <div style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                                                    Overdue ({overdueTasks.length})
                                                </div>
                                                {overdueTasks.map((t) => <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
                                            </div>
                                        )}

                                        {/* Today */}
                                        {(() => {
                                            const todayPending = pendingTasks.filter(t => t.deadline === todayStr);
                                            if (todayPending.length === 0) return null;
                                            return (
                                                <div style={{ marginBottom: 24 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                                                        Today ({todayPending.length})
                                                    </div>
                                                    {todayPending.map((t) => <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
                                                </div>
                                            );
                                        })()}

                                        {/* Later This Week */}
                                        {(() => {
                                            const laterThisWeekPending = pendingTasks.filter(t => t.deadline > todayStr && t.deadline <= weekEndStr);
                                            if (laterThisWeekPending.length === 0) return null;
                                            return (
                                                <div style={{ marginBottom: 24 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                                                        Later This Week ({laterThisWeekPending.length})
                                                    </div>
                                                    {laterThisWeekPending.map((t) => <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
                                                </div>
                                            );
                                        })()}

                                        {/* Future */}
                                        {(() => {
                                            const futurePending = pendingTasks.filter(t => t.deadline > weekEndStr);
                                            if (futurePending.length === 0) return null;
                                            return (
                                                <div style={{ marginBottom: 24 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 600, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                                                        Future ({futurePending.length})
                                                    </div>
                                                    {futurePending.map((t) => <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
                                                </div>
                                            );
                                        })()}

                                        {/* Empty pending state */}
                                        {pendingTasks.filter(t => t.deadline >= todayStr).length === 0 && (
                                            <div style={{
                                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                                background: "rgba(255,255,255,0.02)", border: "1px dashed #1f1f1f", borderRadius: 12, padding: "60px 0", marginBottom: 24
                                            }}>
                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><polyline points="12 6 12 12 16 14" /></svg>
                                                <div style={{ fontSize: 15, fontWeight: 600, color: "#a3a3a3", marginBottom: 4 }}>Your schedule is clear</div>
                                                <div style={{ fontSize: 13, color: "#525252" }}>Enjoy your free time, or click "+ Add Task" to plan ahead.</div>
                                            </div>
                                        )}

                                        {/* Done */}
                                        {doneTasks.length > 0 && (
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 600, color: "#525252", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                                                    Completed ({doneTasks.length})
                                                </div>
                                                {doneTasks.map((t) => <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ANALYTICS TAB */}
                                {tab === "Analytics" && (
                                    <div className="reveal" style={{ position: "relative", zIndex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 20, color: "#fff" }}>Analytics — {monthName}</div>

                                        {/* Task stats */}
                                        <div style={{ background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f", padding: "24px", marginBottom: 24 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 20, color: "#fff" }}>Task Summary</div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                                                {[
                                                    { label: "Total Tasks", value: tasks.length, color: "#fff" },
                                                    { label: "Completed", value: doneTasks.length, color: "#10b981" },
                                                    { label: "Overdue", value: overdueTasks.length, color: "#ef4444" },
                                                ].map((s) => (
                                                    <div key={s.label} style={{
                                                        padding: "16px",
                                                        borderRadius: 8, background: "#0a0a0a", border: "1px solid #1f1f1f"
                                                    }}>
                                                        <div style={{ fontSize: 32, fontWeight: 600, color: s.color, letterSpacing: "-1px" }}>{s.value}</div>
                                                        <div style={{ fontSize: 12, color: "#737373", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ marginTop: 24 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
                                                    <span style={{ color: "#737373" }}>Completion rate</span>
                                                    <span style={{ color: "#ededed" }}>
                                                        {tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0}%
                                                    </span>
                                                </div>
                                                <div style={{ height: 4, borderRadius: 2, background: "#1f1f1f" }}>
                                                    <div style={{
                                                        height: "100%", borderRadius: 2, background: "#ededed",
                                                        width: `${tasks.length > 0 ? (doneTasks.length / tasks.length) * 100 : 0}%`,
                                                        transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Habit completion bars */}
                                        <div style={{ background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f", padding: "24px", marginBottom: 24 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 20, color: "#fff" }}>Habit Completion Rate</div>
                                            {habits.map((h) => {
                                                const done = Object.values(completions[h.id] || {}).filter(Boolean).length;
                                                const rate = Math.round((done / today.getDate()) * 100);
                                                return (
                                                    <div key={h.id} style={{ marginBottom: 16 }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                                                            <span style={{ color: "#a3a3a3", fontWeight: 500 }}>{h.name}</span>
                                                            <span style={{ fontWeight: 600, color: h.color }}>{rate}% <span style={{ color: "#525252", fontWeight: 400 }}>({done}/{today.getDate()})</span></span>
                                                        </div>
                                                        <div style={{ height: 4, borderRadius: 2, background: "#1f1f1f" }}>
                                                            <div style={{ height: "100%", borderRadius: 2, background: h.color, width: `${rate}%`, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                                            {/* Weekly habit heatmap */}
                                            <div style={{ background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f", padding: "20px" }}>
                                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: "#fff" }}>Daily Habit Heatmap</div>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                                                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                                        <div key={i} style={{ textAlign: "center", fontSize: 11, color: "#525252", paddingBottom: 6, fontWeight: 500 }}>{d}</div>
                                                    ))}
                                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                                                        const count = habits.filter((h) => completions[h.id]?.[day]).length;
                                                        const pct = habits.length > 0 ? count / habits.length : 0;
                                                        const bg = pct === 0 ? "#1a1a1a" : pct < 0.4 ? "rgba(16, 185, 129, 0.3)" : pct < 0.8 ? "rgba(16, 185, 129, 0.6)" : "#10b981";
                                                        const isFuture = day > today.getDate();
                                                        return (
                                                            <div key={day} style={{
                                                                aspectRatio: "1", borderRadius: 4,
                                                                background: isFuture ? "#0a0a0a" : bg,
                                                                border: "1px solid #1f1f1f",
                                                                opacity: isFuture ? 0.3 : 1,
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                fontSize: 11, color: isFuture ? "#404040" : pct >= 0.8 ? "#000" : "#ededed", fontWeight: 600
                                                            }}>{day}</div>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 10, color: "#737373" }}>
                                                    <span>Less</span>
                                                    {["#1a1a1a", "rgba(16, 185, 129, 0.3)", "rgba(16, 185, 129, 0.6)", "#10b981"].map((c, i) => (
                                                        <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c, border: "1px solid #1f1f1f" }} />
                                                    ))}
                                                    <span>More</span>
                                                </div>
                                            </div>

                                            {/* Weekly task heatmap */}
                                            <div style={{ background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f", padding: "20px" }}>
                                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: "#fff" }}>Task Completion Grid</div>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                                                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                                        <div key={i} style={{ textAlign: "center", fontSize: 11, color: "#525252", paddingBottom: 6, fontWeight: 500 }}>{d}</div>
                                                    ))}
                                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                                                        const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                        const tasksForDay = tasks.filter(t => t.deadline === dayString);
                                                        const tasksDone = tasksForDay.filter(t => t.done).length;

                                                        let pct = 0;
                                                        if (tasksForDay.length > 0) pct = tasksDone / tasksForDay.length;

                                                        const bg = tasksForDay.length === 0 ? "#1a1a1a" : pct === 0 ? "rgba(239, 68, 68, 0.2)" : pct < 1 ? "rgba(99, 102, 241, 0.5)" : "#6366f1";

                                                        const isFuture = day > today.getDate();
                                                        return (
                                                            <div key={day} style={{
                                                                aspectRatio: "1", borderRadius: 4, width: "100%", minWidth: 28,
                                                                background: isFuture ? "#0a0a0a" : bg,
                                                                border: "1px solid #1f1f1f",
                                                                opacity: isFuture ? 0.3 : 1,
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                fontSize: 12, color: isFuture ? "#404040" : pct >= 1 ? "#fff" : "#ededed", fontWeight: 700
                                                            }}>{day}</div>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, fontSize: 11, color: "#888", fontWeight: 500 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: "#1a1a1a", border: "1px solid #1f1f1f" }} />
                                                        <span>None</span>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(239, 68, 68, 0.2)", border: "1px solid #1f1f1f" }} />
                                                        <span>0%</span>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(99, 102, 241, 0.5)" }} />
                                                        <span>Partial</span>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: "#6366f1" }} />
                                                        <span>Done</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ANALYTICS & INSIGHTS SECTION */}
                                        <div style={{ marginTop: 40, borderTop: "1px solid #1f1f1f", paddingTop: 40 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <span style={{ fontSize: 20 }}>📊</span>
                                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>Analytics & Insights</h2>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <button
                                                        onClick={exportData}
                                                        style={{
                                                            background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)",
                                                            padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", gap: 6, alignItems: "center"
                                                        }}
                                                    >
                                                        ⬇️ Export Data
                                                    </button>
                                                    <button
                                                        onClick={() => setShowAnalytics(!showAnalytics)}
                                                        style={{
                                                            background: "#1a1a1a", color: "#ededed", border: "1px solid #262626",
                                                            padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer"
                                                        }}
                                                    >
                                                        {showAnalytics ? "Hide Insights" : "Show Insights"}
                                                    </button>
                                                </div>
                                            </div>

                                            {showAnalytics && (
                                                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                                    <WeeklySummary />
                                                    <PatternInsights />
                                                    <ProcrastinationAlert />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* DATABASE TAB */}
                                {tab === "Database" && (
                                    <div className="reveal" style={{ position: "relative", zIndex: 1, animation: "fadeIn 0.5s ease" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                            <div style={{ fontWeight: 600, fontSize: 16, color: "#fff" }}>Database Health</div>
                                            <button
                                                onClick={fetchDbStats}
                                                disabled={dbLoading}
                                                style={{
                                                    padding: "8px 16px", borderRadius: 6, border: "1px solid #333",
                                                    background: dbLoading ? "#1a1a1a" : "#ededed",
                                                    color: dbLoading ? "#666" : "#000",
                                                    cursor: dbLoading ? "not-allowed" : "pointer",
                                                    fontWeight: 600, fontSize: 13, transition: "all 0.2s"
                                                }}
                                            >
                                                {dbLoading ? "Refreshing..." : "↻ Refresh Stats"}
                                            </button>
                                        </div>

                                        {dbLoading && !dbStats ? (
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} style={{ height: 180, background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f", opacity: 0.5, animation: "pulse 1.5s infinite" }} />
                                                ))}
                                                <style dangerouslySetInnerHTML={{ __html: `@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.3; } }` }} />
                                            </div>
                                        ) : dbStats ? (
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                {/* Card 1: Total Records */}
                                                <div className="reveal" style={{ background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f", padding: 24 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#737373", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Total Records</div>
                                                    <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
                                                        {Object.values(dbStats.counts || {}).reduce((a: any, b: any) => a + b, 0) as number === 0 ? "Safe & Growing" : Object.values(dbStats.counts || {}).reduce((a: any, b: any) => a + b, 0) as number}
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                        {Object.entries(dbStats.counts || {}).map(([table, count]: [string, any]) => (
                                                            <div key={table} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888" }}>
                                                                <span style={{ textTransform: "capitalize" }}>{table.replace(/_/g, ' ')}</span>
                                                                <span style={{ color: "#fff", fontWeight: 600 }}>{count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Card 2: Database Size */}
                                                <div className="reveal" style={{ background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f", padding: 24 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#737373", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Database Size</div>
                                                    <div style={{ fontSize: 32, fontWeight: 800, color: "#3b82f6", marginBottom: 8 }}>{dbStats.size_mb} <span style={{ fontSize: 16, color: "#737373" }}>MB</span></div>
                                                    <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>of 500MB Free Tier</div>
                                                    <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                                                        <div style={{
                                                            position: "absolute", left: 0, top: 0, height: "100%",
                                                            width: `${dbStats.usagePercent}%`,
                                                            background: dbStats.usagePercent > 50 ? "#ef4444" : "#3b82f6",
                                                            boxShadow: `0 0 10px ${dbStats.usagePercent > 50 ? "rgba(239, 68, 68, 0.4)" : "rgba(59, 130, 246, 0.4)"}`,
                                                            transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)"
                                                        }} />
                                                    </div>
                                                    <div style={{ textAlign: "right", fontSize: 11, color: "#737373", marginTop: 8, fontWeight: 600 }}>{dbStats.usagePercent}% Used</div>
                                                </div>

                                                {/* Card 3: Growth Rate */}
                                                <div className="reveal" style={{ background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f", padding: 24 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#737373", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Weekly Added</div>
                                                    <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
                                                        {dbStats.growth} <span style={{ fontSize: 16, color: "#737373" }}>new / wk</span>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                                                        <span style={{
                                                            color: dbStats.growth >= dbStats.previousGrowth ? "#10b981" : "#ef4444",
                                                            display: "flex", alignItems: "center", gap: 4, fontWeight: 600
                                                        }}>
                                                            {dbStats.growth >= dbStats.previousGrowth ? "↗" : "↘"}
                                                            {dbStats.previousGrowth === 0 ? "100" : Math.abs(Math.round(((dbStats.growth - dbStats.previousGrowth) / dbStats.previousGrowth) * 100))}%
                                                        </span>
                                                        <span style={{ color: "#737373" }}>vs last week</span>
                                                    </div>
                                                </div>

                                                {/* Card 4: Storage Warning or Healthy Status */}
                                                {dbStats.usagePercent > 50 ? (
                                                    <div className="reveal" style={{ background: "rgba(239, 68, 68, 0.05)", borderRadius: 12, border: "1px solid rgba(239, 68, 68, 0.2)", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                                        <div style={{ fontSize: 24, marginBottom: 12 }}>⚠️</div>
                                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Storage Warning</div>
                                                        <div style={{ fontSize: 13, color: "rgba(239, 68, 68, 0.8)", lineHeight: 1.5 }}>
                                                            Database usage has exceeded 50% of the free tier. Consider archiving old tasks to maintain performance.
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="reveal" style={{ background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                                        <div style={{ fontSize: 24, marginBottom: 12 }}>✔️</div>
                                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>System Healthy</div>
                                                        <div style={{ fontSize: 13, color: "#737373", lineHeight: 1.5 }}>
                                                            Your database is optimized and has plenty of headroom for more productivity tracking.
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ padding: 40, textAlign: "center", color: "#737373", background: "#121212", borderRadius: 12, border: "1px solid #1f1f1f" }}>
                                                <div style={{ fontSize: 24, marginBottom: 16 }}>🔌</div>
                                                <div style={{ fontSize: 14, fontWeight: 600 }}>No stats available</div>
                                                <button onClick={fetchDbStats} style={{ marginTop: 16, background: "none", border: "1px solid #333", color: "#fff", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Retry Connection</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Habit Edit Modal */}
                {showHabitModal && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                        animation: "fadeIn 0.2s ease"
                    }}>
                        <div style={{
                            background: "#121212", border: "1px solid #262626", borderRadius: 16,
                            width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
                        }}>
                            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 20, color: "#fff" }}>
                                {editingHabit ? "Edit Daily Task" : "New Daily Task"}
                            </div>
                            <input
                                autoFocus
                                placeholder="e.g. Morning Workout"
                                value={newHabitName}
                                onChange={(e) => setNewHabitName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveHabit()}
                                style={{
                                    width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #262626",
                                    background: "#0a0a0a", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box"
                                }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                                {editingHabit ? (
                                    <button onClick={() => deleteHabit(editingHabit.id)} style={{
                                        padding: "8px 0", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600
                                    }}>Delete Task</button>
                                ) : <div />}
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button onClick={() => setShowHabitModal(false)} style={{
                                        padding: "8px 16px", borderRadius: 6, color: "#737373", background: "none", border: "none", cursor: "pointer", fontSize: 13
                                    }}>Cancel</button>
                                    <button onClick={handleSaveHabit} style={{
                                        padding: "8px 24px", borderRadius: 6, background: "#fff", color: "#000", fontWeight: 600, border: "none", cursor: "pointer", fontSize: 13
                                    }}>Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <style dangerouslySetInnerHTML={{
                    __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        [style*="cursor: pointer"]:hover .hover-delete {
          visibility: visible !important;
        }
      `}} />
            </div>
        </div>
    );
}

function TaskRow({ task, onToggle, onDelete }: {
    task: any,
    onToggle: (id: string) => void,
    onDelete: (id: string) => void
}) {
    const priorityColor = { high: "#ef4444", medium: "#f59e0b", low: "#6366f1" };
    const today = new Date().toISOString().split("T")[0];
    const overdue = !task.done && task.deadline < today;

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", borderRadius: 8, marginBottom: 8,
            background: task.done ? "#0a0a0a" : overdue ? "rgba(239, 68, 68, 0.03)" : "#121212",
            border: `1px solid ${task.done ? "#1f1f1f" : overdue ? "rgba(239, 68, 68, 0.2)" : "#262626"}`,
            transition: "all 0.2s ease",
        }}>
            <div
                onClick={() => onToggle(task.id)}
                style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: "pointer",
                    background: task.done ? "#fff" : "transparent",
                    border: `1.5px solid ${task.done ? "#fff" : priorityColor[task.priority as keyof typeof priorityColor] || priorityColor.medium}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}
            >
                {task.done && <span style={{ color: "#000", fontSize: 12, fontWeight: 800 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: 14, fontWeight: 500,
                    textDecoration: task.done ? "line-through" : "none",
                    color: task.done ? "#525252" : overdue ? "#fca5a5" : "#ededed",
                }}>{task.title}</div>
                {task.description && <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{task.description}</div>}
                {task.deadline && (
                    <div style={{ fontSize: 12, color: overdue ? "#ef4444" : "#737373", marginTop: 2 }}>
                        {overdue ? "⚠ Due " : "Due "}{format(new Date(task.deadline), "MMM d")}
                    </div>
                )}
            </div>
            <div style={{
                fontSize: 11, padding: "4px 8px", borderRadius: 4, fontWeight: 600,
                background: task.priority === "high" ? "rgba(239, 68, 68, 0.1)" : task.priority === "medium" ? "rgba(245, 158, 11, 0.1)" : "rgba(99, 102, 241, 0.1)",
                color: priorityColor[task.priority as keyof typeof priorityColor] || priorityColor.medium, textTransform: "capitalize",
            }}>{task.priority}</div>
            <button onClick={() => onDelete(task.id)} style={{
                background: "none", border: "none", cursor: "pointer", color: "#525252",
                fontSize: 14, padding: "4px 8px", borderRadius: 4,
                transition: "color 0.2s",
            }}
                onMouseOver={(e) => e.currentTarget.style.color = "#ef4444"}
                onMouseOut={(e) => e.currentTarget.style.color = "#525252"}
            >✕</button>
        </div>
    );
}
