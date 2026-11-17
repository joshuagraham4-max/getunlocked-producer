import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        home: resolve(__dirname, 'home.html'),
        'rental-calculator': resolve(__dirname, 'rental-calculator.html'),
        'smart-money': resolve(__dirname, 'smart-money.html'),
        review: resolve(__dirname, 'review.html'),
        'equity-unlock': resolve(__dirname, 'equity-unlock.html'),
        'portfolio-snapshot': resolve(__dirname, 'portfolio-snapshot.html'),
        save: resolve(__dirname, 'save.html'),
        agent: resolve(__dirname, 'agent.html'),
        'equipment-apply': resolve(__dirname, 'equipment-apply.html'),
      },
    },
  },
})
