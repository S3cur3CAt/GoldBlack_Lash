import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * En `vite dev` la server route de TanStack (src/routes/api.images.$key.ts)
 * tambien responde /api/images/:key, pero este middleware (solo dev,
 * registrado el primero) la sirve desde Neon como fallback rapido sin pasar
 * por el SSR. En build/prod la sirve la server route (auto-registrada).
 *
 * NOTA: sin import estatico de src/server/images.server.ts a proposito. El
 * driver `postgres` se carga con import dinamico SOLO cuando llega una
 * peticion de imagen, para no meter codigo Node en el grafo de evaluacion
 * de la config (eso dejaba al entorno "ssr" sin recargar: "Vite environment
 * ssr is unavailable"). Los errores de BD devuelven 500/404 JSON, nunca
 * next(error), para no envenenar el dev-server ni tumbar el SSR.
 */
function neonImagesDev(): Plugin {
  return {
    name: 'neon-images-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.method !== 'GET') {
            next()
            return
          }
          const url = new URL(req.url || '/', 'http://localhost')
          const match = url.pathname.match(/^\/api\/images\/([A-Za-z0-9-]{1,64})\/?$/)
          if (!match) {
            next()
            return
          }
          const key = match[1]
          // Carga perezosa: solo aqui se toca Neon/Driver.
          const { fetchImageFromNeon } = await import(
            './src/server/images.server.ts'
          )
          const hit = await fetchImageFromNeon(key)
          if (!hit) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Imagen no encontrada' }))
            return
          }
          res.statusCode = 200
          res.setHeader('Content-Type', hit.mime)
          res.setHeader('Content-Length', String(hit.data.length))
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          res.end(hit.data)
        } catch (error) {
          // Nunca romper el dev-server/SSR por un fallo de imagenes.
          try {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Error de imagen' }))
          } catch {
            next()
          }
        }
      })
    },
  }
}

const config = defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    neonImagesDev(),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    // Workaround nitrojs/nitro#4295 (dev en Windows: el dev-worker de Nitro
    // no logra inicializar el entorno "ssr" y toda pagina responde 503
    // "Vite environment ssr is unavailable", incluso sin nuestro codigo).
    // En `vite dev` (serve) el SSR lo sirve TanStack Start directamente y las
    // imagenes las sirve neonImagesDev(); Nitro solo se usa en build/preview/
    // produccion, donde funciona bien (verificado con `pnpm build`).
    ...(command === 'serve' ? [] : [nitro()]),
    viteReact(),
  ],
}))

export default config
