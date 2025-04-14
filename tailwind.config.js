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
  			ring: '#ef4444',
  			background: '#ffffff',
  			foreground: '#020817',
  			primary: {
  				50: '#fef2f2',
  				100: '#fee2e2',
  				200: '#fecaca',
  				300: '#fca5a5',
  				400: '#f87171',
  				500: '#ef4444',
  				600: '#dc2626',
  				700: '#b91c1c',
  				800: '#991b1b',
  				900: '#7f1d1d',
  				950: '#450a0a',
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
  				'1': '#ef4444',
  				'2': '#3b82f6',
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