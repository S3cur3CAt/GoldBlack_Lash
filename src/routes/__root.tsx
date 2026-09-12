import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { ReactNode } from 'react'

import { Footer, Header } from '#/components/Chrome'
import { ReservationModal } from '#/components/ReservationModal'
import { HeaderProvider } from '#/context/HeaderContext'
import { business } from '#/data/site'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
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
        content: `Extensiones de pestañas y lifting con diseño personalizado en ${business.city}. Descubre tu efecto ideal y disfruta de un momento para ti en ${business.name}.`,
      },
      {
        name: 'theme-color',
        content: '#fcf8f6',
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
        href: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>

      <body className="bg-paper font-body text-ink antialiased">
        <HeaderProvider>
          <a href="#contenido" className="skip-link">
            Saltar al contenido
          </a>

          <Header />

          <main id="contenido" tabIndex={-1}>
            {children}
          </main>

          <Footer />

          <ReservationModal />
        </HeaderProvider>

        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'TanStack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}

        <Scripts />
      </body>
    </html>
  )
}
