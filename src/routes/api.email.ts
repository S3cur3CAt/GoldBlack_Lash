import { createFileRoute } from '@tanstack/react-router'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Requested-With',
  'Access-Control-Max-Age': '86400',
}

export const Route = createFileRoute('/api/email')({
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
            service: 'GoldBlack Lash Resend Email API',
            status: 'online',
            instructions: 'Send POST request with { to, subject, html, text?, from?, apiKey? }',
          },
          { headers: CORS_HEADERS }
        )
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { to, subject, html, text, from, apiKey } = body || {}

          if (!to || !subject || (!html && !text)) {
            return Response.json(
              { error: 'Faltan campos requeridos: "to", "subject" y ("html" o "text")' },
              { status: 400, headers: CORS_HEADERS }
            )
          }

          // Resolve Resend API Key: from request or server environment
          const resolvedApiKey =
            apiKey?.trim() ||
            process.env.RESEND_API_KEY ||
            process.env.VITE_RESEND_API_KEY ||
            ''

          if (!resolvedApiKey) {
            return Response.json(
              {
                error:
                  'No se ha configurado la API Key de Resend. Añade RESEND_API_KEY en las variables de entorno de Vercel o configúrala en Ajustes de la app.',
              },
              { status: 400, headers: CORS_HEADERS }
            )
          }

          // Resolve sender email: custom domain or fallback
          const defaultFrom =
            process.env.RESEND_FROM_EMAIL ||
            'GoldBlack Lash <citas@goldblacklash.com>'
          const resolvedFrom = from?.trim() || defaultFrom

          const recipients = Array.isArray(to) ? to : [to]

          const resendPayload: Record<string, any> = {
            from: resolvedFrom,
            to: recipients,
            subject,
          }

          if (html) resendPayload.html = html
          if (text) resendPayload.text = text

          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resolvedApiKey}`,
            },
            body: JSON.stringify(resendPayload),
          })

          const data = await resendRes.json()

          if (!resendRes.ok) {
            console.error('[Resend Error]', data)
            return Response.json(
              {
                error: data?.message || 'Error al enviar correo con Resend',
                details: data,
              },
              { status: resendRes.status, headers: CORS_HEADERS }
            )
          }

          return Response.json(
            {
              ok: true,
              id: data.id,
              message: `Correo enviado exitosamente a ${recipients.join(', ')}`,
            },
            { headers: CORS_HEADERS }
          )
        } catch (err: any) {
          console.error('[API Email Error]', err)
          return Response.json(
            { error: err?.message || 'Error interno del servidor de correo' },
            { status: 500, headers: CORS_HEADERS }
          )
        }
      },
    },
  },
})
