import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { openReservationModal } from '#/components/ReservationModal'
import { business } from '#/data/site'

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
      className="sticky top-3 sm:top-5 z-50 w-full px-3 sm:px-6 pointer-events-none transition-all duration-300"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          menuButton.current?.focus()
        }
      }}
    >
      <div className="pointer-events-auto max-w-6xl mx-auto flex items-center justify-between gap-3 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_12px_36px_-10px_rgba(93,49,59,0.12),0_0_0_1px_rgba(255,255,255,0.8)_inset]">
        {/* Brand / Gleaming Rounded Logo */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          aria-label={`${business.name}, ir al inicio`}
          className="group flex items-center gap-2.5 sm:gap-3 py-0.5"
        >
          <div className="relative flex-shrink-0">
            {/* Ambient luxury halo shimmer */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#d4af37] via-[#f3d997] to-[#b66f79] opacity-70 blur-[4px] group-hover:opacity-100 group-hover:blur-[6px] transition-all duration-300" />

            {/* Rounded gleaming logo container */}
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-2xl p-[1.5px] bg-gradient-to-b from-[#fcedc7] via-[#d4af37] to-[#8a5a36] shadow-[0_4px_12px_rgba(212,175,55,0.35)] transition-transform duration-300 group-hover:scale-105">
              <div className="h-full w-full rounded-[14px] overflow-hidden bg-black flex items-center justify-center">
                <img
                  src="/api/images/logo"
                  alt="GoldBlack Lash — logotipo"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover rounded-[14px]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col text-left">
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#3f2932] group-hover:text-[#b66f79] transition-colors leading-none">
              GoldBlack <span className="text-[#b66f79] font-serif italic">Lash</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase text-[#826c73] mt-0.5">
              Studio de Miradas
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 bg-black/[0.03] p-1 rounded-full border border-black/[0.04] lg:flex"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.to === '/' }}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#826c73] hover:text-[#3f2932] hover:bg-white/80 transition-all duration-200"
              activeProps={{
                className: 'bg-gradient-to-r from-[#3f2932] to-[#5c3a49] !text-white shadow-[0_3px_12px_-2px_rgba(63,41,50,0.35)]',
              }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Action Button: Refined, smaller & gleaming */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openReservationModal()}
            className="group relative hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#3f2932] via-[#4d323f] to-[#b66f79] text-white text-xs font-bold tracking-wide shadow-[0_6px_20px_-4px_rgba(182,111,121,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_8px_25px_-4px_rgba(182,111,121,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer overflow-hidden border border-white/20"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative flex h-1.5 w-1.5 rounded-full bg-[#f3d997] animate-pulse" />
            <span className="relative">Reserva tu momento</span>
            <span aria-hidden="true" className="relative text-[#f3d997] font-bold transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            ref={menuButton}
            type="button"
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-2 rounded-full border border-white/90 bg-white/70 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-[#3f2932] shadow-sm lg:hidden hover:bg-white transition-all cursor-pointer"
          >
            <span>{open ? 'Cerrar' : 'Menú'}</span>
            <span aria-hidden="true" className="text-base text-[#b66f79] font-bold">
              {open ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Mobile Dropdown Menu */}
      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Navegación móvil"
          className="pointer-events-auto max-w-6xl mx-auto mt-2 overflow-hidden rounded-3xl border border-white/90 bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(93,49,59,0.25)] p-4 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="space-y-1">
            {tabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: tab.to === '/' }}
                className="flex items-center justify-between rounded-2xl px-4 py-3 font-display text-lg text-[#3f2932] hover:bg-[#f7e2e1]/40 transition-colors"
                activeProps={{ className: 'bg-[#f7e2e1] !text-[#b66f79] font-bold' }}
              >
                {tab.label}
                <span aria-hidden="true" className="font-body text-xs text-[#826c73]">
                  ↗
                </span>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => {
                setOpen(false)
                openReservationModal()
              }}
              className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-full bg-gradient-to-r from-[#3f2932] via-[#4d323f] to-[#b66f79] text-white text-xs font-bold tracking-wide shadow-md cursor-pointer"
            >
              <span>Reserva tu momento</span>
              <span aria-hidden="true" className="text-[#f3d997]">↗</span>
            </button>
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
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-2xl p-[1.5px] bg-gradient-to-b from-[#fcedc7] via-[#d4af37] to-[#8a5a36] shadow-[0_4px_16px_rgba(212,175,55,0.4)]">
                <div className="h-full w-full rounded-[14px] overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src="/api/images/logo"
                    alt="GoldBlack Lash — logotipo"
                    width={120}
                    height={120}
                    className="h-full w-full object-cover rounded-[14px]"
                  />
                </div>
              </div>
              <div>
                <span className="font-display text-xl font-bold tracking-tight text-white block">
                  GoldBlack <span className="text-[#d4af37] font-serif italic">Lash</span>
                </span>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-white/60">
                  Studio de Miradas
                </span>
              </div>
            </div>

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

            <button
              type="button"
              onClick={() => openReservationModal()}
              className="button button-accent mt-7 focus-visible:outline-accent cursor-pointer"
            >
              Reservar cita ↗
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/15 pt-7 text-[0.65rem] leading-6 text-white/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {business.name}.
            Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
