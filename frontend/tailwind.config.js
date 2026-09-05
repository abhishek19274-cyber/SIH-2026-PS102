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
          bg: "#F5F6F8",
          surface: "#FFFFFF",
          card: "#FFFFFF",
          inset: "#F0F2F5",
          hover: "#F0F2F5",
          border: "#D9DDE3",
          "border-subtle": "#E5E7EB",
          "border-dark": "#CBD5E1",
          text: "#17202A",
          "text-secondary": "#5B6470",
          "text-muted": "#7A838E",
          accent: "#2563EB",
          "accent-hover": "#1D4ED8",
        },
        risk: {
          critical: "#DC2626",
          "critical-bg": "#FEF2F2",
          "critical-border": "#FECACA",
          "critical-text": "#991B1B",
          elevated: "#D97706",
          "elevated-bg": "#FFFBEB",
          "elevated-border": "#FDE68A",
          "elevated-text": "#92400E",
          normal: "#16A34A",
          "normal-bg": "#F0FDF4",
          "normal-border": "#BBF7D0",
          "normal-text": "#166534",
          info: "#2563EB",
          "info-bg": "#EFF6FF",
          "info-border": "#BFDBFE",
          "info-text": "#1E40AF",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'panel': '0 2px 6px -1px rgba(0, 0, 0, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
