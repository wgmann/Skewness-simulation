import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project site served at https://<user>.github.io/Skewness-simulation/
export default defineConfig({
  base: '/Skewness-simulation/',
  plugins: [react()],
  test: { environment: 'node' },
})
