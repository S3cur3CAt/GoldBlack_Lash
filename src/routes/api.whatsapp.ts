import { createFileRoute } from '@tanstack/react-router'
import { sendStudioWhatsAppAlert, formatWhatsAppPhone } from '../server/whatsapp.server'
import { fetchConfigFromDb } from '../server/config.server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Requested-With',
  'Access-Control-Max-Age': '86400',
}

export const Route = createFileRoute('/api/whatsapp')({
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
            service: 'GoldBlack Lash WhatsApp Alert API',
            status: 'online',
            description: 'Envío de alertas de WhatsApp al estudio mediante CallMeBot o Webhook',
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
            whatsappAlertPhone: body.whatsappAlertPhone || liveConfig.whatsappAlertPhone,
            whatsappProvider: body.whatsappProvider || liveConfig.whatsappProvider,
            whatsappCallMeBotApiKey: body.whatsappCallMeBotApiKey || liveConfig.whatsappCallMeBotApiKey,
            whatsappWebhookUrl: body.whatsappWebhookUrl || liveConfig.whatsappWebhookUrl,
            whatsappAlertsEnabled:
              typeof body.whatsappAlertsEnabled === 'boolean'
                ? body.whatsappAlertsEnabled
                : liveConfig.whatsappAlertsEnabled,
          }

          const result = await sendStudioWhatsAppAlert({
            appointment: body.appointment,
            customMessage: body.message,
            config: mergedConfig,
          })

          if (!result.ok) {
            return Response.json(
              { ok: false, error: result.error || 'Error al enviar alerta por WhatsApp' },
              { status: 400, headers: CORS_HEADERS }
            )
          }

          return Response.json(
            {
              ok: true,
              message: result.message || 'Alerta de WhatsApp despachada correctamente',
              targetPhone: formatWhatsAppPhone(mergedConfig.whatsappAlertPhone || ''),
            },
            { headers: CORS_HEADERS }
          )
        } catch (err: any) {
          console.error('[API WhatsApp POST error]', err)
          return Response.json(
            { error: err?.message || 'Error en el servidor de WhatsApp' },
            { status: 500, headers: CORS_HEADERS }
          )
        }
      },
    },
  },
})
