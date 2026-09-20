import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { ReactNode } from 'react'

import { Footer, Header } from '#/components/Chrome'
import { MaintenanceScreen } from '#/components/MaintenanceScreen'
import { ReservationModal } from '#/components/ReservationModal'
import { HeaderProvider } from '#/context/HeaderContext'
import { StudioConfigProvider } from '#/context/StudioConfigContext'
import { SeasonalParticles } from '#/components/SeasonalParticles'
import { business } from '#/data/site'

import appCss from '../styles.css?url'

const fetchLiveConfig = createServerFn({ method: 'GET' }).handler(async () => {
  const { fetchConfigFromDb } = await import('../server/config.server')
  return fetchConfigFromDb()
})

export const Route = createRootRoute({
  loader: async () => {
    try {
      const config = await fetchLiveConfig()
      return { config: config || business }
    } catch {
      return { config: business }
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: `${business.name} — Enamórate de tu mirada`,
      },
      {
        name: 'description',
        content: `Extensiones de pestañas y cuidado facial con diseño personalizado en ${business.city}. Descubre tu efecto ideal y disfruta de un momento para ti en ${business.name}.`,
      },
      {
        name: 'theme-color',
        content: '#fdf2f8',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:locale',
        content: 'es_ES',
      },
      {
        property: 'og:site_name',
        content: business.name,
      },
      {
        property: 'og:title',
        content: `${business.name} — Enamórate de tu mirada`,
      },
      {
        property: 'og:description',
        content:
          'Pestañas que realzan lo que te hace única. Un diseño a tu medida y un momento de cuidado solo para ti.',
      },
      {
        property: 'og:image',
        content: '/api/images/logo',
      },
      {
        property: 'og:image:alt',
        content: `Logotipo de ${business.name}`,
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/api/images/logo',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  const data = Route.useLoaderData()
  const liveConfig = (data?.config || business) as any

  return (
    <html lang="es">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.console) {
                const _w = window.console.warn;
                window.console.warn = function(...args) {
                  if (!args || !args.length) return;
                  if (args.length === 1 && typeof args[0] === 'string' && (!args[0].trim() || args[0].includes('DevTools') || args[0].includes('TanStack') || args[0].includes('React Router'))) return;
                  _w.apply(window.console, args);
                };
              }
            `,
          }}
        />
      </head>

      <body className="bg-paper font-body text-ink antialiased">
        <StudioConfigProvider value={liveConfig}>
          <SeasonalParticles effect={liveConfig.seasonalEffect} />
          {liveConfig.maintenanceMode ? (
            <MaintenanceScreen liveConfig={liveConfig} />
          ) : (
            <HeaderProvider>
              <a href="#contenido" className="skip-link">
                Saltar al contenido
              </a>

              <Header />

              <main id="contenido" tabIndex={-1} className="relative z-10">
                {children}
              </main>

              <Footer />

              <ReservationModal />
            </HeaderProvider>
          )}
        </StudioConfigProvider>

        <Scripts />
      </body>
    </html>
  )
}
