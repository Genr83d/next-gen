/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#16181B',
        'charcoal-soft': '#1F2226',
        'electric-orange': '#FF6A00',
        'electric-orange-dark': '#D95800',
        'steel-blue': '#5FB4FF',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Lexend"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255, 106, 0, 0.25), 0 20px 45px rgba(0, 0, 0, 0.35)',
        card: '0 12px 40px rgba(0, 0, 0, 0.28)',
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)',
        'accent-radial': 'radial-gradient(circle at top right, rgba(255, 106, 0, 0.35), transparent 60%)',
        'cool-radial': 'radial-gradient(circle at 30% 20%, rgba(95, 180, 255, 0.25), transparent 55%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(18px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s ease-out both',
        'fade-up-delay': 'fade-up 0.8s ease-out 0.15s both',
        'float-slow': 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
