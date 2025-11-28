/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				md: '2rem',
				lg: '2rem',
				xl: '2rem',
				'2xl': '2rem',
			},
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1400px',
			},
		},
		screens: {
			// Extra small devices (phones, 4 inches and up)
			'xs': '320px',
			// Small devices (phones, 5-6 inches)
			'sm': '375px',
			// Medium phones (6+ inches)
			'md': '428px',
			// Tablets and foldables (unfolded)
			'lg': '768px',
			// Small laptops
			'xl': '1024px',
			// Desktops
			'2xl': '1280px',
			// Large desktops
			'3xl': '1536px',
			// Ultra-wide and 4K
			'4xl': '1920px',
			// 50 inch+ displays
			'5xl': '2560px',
			// Foldable specific breakpoints
			'fold-closed': '280px',
			'fold-open': '717px',
			'fold-cover': '512px',
		},
		extend: {
			colors: {
				// Primary brand color
				primary: {
					DEFAULT: '#5b64e9',
					50: '#eef0ff',
					100: '#e0e3ff',
					200: '#c7cbff',
					300: '#a5abff',
					400: '#8187ff',
					500: '#5b64e9',
					600: '#4f4fdb',
					700: '#4240c0',
					800: '#37369b',
					900: '#31327a',
					950: '#1e1d47',
				},
				// Neutral grays
				gray: {
					50: '#fafafa',
					100: '#f4f4f5',
					200: '#e4e4e7',
					300: '#d4d4d8',
					400: '#a1a1aa',
					500: '#71717a',
					600: '#52525b',
					700: '#3f3f46',
					800: '#27272a',
					900: '#18181b',
					950: '#09090b',
				},
				// Semantic colors
				success: {
					DEFAULT: '#10b981',
					light: '#d1fae5',
				},
				warning: {
					DEFAULT: '#f59e0b',
					light: '#fef3c7',
				},
				error: {
					DEFAULT: '#ef4444',
					light: '#fee2e2',
				},
				// Surface colors
				surface: {
					DEFAULT: '#ffffff',
					dark: '#18181b',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				'4xl': '2rem',
				'5xl': '2.5rem',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			fontSize: {
				// Fluid typography
				'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
				'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
				'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
				'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
				'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
				'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
				'fluid-3xl': 'clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)',
				'fluid-4xl': 'clamp(2.25rem, 1.75rem + 2.5vw, 3rem)',
			},
			spacing: {
				// Safe area insets for notched devices
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
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
				'fade-in': {
					from: { opacity: 0 },
					to: { opacity: 1 },
				},
				'fade-up': {
					from: { opacity: 0, transform: 'translateY(10px)' },
					to: { opacity: 1, transform: 'translateY(0)' },
				},
				'scale-in': {
					from: { opacity: 0, transform: 'scale(0.95)' },
					to: { opacity: 1, transform: 'scale(1)' },
				},
				'pulse-soft': {
					'0%, 100%': { opacity: 1 },
					'50%': { opacity: 0.7 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-up': 'fade-up 0.4s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
			},
			boxShadow: {
				'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
				'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
				'glow': '0 0 20px rgba(91, 100, 233, 0.3)',
				'glow-lg': '0 0 40px rgba(91, 100, 233, 0.4)',
			},
			backdropBlur: {
				xs: '2px',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}