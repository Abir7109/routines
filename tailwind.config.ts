import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Custom Student's Routine colors
        'electric-blue': 'oklch(0.6 0.2 250)',
        'soft-cyan': 'oklch(0.7 0.12 200)',
        'subtle-violet': 'oklch(0.65 0.15 300)',
        'muted-green': 'oklch(0.6 0.12 145)',
        'muted-red': 'oklch(0.55 0.15 25)',
        'charcoal': {
          deep: 'oklch(0.12 0 0)',
          mid: 'oklch(0.165 0 0)',
          light: 'oklch(0.22 0 0)',
        },
        'soft-white': 'oklch(0.9 0 0)',
        'soft-gray': 'oklch(0.7 0 0)',
        'glass-surface': 'oklch(0.18 0 0 / 60%)',
        'glass-border': 'oklch(1 0 0 / 8%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      boxShadow: {
        'glass': '0 4px 24px oklch(0 0 0 / 30%), 0 0 1px oklch(1 0 0 / 5%) inset',
        'glow-primary': '0 0 20px oklch(0.6 0.2 250 / 30%)',
        'glow-success': '0 0 20px oklch(0.6 0.12 145 / 30%)',
        'glow-error': '0 0 20px oklch(0.55 0.15 25 / 30%)',
        'floating': '0 8px 32px oklch(0 0 0 / 40%), 0 0 1px oklch(1 0 0 / 10%) inset',
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'progress-ring': 'progress-ring 1s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'progress-ring': {
          '0%': { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: 'var(--progress)' },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
