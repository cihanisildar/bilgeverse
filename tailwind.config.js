/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './unauthorized/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px',
  		},
  	},
  	extend: {
  		colors: {
  			border: '#e5e7eb',
  			input: '#e5e7eb',
  			ring: '#3b82f6',
  			background: '#ffffff',
  			foreground: '#020817',
  			primary: {
  				50: '#eff6ff',
  				100: '#dbeafe',
  				200: '#bfdbfe',
  				300: '#93c5fd',
  				400: '#60a5fa',
  				500: '#3b82f6',
  				600: '#2563eb',
  				700: '#1d4ed8',
  				800: '#1e40af',
  				900: '#1e3a8a',
  				950: '#172554',
  			},
  			secondary: {
  				DEFAULT: '#6b7280',
  				foreground: '#f9fafb',
  			},
  			destructive: {
  				DEFAULT: '#ef4444',
  				foreground: '#fef2f2',
  			},
  			muted: {
  				DEFAULT: '#f3f4f6',
  				foreground: '#6b7280',
  			},
  			accent: {
  				DEFAULT: '#f3f4f6',
  				foreground: '#1f2937',
  			},
  			popover: {
  				DEFAULT: '#ffffff',
  				foreground: '#020817',
  			},
  			card: {
  				DEFAULT: '#ffffff',
  				foreground: '#020817',
  			},
  			chart: {
  				'1': '#3b82f6',
  				'2': '#8b5cf6',
  				'3': '#22c55e',
  				'4': '#eab308',
  				'5': '#ec4899'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-poppins)',
  				'Poppins',
  				'Inter',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'sans-serif'
  			]
  		},
  		boxShadow: {
  			sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  			DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  			md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  			lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  			xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  			'2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  		},
  		borderRadius: {
  			lg: '0.5rem',
  			md: '0.375rem',
  			sm: '0.25rem'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: 0 },
  				to: { height: 'var(--radix-accordion-content-height)' },
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: 0 },
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
} 