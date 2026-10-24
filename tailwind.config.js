/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          void: "#07080C",
          charcoal: "#0F1219",
          elevated: "#151A24",
          surface: "#1A202C",
        },
        tactical: {
          border: "#1E293B",
          borderGlow: "rgba(0, 210, 255, 0.25)",
        },
        solo: {
          blue: "#00D2FF",
          glow: "rgba(0, 210, 255, 0.15)",
          hover: "#38bdf8",
        },
        combat: {
          crimson: "#EF4444",
          glow: "rgba(239, 68, 68, 0.15)",
          hover: "#dc2626",
        },
        ayanokoji: {
          slate: "#E2E8F0",
          secondary: "#94A3B8",
          muted: "#64748B",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        }
      },
      fontFamily: {
        sans: ["'Hanken Grotesk'", "system-ui", "sans-serif"],
        display: ["'Sora'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "2px",
      },
      boxShadow: {
        'hud-blue': '0 0 15px rgba(0, 210, 255, 0.15), inset 0 0 15px rgba(0, 210, 255, 0.05)',
        'hud-crimson': '0 0 15px rgba(239, 68, 68, 0.15), inset 0 0 15px rgba(239, 68, 68, 0.05)',
        'tactical': '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
      }
    },
  },
  plugins: [],
}
