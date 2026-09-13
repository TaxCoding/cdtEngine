import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        ink: {
          950: "#05070b",
          900: "#0a0e14",
          850: "#0e131c",
          800: "#121826",
          700: "#1b2333",
          600: "#2a3448",
          500: "#455065",
        },
        signal: {
          400: "#f3b658",
          500: "#e89a2c",
          600: "#c47d1a",
        },
        severity: {
          low: "#3ecf8e",
          mid: "#e0c341",
          high: "#f0803c",
          critical: "#e2493d",
          extreme: "#9d5ce8",
        },
      },
      boxShadow: {
        node: "0 0 0 1px rgba(255,255,255,0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
