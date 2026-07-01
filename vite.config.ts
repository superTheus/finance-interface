import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
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
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('@primevue/themes')) {
            return 'primevue-theme'
          }

          if (id.includes('@primevue/core') || id.includes('@primevue/icons')) {
            return 'primevue-core'
          }

          if (id.includes('primevue')) {
            if (/[\\/]primevue[\\/](datatable|column|paginator)/.test(id)) {
              return 'primevue-data'
            }

            if (/[\\/]primevue[\\/](dialog|dynamicdialog|drawer|confirmdialog|confirmationservice|toast|toastservice|tooltip)/.test(id)) {
              return 'primevue-overlay'
            }

            if (/[\\/]primevue[\\/](input|select|checkbox|radiobutton|datepicker|textarea|floatlabel|toggleswitch)/.test(id)) {
              return 'primevue-forms'
            }

            return 'primevue-ui'
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
