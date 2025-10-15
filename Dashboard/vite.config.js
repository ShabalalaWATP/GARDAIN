import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/guardian-api': {
        target: 'https://content.guardianapis.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/guardian-api/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const header = proxyRes.headers['access-control-allow-origin']
            if (Array.isArray(header) && header.length) {
              proxyRes.headers['access-control-allow-origin'] = header[0]
            } else if (typeof header === 'string' && header.includes(',')) {
              proxyRes.headers['access-control-allow-origin'] = header.split(',')[0].trim()
            }
          })
        },
      },
    },
  },
})
