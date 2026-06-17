import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import path from 'path'

// Get current git commit hash (short)
let gitHash = 'development'
try {
  gitHash = execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim()
} catch (e) {
  gitHash = new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env.VITE_GIT_HASH': JSON.stringify(gitHash),
  },
  preview: {
    allowedHosts: true
  },
  base: '/', 
})

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
  
//   // Development server configuration
//   server: {
//     host: '172.16.40.23', // Your local network IP
//     port: 5173, // Default Vite port
//     open: false, // Don't auto-open browser
//     cors: true, // Enable CORS for cross-origin requests
//   },
  
//   // Build configuration
//   build: {
//     outDir: 'build', // Build output directory
//     sourcemap: true, // Generate source maps for debugging
//     minify: 'terser', // Use terser for better minification
//     rollupOptions: {
//       output: {
//         manualChunks: {
//           vendor: ['react', 'react-dom'], // Separate vendor chunk
//         }
//       }
//     }
//   },
  
//   // Base path for hosting
//   base: '/kofi/', // Important for hosting at http://172.16.40.23/kofi/
  
//   // Preview server (for built files)
//   preview: {
//     host: '172.16.40.23',
//     port: 4173,
//     cors: true,
//   }
// })