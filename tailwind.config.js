/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        display: ['"Clash Display"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48"
        },
        brand: {
          50: "#faf7ff",
          100: "#efe6ff",
          200: "#dac8ff",
          300: "#bf9cff",
          400: "#a070ff",
          500: "#7c4dff",
          600: "#5e32e6",
          700: "#4826b4",
          800: "#37208a",
          900: "#2a1a68",
        },
        candy: {
          pink: "#ff6bb5",
          coral: "#ff8a66",
          peach: "#ffc071",
          lime: "#9af060",
          sky: "#69d5ff",
          violet: "#a774ff",
        },
        success: {
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A"
        },
        warning: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))"
        }
      },
      fontSize: {
        "display-3xl": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.04em" }],
        "display-2xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display-xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["2.5rem", { lineHeight: "1.15" }],
        "display-md": ["2rem", { lineHeight: "1.2" }],
        "display-sm": ["1.75rem", { lineHeight: "1.25" }],
        body: ["1.0625rem", { lineHeight: "1.6" }]
      },
      boxShadow: {
        "soft": "0 20px 60px -30px rgba(15, 23, 42, 0.35)",
        "pop": "0 18px 40px -24px rgba(59, 130, 246, 0.45)"
      },
      transitionTimingFunction: {
        "spring-snappy": "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    },
  },
  plugins: [],
}

