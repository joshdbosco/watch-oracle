import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        gold:    '#B8976A',
        'gold-lt': '#D4B896',
        deep:    '#0D0B09',
        surface: '#161310',
        hover:   '#1E1B16',
        border:  '#2E2820',
        muted:   '#7A6E58',
        sub:     '#B0A48A',
      },
      fontFamily: {
        serif: ['EB Garamond', 'Georgia', 'serif'],
        mono:  ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
