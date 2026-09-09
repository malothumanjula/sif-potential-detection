/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#080D16",
          900: "#0B1220",
          850: "#0F1826",
          800: "#131E30",
          700: "#1A2740",
          600: "#243452",
          border: "#233350",
        },
        mist: {
          100: "#F3F6FB",
          200: "#DCE4F0",
          300: "#AEBBD4",
          400: "#8494B3",
          500: "#647092",
        },
        signal: {
          blue: "#4C7CF0",
          blueDeep: "#2E58C4",
          red: "#E5484D",
          redDeep: "#7A1F24",
          amber: "#F0A93E",
          amberDeep: "#7A5714",
          green: "#33B27A",
          greenDeep: "#155C3C",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
