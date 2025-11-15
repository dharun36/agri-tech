import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import lingoCompiler from 'lingo.dev/compiler'

// https://vite.dev/config/
// This config keeps defaults but adds a few small production-friendly
// options:
// - `base` driven by BASE_PATH env (useful if deploying to a sub-path)
// - resolve.alias for `@` -> `src` helps cleaner imports
// - build tuning: increased chunk warning limit and explicit outDir
// - server/preview defaults for local testing

const withLingo = lingoCompiler.vite({
  sourceRoot: 'src',
  lingoDir: 'lingo',
  sourceLocale: 'en',
  // Use the locales you care about in the app. Tamil ('ta') is requested; keeping 'hi' since the project already supports it
  targetLocales: ['ta', 'hi'],
  // Client-side React app (no RSC)
  rsc: false,
  // We are not using the "use i18n" directive; let compiler discover strings
  useDirective: false,
  // Use Lingo.dev Engine by default; can be swapped for custom providers later
  models: 'lingo.dev',
})

export default defineConfig(({ mode }) => {
  const basePath = process.env.BASE_PATH || '/'

  const viteConfig = {
    base: basePath,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    build: {
      outDir: 'dist',
      // Leave assets inline limit at Vite default (4kb) unless you need larger
      // assetsInlineLimit: 4096,
      // Increase chunk size warning threshold to reduce noisy logs for larger bundles
      chunkSizeWarningLimit: 2000,
      // You can enable sourcemap in production for debugging, but it increases build size.
      sourcemap: false
    },
    server: {
      host: true,
      port: 5173
    },
    preview: {
      port: 4173
    }
  }

  // Wrap with Lingo.dev compiler to enable build-time localization
  // If API key is missing, skip compiler to keep builds working locally
  const hasLingoKey = !!process.env.LINGODOTDEV_API_KEY
  return hasLingoKey ? withLingo(viteConfig) : viteConfig
})
