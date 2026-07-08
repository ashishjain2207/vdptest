import { defineConfig, loadEnv } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

/** Ensure Bearer token reaches Imriva.VdpConnect.Api through the dev proxy (SignalR negotiate POST). */
function forwardApiAuthorization(proxyReq, req) {
  const auth = req.headers.authorization ?? req.headers.Authorization;
  if (auth) {
    proxyReq.setHeader('Authorization', auth);
  }
}

function isLocalHttpsTarget(target) {
  try {
    const u = new URL(target);
    return u.protocol === 'https:' && ['localhost', '127.0.0.1', '::1'].includes(u.hostname);
  } catch {
    return false;
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Vite does not auto-populate process.env from .env files for the config itself
  // (only for client code via import.meta.env). loadEnv reads .env, .env.local, and
  // mode-specific files so the proxy targets honour overrides like VITE_OIDC_ISSUER.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const identityTarget = env.VITE_OIDC_ISSUER || 'https://localhost:5001';
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:5225';

  return {
    server: {
      host: '::',
      port: 5173,
      proxy: {
        // Proxy OAuth/API to idxd.de - use /m/ (with slash) so /messages is NOT matched
        '^/m/': {
          target: 'https://idxd.de',
          changeOrigin: true,
          secure: true,
        },
        // Identity: /api-identity/* → OpenIddict (must match VITE_OIDC_ISSUER / services/config oidc issuer).
        '/api-identity': {
          target: identityTarget,
          changeOrigin: true,
          secure: !isLocalHttpsTarget(identityTarget),
          rewrite: (path) => path.replace(/^\/api-identity/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('[Identity]', req.method, req.url, '->', identityTarget);
            });
          },
        },
        // VdpConnect API: /api/* and /hubs/* (SignalR)
        '^/api/': {
          target: apiTarget,
          changeOrigin: true,
          secure: env.VITE_API_BASE_URL ? undefined : false, // allow self-signed cert for localhost
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => forwardApiAuthorization(proxyReq, req));
          },
        },
        '^/hubs/': {
          target: apiTarget,
          changeOrigin: true,
          secure: env.VITE_API_BASE_URL ? undefined : false,
          ws: true, // required for SignalR WebSockets
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => forwardApiAuthorization(proxyReq, req));
            proxy.on('error', (err, req) => {
              if (err?.code === 'ECONNREFUSED' && req?.url?.includes('/hubs/')) {
                console.error(
                  `[vite proxy] SignalR hub unreachable (${apiTarget}). Start Imriva.VdpConnect.Api (e.g. profile "http" → port 5225) or set VITE_API_BASE_URL.`,
                );
              }
            });
          },
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'vdpConnect.png'],
        manifest: {
          name: 'vdpConnect - Real Estate Professional Network',
          short_name: 'vdpConnect',
          description: 'Connect with real estate professionals, researchers, and industry experts. Share insights and grow your network.',
          theme_color: '#C71748',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait-primary',
          icons: [
            { src: '/vdpConnect.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/vdpConnect.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          ],
          categories: ['business', 'social', 'productivity'],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            { urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i, handler: 'CacheFirst', options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } } },
          ],
        },
      }),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      // Ensure a single React instance (fixes "Cannot read properties of null (reading 'useState')" when @imriva/framework or other deps bundle React)
      dedupe: ['react', 'react-dom'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      css: true,
      // @imriva/framework ships CJS `require()` in an ESM package; inline so Vite transforms it under Vitest.
      server: {
        deps: {
          inline: [/@imriva\/framework/],
        },
      },
      // Avoid singleFork: true — one worker kept all suites in memory and full runs hit ~8GB+ heap OOM after several heavy UI specs.
      pool: 'forks',
      // Run test files sequentially: parallel fork workers on Windows occasionally crash tinypool ("Worker exited unexpectedly").
      fileParallelism: false,
      exclude: [...configDefaults.exclude],
    },
  };
});
