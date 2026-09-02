import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import child_process from 'node:child_process'

// ── Windows OneDrive / EPERM Fix ─────────────────────────────────────────────
// Vite's windowsSafeRealPathSync falls back to child_process.execFile when
// encountering OneDrive reparse points, which triggers spawn EPERM.
// Intercepting and returning the resolved absolute path directly solves this.
try {
  const origRealpathSync = fs.realpathSync;
  fs.realpathSync = function (path: any, options: any) {
    try {
      return origRealpathSync(path, options);
    } catch {
      return String(path);
    }
  } as any;
  if (origRealpathSync.native) {
    fs.realpathSync.native = function (path: any, options: any) {
      try {
        return origRealpathSync.native(path, options);
      } catch {
        return String(path);
      }
    } as any;
  }
} catch {
  // ignore
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: true,
    },
    fs: {
      strict: false,
      cachedChecks: false,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    force: false,
  },
  build: {
    target: 'esnext',
    sourcemap: false,
  },
})
