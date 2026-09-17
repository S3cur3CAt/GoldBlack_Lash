import { createFileRoute } from '@tanstack/react-router'
import { sendStudioTelegramAlert } from '../server/telegram.server'
import { fetchConfigFromDb } from '../server/config.server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Requested-With',
  'Access-Control-Max-Age': '86400',
}

export const Route = createFileRoute('/api/telegram')({
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
            service: 'GoldBlack Lash Telegram Alert API',
            status: 'online',
            description: 'Envío de alertas instantáneas (0s) al estudio mediante Telegram Bot',
          },
          { headers: CORS_HEADERS }
        )
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}))
          const liveConfig = await fetchConfigFromDb().catch(() => ({} as any))

          const mergedConfig = {
            ...liveConfig,
            telegramBotToken: body.telegramBotToken || liveConfig.telegramBotToken,
            telegramChatId: body.telegramChatId || liveConfig.telegramChatId,
            telegramAlertsEnabled:
              typeof body.telegramAlertsEnabled === 'boolean'
                ? body.telegramAlertsEnabled
                : liveConfig.telegramAlertsEnabled !== false,
          }

          const result = await sendStudioTelegramAlert({
            appointment: body.appointment,
            customMessage: body.message,
            config: mergedConfig,
          })

          if (!result.ok) {
            return Response.json(
              { ok: false, error: result.error || 'Error al despachar alerta a Telegram' },
              { status: 400, headers: CORS_HEADERS }
            )
          }

          return Response.json(
            {
              ok: true,
              message: result.message || 'Alerta instantánea enviada con éxito a Telegram',
            },
            { headers: CORS_HEADERS }
          )
        } catch (err: any) {
          console.error('[API Telegram Route Error]', err)
          return Response.json(
            { ok: false, error: err?.message || 'Error interno al procesar alerta de Telegram' },
            { status: 500, headers: CORS_HEADERS }
          )
        }
      },
    },
  },
})
