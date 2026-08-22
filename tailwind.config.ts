import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#030712",
        foreground: "#f8fafc",
        cyber: {
          dark: "#030712",
          darker: "#02040a",
          navy: "#070d1f",
          card: "rgba(10, 18, 40, 0.75)",
          border: "rgba(0, 240, 255, 0.15)",
          cyan: "#00f0ff",
          blue: "#3b82f6",
          violet: "#a855f7",
          purple: "#8a2be2",
          rose: "#f43f5e",
          emerald: "#10b981",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        heading: ["var(--font-heading)", "Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        "cyan-glow": "0 0 25px rgba(0, 240, 255, 0.25)",
        "violet-glow": "0 0 25px rgba(168, 85, 247, 0.25)",
        "rose-glow": "0 0 25px rgba(244, 63, 94, 0.25)",
        "emerald-glow": "0 0 25px rgba(16, 185, 129, 0.25)",
        "amber-glow": "0 0 25px rgba(245, 158, 11, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "scanline": "scanline 8s linear infinite",
        "shimmer": "shimmer 2.5s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      backgroundImage: {
        "cyber-grid": "linear-gradient(to right, rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.05) 1px, transparent 1px)",
        "radial-vignette": "radial-gradient(circle at center, rgba(13, 24, 56, 0.4) 0%, rgba(3, 7, 18, 0.95) 75%)",
      },
    },
  },
  plugins: [],
};
export default config;
