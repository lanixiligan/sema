import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // GitHub Codespaces serves forwarded ports from https://<name>-5173.app.github.dev.
    // Vite blocks unknown hostnames by default (protection against DNS rebinding),
    // so allow that domain and its subdomains. Not needed for localhost.
    allowedHosts: ['.app.github.dev'],
    watch: {
      // data/ holds ~46k dataset photos and recordings; the app never imports them.
      // Watching them runs out of Linux's file-watcher limit (ENOSPC).
      ignored: ['**/data/**'],
    },
  },
})
