import { createFileRoute } from '@tanstack/react-router'
import { fetchConfigFromDb } from '../server/config.server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
}

export const Route = createFileRoute('/api/auth')({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS,
        })
      },
      GET: async () => {
        return Response.json(
          {
            service: 'GoldBlack Lash Studio Auth Gateway',
            status: 'online',
          },
          { headers: CORS_HEADERS }
        )
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}))
          const enteredPin = String(body.pin || '').trim()
          const enteredTelegramId = String(body.telegramId || '').trim()
          const enteredToken = String(body.botToken || '').trim()

          if (!enteredPin) {
            return Response.json(
              { ok: false, error: 'Por favor introduce el código PIN de acceso' },
              { status: 400, headers: CORS_HEADERS }
            )
          }

          const config = await fetchConfigFromDb(true)
          const allowedCredentials = Array.isArray(config.telegramAllowedCredentials)
            ? config.telegramAllowedCredentials
            : []

          // If no credentials registered anywhere in DB
          if (allowedCredentials.length === 0 && !config.miniAppPin) {
            return Response.json(
              {
                ok: false,
                error: 'No hay usuarios autorizados registrados en el sistema.',
              },
              { status: 403, headers: CORS_HEADERS }
            )
          }

          // Search matching credential
          const matched = allowedCredentials.find((cred) => {
            if (cred.active === false) return false
            if (String(cred.pin || '').trim() !== enteredPin) return false

            if (enteredTelegramId && cred.telegramId) {
              const cleanEntered = enteredTelegramId.replace(/\D/g, '')
              const cleanCred = String(cred.telegramId).replace(/\D/g, '')
              if (cleanEntered && cleanCred) {
                if (cleanEntered !== cleanCred) return false
              } else if (String(cred.telegramId).trim().toLowerCase() !== enteredTelegramId.toLowerCase()) {
                return false
              }
            }

            if (enteredToken && cred.botToken) {
              if (String(cred.botToken).trim() !== enteredToken) return false
            }

            return true
          })

          // Also check legacy single pin if configured and no user matched
          const isLegacyMatch = !matched && config.miniAppPin && String(config.miniAppPin).trim() === enteredPin

          if (matched || isLegacyMatch) {
            const userName = matched?.name || 'Administrador'
            return Response.json(
              {
                ok: true,
                message: `Acceso autorizado. ¡Bienvenido/a, ${userName}!`,
                user: {
                  name: userName,
                  telegramId: matched?.telegramId || enteredTelegramId || '',
                },
                token: `gb-auth-${Date.now()}`,
              },
              { headers: CORS_HEADERS }
            )
          }

          return Response.json(
            {
              ok: false,
              error: enteredTelegramId
                ? 'Credenciales no autorizadas. Verifica tu ID de Telegram o PIN de acceso.'
                : 'PIN incorrecto. Introduce el PIN de acceso del estudio.',
            },
            { status: 401, headers: CORS_HEADERS }
          )
        } catch (e: any) {
          return Response.json(
            { ok: false, error: e?.message || 'Error en servidor' },
            { status: 500, headers: CORS_HEADERS }
          )
        }
      },
    },
  },
})
