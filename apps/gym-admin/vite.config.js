// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <-- 1. Import the 'path' module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // 2. Add this 'resolve' section to define the '@' alias
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 3. The 'server.proxy' section has been removed as you don't need it.
})