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
			padding: '1.5rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				// Light mode primary
				primary: {
					50: '#E6F0FF',
					100: '#CCE0FF',
					500: '#0066FF',
					600: '#0052CC',
					900: '#003D99',
					DEFAULT: '#0066FF',
					foreground: '#FFFFFF',
				},
				// Light mode neutral
				neutral: {
					50: '#FAFAFA',
					100: '#F5F5F5',
					200: '#E5E5E5',
					500: '#A3A3A3',
					700: '#404040',
					900: '#171717',
				},
				// Semantic colors
				success: {
					DEFAULT: '#10B981',
					500: '#10B981',
				},
				warning: {
					DEFAULT: '#F59E0B',
					500: '#F59E0B',
				},
				error: {
					DEFAULT: '#EF4444',
					500: '#EF4444',
				},
				info: {
					DEFAULT: '#3B82F6',
					500: '#3B82F6',
				},
				// Dark mode overrides (applied via class)
				'primary-dark': '#3B8FFF',
				'neutral-dark': {
					700: '#2A2A2A',
					800: '#1F1F1F',
					900: '#0A0A0A',
				},
				'success-dark': '#34D399',
				'warning-dark': '#FBBF24',
				'error-dark': '#F87171',
				'info-dark': '#60A5FA',
			},
			spacing: {
				2: '8px',
				3: '12px',
				4: '16px',
				6: '24px',
				8: '32px',
				10: '40px',
				12: '48px',
				16: '64px',
				24: '96px',
			},
			borderRadius: {
				sm: '8px',
				md: '12px',
				lg: '16px',
				full: '9999px',
			},
			boxShadow: {
				sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
				card: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
				'card-hover': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
				modal: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
			},
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
			},
			fontSize: {
				xs: '12px',
				sm: '14px',
				base: '16px',
				lg: '18px',
				xl: '20px',
				'2xl': '24px',
				'3xl': '32px',
				'4xl': '40px',
				'5xl': '48px',
			},
			transitionDuration: {
				fast: '200ms',
				base: '250ms',
				slow: '300ms',
			},
			transitionTimingFunction: {
				default: 'ease-out',
				smooth: 'ease-in-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
