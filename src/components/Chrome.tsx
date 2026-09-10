import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { business, whatsappLink } from '#/data/site'

export const tabs = [
  { to: '/', label: 'Inicio' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/galeria', label: 'Resultados' },
  { to: '/sobre-mi', label: 'El estudio' },
  { to: '/contacto', label: 'Contacto' },
] as const

export function Header() {
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  const pathname = useLocation({
    select: (location) => location.pathname,
  })

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')

    const closeOnDesktop = () => {
      if (media.matches) setOpen(false)
    }

    media.addEventListener('change', closeOnDesktop)

    return () => {
      media.removeEventListener('change', closeOnDesktop)
    }
  }, [])

  return (
    <header
      className="sticky top-0 z-50 border-b border-line/70 bg-paper/95 backdrop-blur-xl"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          menuButton.current?.focus()
        }
      }}
    >
      <div className="wrap flex h-20 items-center justify-between gap-5">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          aria-label={`${business.name}, ir al inicio`}
          className="flex items-center gap-3"
        >
          <img
            src="/goldblack_logo.png"
            alt={`${business.name} — logotipo`}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover"
          />

          <span>
            <span className="block font-display text-2xl leading-none tracking-tight">
              GoldBlack
            </span>
            <span className="mt-1.5 block text-[0.53rem] font-semibold tracking-[0.3em] text-muted uppercase">
              Lash & beauty studio
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 lg:flex"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.to === '/' }}
              className="nav-link"
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <a
          href={whatsappLink()}
          target="_blank"
          rel="noreferrer"
          className="button button-dark hidden lg:inline-flex"
        >
          Reserva tu momento
          <span aria-hidden="true">↗</span>
        </a>

        <button
          ref={menuButton}
          type="button"
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 items-center gap-3 rounded-full border border-line bg-white px-4 text-xs font-semibold lg:hidden"
        >
          {open ? 'Cerrar' : 'Menú'}
          <span aria-hidden="true" className="text-xl text-rose">
            {open ? '×' : '☰'}
          </span>
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Navegación móvil"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-80px)] overflow-y-auto rounded-b-[2rem] border-b border-line bg-paper shadow-panel lg:hidden"
        >
          <div className="wrap py-5">
            {tabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: tab.to === '/' }}
                className="my-1 flex items-center justify-between rounded-2xl px-4 py-4 font-display text-2xl"
                activeProps={{ className: 'bg-blush text-rose' }}
              >
                {tab.label}
                <span aria-hidden="true" className="font-body text-sm">
                  ↗
                </span>
              </Link>
            ))}

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="button button-dark mt-5 mb-3 w-full"
            >
              Pedir cita por WhatsApp
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="rounded-t-[3rem] bg-plum text-white md:rounded-t-[5rem]">
      <div className="wrap pt-14 pb-7 md:pt-20">
        <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.7fr_1fr_1fr]">
          <div>
            <p className="font-display text-4xl tracking-tight">
              GoldBlack
            </p>

            <p className="mt-3 text-[0.6rem] tracking-[0.25em] text-white/60 uppercase">
              Lash & beauty studio
            </p>

            <p className="mt-6 max-w-xs text-sm leading-7 text-white/70">
              Un pequeño momento para ti.
              <br />
              Una nueva forma de mirar.
            </p>

            <a
              href={business.instagram}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-3 text-xs text-white transition-colors hover:bg-white/10 focus-visible:outline-accent"
            >
              Síguenos en Instagram ↗
            </a>
          </div>

          <div>
            <h2 className="font-body text-xs font-semibold tracking-widest uppercase">
              Explora
            </h2>

            <ul className="mt-6 space-y-4 text-sm">
              {tabs.map((tab) => (
                <li key={tab.to}>
                  <Link
                    to={tab.to}
                    className="footer-link focus-visible:outline-accent"
                  >
                    {tab.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-body text-xs font-semibold tracking-widest uppercase">
              Tu visita
            </h2>

            <address className="mt-6 text-sm leading-7 text-white/70 not-italic">
              {business.address}
              <br />
              {business.postalCode} {business.city}
            </address>

            <ul className="mt-6 space-y-3 text-xs text-white/70">
              {business.hours.map((slot) => (
                <li key={slot.days} className="flex justify-between gap-3">
                  <span>{slot.days}</span>
                  <span>{slot.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-body text-xs font-semibold tracking-widest uppercase">
              Hablemos
            </h2>

            <ul className="mt-6 space-y-4 text-sm">
              <li>
                <a
                  href={`tel:${business.phoneDisplay.replace(/\s/g, '')}`}
                  className="footer-link focus-visible:outline-accent"
                >
                  {business.phoneDisplay}
                </a>
              </li>

              <li>
                <a
                  href={`mailto:${business.email}`}
                  className="footer-link focus-visible:outline-accent"
                >
                  {business.email}
                </a>
              </li>
            </ul>

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="button button-accent mt-7 focus-visible:outline-accent"
            >
              Reservar cita ↗
            </a>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/15 pt-7 text-[0.65rem] leading-6 text-white/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {business.name}.
            Todos los derechos reservados.
          </p>
          <p>Hecho con calma, cuidado y detalle.</p>
        </div>
      </div>
    </footer>
  )
}