// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath } from "url";

// Compatibility layer: mirror legacy NEXT_PUBLIC_* env vars into the Vite
// client bundle without renaming them across the migrated codebase. Server-side
// code keeps reading process.env.NEXT_PUBLIC_* directly. Browser code reads
// the same logical value through the src/lib/env.ts shim.
const NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  "";
const NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  "";
const NEXT_PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VITE_SITE_URL ??
  "";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      host: "::",
      port: 8080,
    },
    resolve: {
      alias: {
        // Shim node:async_hooks for the browser so esbuild can pre-bundle
        // @tanstack/start-client-core and @tanstack/start-storage-context
        // without crashing the browser with "AsyncLocalStorage is not a constructor".
        // The server path in createIsomorphicFn().server() is never invoked
        // in the browser, so this no-op class is safe.
        'node:async_hooks': fileURLToPath(new URL('./src/shims/async-hooks.ts', import.meta.url)),
      },
    },

    optimizeDeps: {
      // Exclude the two packages that import the virtual module #tanstack-router-entry.
      // Esbuild cannot resolve virtual modules during pre-bundling — it would replace
      // the import with `void 0`, causing hydrateStart(undefined). These must go
      // through Vite's native plugin pipeline where the virtual module IS resolvable.
      exclude: [
        '@tanstack/react-start-client',
        '@tanstack/start-client-core',
      ],
      // Pre-bundle everything else to avoid the 20-30s cold-start from on-demand transforms.
      include: [
        '@tanstack/react-router',
        '@tanstack/router-core',
        '@tanstack/history',
        '@tanstack/react-store',
        '@tanstack/store',
        '@tanstack/router-plugin',
        '@tanstack/react-query',
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client',
        'seroval',
        '@supabase/supabase-js',
        '@supabase/ssr',
        'lenis',
        'cobe',
        'motion/react',
        'zustand',
        'zod',
        'clsx',
        'tailwind-merge',
        'lucide-react',
        // Three.js ecosystem — massive module graph, pre-bundling eliminates
        // the 100+ individual Vite transforms that cause the 90s hydration gap
        'three',
        '@react-three/fiber',
        '@react-three/drei',
        'postprocessing',
      ],
    },
    define: {
      "import.meta.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(NEXT_PUBLIC_SUPABASE_URL),
      "import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(NEXT_PUBLIC_SUPABASE_ANON_KEY),
      "import.meta.env.NEXT_PUBLIC_SITE_URL": JSON.stringify(NEXT_PUBLIC_SITE_URL),
    },
  },
});

