import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { fetchImageFromNeon, isValidImageKey } from './server/images.ts'

/**
 * En `vite dev` el router de TanStack intercepta /api/* antes que las rutas
 * Nitro de server/, asi que este middleware (solo dev, registrado el primero)
 * sirve /api/images/:key desde Neon. En build/preview/prod lo sirve la ruta
 * Nitro server/api/images/[key].get.ts.
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
          const key = match ? match[1] : ''
          if (!isValidImageKey(key)) {
            next()
            return
          }
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
          next(error)
        }
      })
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    neonImagesDev(),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    nitro({
      handlers: [
        {
          method: 'GET',
          route: '/api/images/:key',
          handler: './server/images-handler.ts',
        },
      ],
    }),
    viteReact(),
  ],
})

export default config
