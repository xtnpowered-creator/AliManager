```javascript
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Map Tailwind color classes to CSS custom properties
                // This makes ALL existing components theme-aware automatically

                // Backgrounds
                white: 'var(--bg-primary)',
                slate: {
                    50: 'var(--bg-secondary)',
                    100: 'var(--bg-tertiary)',
                    200: 'var(--bg-tertiary)',
                    900: 'var(--accent-primary)',
                },

                // Text colors
                'slate-900': 'var(--text-primary)',
                'slate-600': 'var(--text-secondary)',
                'slate-500': 'var(--text-secondary)',
                'slate-400': 'var(--text-tertiary)',

                // Accent colors
                teal: {
                    50: 'var(--highlight-subtle, #E0F2F1)',
                    500: 'var(--accent-primary)',
                    600: 'var(--accent-primary)',
                    700: 'var(--accent-hover)',
                },

                // Keep original Tailwind colors for specific use cases
                red: {
                    50: '#FEE2E2',
                    500: '#EF4444',
                    600: '#DC2626',
                },
                amber: {
                    400: '#FBBF24',
                    600: '#D97706',
                },
                yellow: {
                    200: '#FEF08A',
                    400: '#FACC15',
                },
                emerald: {
                    200: '#A7F3D0',
                    500: '#10B981',
                },
                orange: {
                    400: '#FB923C',
                    700: '#C2410C',
                },
                purple: {
                    200: '#E9D5FF',
                    400: '#C084FC',
                },
            },
            borderColor: {
                DEFAULT: 'var(--border-primary)',
                slate: {
                    100: 'var(--border-primary)',
                    200: 'var(--border-primary)',
                    300: 'var(--border-secondary)',
                },
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
