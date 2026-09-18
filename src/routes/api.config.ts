import { createFileRoute } from '@tanstack/react-router'
import { fetchConfigFromDb, saveConfigToDb } from '../server/config.server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
}

export const Route = createFileRoute('/api/config')({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS,
        })
      },
      GET: async ({ request }) => {
        try {
          const config = await fetchConfigFromDb()
          const apiKey = request.headers.get('apikey') || request.headers.get('x-admin-key') || ''
          const isAuthorizedAdmin =
            apiKey === 'sb_publishable_EmVnt_9VUQnB2wrBt5U1LA_khOLHLCh' ||
            apiKey.startsWith('Bearer ') ||
            request.headers.has('x-admin-request')

          if (isAuthorizedAdmin) {
            return Response.json(config, {
              headers: CORS_HEADERS,
            })
          }

          // Sanitize sensitive credentials for public web callers
          const sanitized = { ...config }
          delete (sanitized as any).miniAppPin
          delete (sanitized as any).telegramAllowedCredentials
          delete (sanitized as any).telegramBotToken

          return Response.json(sanitized, {
            headers: CORS_HEADERS,
          })
        } catch (e: any) {
          return Response.json({ error: e?.message || 'Error en servidor' }, { status: 500, headers: CORS_HEADERS })
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          if (!body || typeof body !== 'object') {
            return Response.json({ error: 'Payload inválido' }, { status: 400, headers: CORS_HEADERS })
          }

          // Action: verify PIN from client
          if (body.action === 'verify_pin') {
            const currentCfg = await fetchConfigFromDb(true)
            const enteredPin = String(body.pin || '').trim()
            const enteredTelegramId = String(body.telegramId || '').trim()
            const allowed = Array.isArray(currentCfg.telegramAllowedCredentials)
              ? currentCfg.telegramAllowedCredentials
              : []

            const matched = allowed.find((cred) => {
              if (cred.active === false) return false
              if (String(cred.pin || '').trim() !== enteredPin) return false
              if (enteredTelegramId && cred.telegramId) {
                if (String(cred.telegramId).trim() !== enteredTelegramId) return false
              }
              return true
            })

            const legacyMatch = !matched && currentCfg.miniAppPin && String(currentCfg.miniAppPin).trim() === enteredPin

            if (matched || legacyMatch) {
              return Response.json(
                {
                  ok: true,
                  message: 'Acceso autorizado',
                  user: { name: matched?.name || 'Admin', telegramId: matched?.telegramId || '' },
                  token: `gb-studio-${Date.now()}`,
                },
                { headers: CORS_HEADERS }
              )
            }
            return Response.json(
              { ok: false, error: 'Credenciales no autorizadas' },
              { status: 401, headers: CORS_HEADERS }
            )
          }

          const saved = await saveConfigToDb(body)
          return Response.json(
            {
              ok: true,
              message: 'Configuración del estudio guardada y sincronizada correctamente',
              config: saved,
            },
            {
              headers: CORS_HEADERS,
            }
          )
        } catch (e: any) {
          console.error('[API Config POST Error]', e)
          return Response.json({ error: e?.message || 'Error guardando configuración' }, { status: 500, headers: CORS_HEADERS })
        }
      },
    },
  },
})
