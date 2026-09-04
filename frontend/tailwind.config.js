/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        command: {
          bg: "#080c14",
          surface: "#0e1524",
          card: "#121b2f",
          hover: "#18243e",
          border: "#1e293b",
          "border-bright": "#334155",
        },
        risk: {
          critical: "#f43f5e",
          "critical-bg": "rgba(244, 63, 94, 0.12)",
          elevated: "#f59e0b",
          "elevated-bg": "rgba(245, 158, 11, 0.12)",
          normal: "#10b981",
          "normal-bg": "rgba(16, 185, 129, 0.12)",
          info: "#0ea5e9",
          "info-bg": "rgba(14, 165, 233, 0.12)",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-sky': '0 0 20px -5px rgba(14, 165, 233, 0.25)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.25)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.25)',
      }
    },
  },
  plugins: [],
}
