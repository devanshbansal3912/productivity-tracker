import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                base: 'var(--bg-base)',
                surface: 'var(--bg-surface)',
                elevated: 'var(--bg-elevated)',
                border: 'var(--border)',
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)'
                },
                accent: {
                    green: 'var(--accent-green)',
                    red: 'var(--accent-red)',
                    amber: 'var(--accent-amber)',
                    blue: 'var(--accent-blue)',
                    purple: 'var(--accent-purple)',
                    gray: 'var(--accent-gray)'
                }
            },
            fontFamily: {
                sans: ["var(--font)", "Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
        },
    },
    plugins: [],
};
export default config;
