import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'validate-mode-env',
      config(_config, { mode }) {
        if (mode !== 'development' && mode !== 'production') return
        const env = loadEnv(mode, process.cwd(), 'VITE_')
        const required = ['VITE_API_BASE_URL', 'VITE_GOOGLE_CLIENT_ID']
        const missing = required.filter((name) => !env[name]?.trim())
        if (missing.length) {
          throw new Error(`Configure ${missing.join(', ')} em .env.${mode} antes de iniciar o Vite.`)
        }
      },
    },
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/finance-api': {
        target: 'http://127.0.0.1',
        headers: {
          host: 'projetos.local',
        },
        rewrite: (path) => path.replace(/^\/finance-api/, '/finance-app/back'),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('primevue')) {
            return 'primevue'
          }

          if (id.includes('@kangc') || id.includes('highlight.js') || id.includes('prismjs')) {
            return 'editor'
          }

          if (id.includes('chart.js')) {
            return 'charts'
          }

          if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
            return 'vue'
          }

          return 'vendor'
        },
      },
    },
  },
})
