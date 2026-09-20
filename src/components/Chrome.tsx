import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { openReservationModal } from '#/components/ReservationModal'
import { useHeaderSubBar } from '#/context/HeaderContext'
import { useStudioConfig } from '#/context/StudioConfigContext'

export const tabs = [
  { to: '/', label: 'Inicio' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/galeria', label: 'Resultados' },
  { to: '/sobre-mi', label: 'El estudio' },
  { to: '/contacto', label: 'Contacto' },
] as const

export function Header() {
  const business = useStudioConfig()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const { subBar } = useHeaderSubBar()

  const pathname = useLocation({
    select: (location) => location.pathname,
  })

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (pathname.includes('nueva-cita')) {
    return null
  }

  // Show U-dock only after user scrolls past 200px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200)
    onScroll() // check initial position
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      <div className="pointer-events-auto max-w-6xl mx-auto flex flex-col items-center">
        {/* Main Floating Header Pill — cristal blanco con borde multicolor */}
        <div
          className="w-full relative z-10 flex items-center justify-between gap-3 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-2xl border border-transparent backdrop-blur-2xl bg-white/85 shadow-[0_16px_40px_-16px_rgba(236,72,153,0.35)]"
          style={{
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(253,242,248,0.88)) padding-box, linear-gradient(155deg, rgba(236,72,153,0.45), rgba(251,146,60,0.25) 45%, rgba(192,132,252,0.4)) border-box',
          }}
        >
        {/* Brand / Logo con halo dorado */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          aria-label={`${business.name}, ir al inicio`}
          className="group flex items-center gap-2.5 sm:gap-3 py-0.5"
        >
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-2xl bg-[radial-gradient(closest-side,rgba(236,72,153,0.35),rgba(251,146,60,0.2),transparent)] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl p-px bg-linear-to-b from-[#f472b6] via-[#fb923c] to-[#c084fc] border border-white/60 shadow-[0_4px_16px_-4px_rgba(236,72,153,0.5)] transition-all duration-300 group-hover:border-[#ec4899]/60">
              <div className="h-full w-full rounded-[10px] overflow-hidden bg-[#fdf2f8] flex items-center justify-center">
                <img
                  src="/api/images/logo"
                  alt="GoldBlack Lash — logotipo"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col text-left">
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-ink group-hover:text-rose transition-colors leading-none">
              GoldBlack <span className="font-serif italic text-gold-gradient">Lash</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 bg-[#fdf2f8]/80 p-1 rounded-xl border border-[#ec4899]/15 lg:flex"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.to === '/' }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-ink hover:bg-white transition-all duration-200"
              activeProps={{
                className: 'bg-linear-to-r from-[#f472b6] via-[#ec4899] to-[#fb923c] !text-white font-bold shadow-sm border border-white/60 outline-none',
              }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Action Button: degradado rosa-melocotón con shimmer */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openReservationModal()}
            className="group relative hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-[#f472b6] via-[#ec4899] to-[#fb923c] text-white text-xs font-extrabold tracking-wide shadow-[0_4px_14px_-2px_rgba(236,72,153,0.55),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_6px_20px_-2px_rgba(236,72,153,0.65),0_0_18px_rgba(251,146,60,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer overflow-hidden border border-white/50"
          >
            <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative">Reserva tu momento</span>
            <span aria-hidden="true" className="relative text-white font-black transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            ref={menuButton}
            type="button"
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-2 rounded-xl border border-[#ec4899]/30 bg-white/85 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-ink shadow-sm lg:hidden hover:bg-[#fdf2f8] transition-all cursor-pointer"
          >
            <span>{open ? 'Cerrar' : 'Menú'}</span>
            <span aria-hidden="true" className="text-base text-rose font-bold">
              {open ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </div>

      {/* U-Shape Bottom Tray — bandeja inferior clara */}
      {subBar ? (
        <div
          className={`relative -mt-2 z-0 flex justify-center w-full transition-all duration-300 ease-out ${
            scrolled
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
          aria-hidden={!scrolled}
        >
          <div
            className="pointer-events-auto no-scrollbar flex items-center justify-start sm:justify-center pt-2.5 pb-2 px-3 sm:px-6 rounded-2xl border border-transparent backdrop-blur-2xl max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-3rem)] overflow-x-auto overscroll-x-contain touch-pan-x mx-auto shadow-[0_16px_36px_-16px_rgba(236,72,153,0.35)]"
            style={{
              background:
                'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(253,242,248,0.88)) padding-box, linear-gradient(155deg, rgba(236,72,153,0.4), rgba(251,146,60,0.2) 45%, rgba(192,132,252,0.35)) border-box',
            }}
          >
            {subBar}
          </div>
        </div>
      ) : null}
    </div>

      {/* Floating Mobile Dropdown Menu */}
      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Navegación móvil"
          className="pointer-events-auto max-w-6xl mx-auto mt-2 overflow-hidden rounded-3xl border border-[#ec4899]/25 bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(236,72,153,0.35)] p-4 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="space-y-1">
            {tabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: tab.to === '/' }}
                className="flex items-center justify-between rounded-2xl px-4 py-3 font-display text-lg text-ink hover:bg-[#fdf2f8] transition-colors"
                activeProps={{ className: 'bg-[#fce7f3] !text-[#db2777] font-bold border border-[#ec4899]/30' }}
              >
                {tab.label}
                <span aria-hidden="true" className="font-body text-xs text-muted">
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
              className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-linear-to-r from-[#f472b6] via-[#ec4899] to-[#fb923c] text-white text-xs font-extrabold tracking-wide shadow-md cursor-pointer"
            >
              <span>Reserva tu momento</span>
              <span aria-hidden="true" className="text-white font-black">↗</span>
            </button>
          </div>
        </nav>
      ) : null}
    </header>
  )
}

export function Footer() {
  const business = useStudioConfig()
  const pathname = useLocation({
    select: (location) => location.pathname,
  })

  if (pathname.includes('nueva-cita')) {
    return null
  }
  return (
    <footer className="relative z-10 overflow-hidden rounded-t-[3rem] bg-gradient-to-b from-white via-[#fdf2f8] to-[#fff7ed] text-ink border-t border-[#ec4899]/20 md:rounded-t-[5rem]">
      {/* Halos coloridos superiores */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/4 h-64 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(236,72,153,0.18),transparent)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[10%] h-56 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(251,146,60,0.16),transparent)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-[60%] h-48 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(192,132,252,0.16),transparent)] blur-2xl"
      />

      <div className="wrap relative pt-14 pb-7 md:pt-20">
        <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.7fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl p-px bg-linear-to-b from-[#f472b6] via-[#fb923c] to-[#c084fc] border border-white/70 shadow-[0_4px_20px_rgba(236,72,153,0.3)]">
                <div className="h-full w-full rounded-[11px] overflow-hidden bg-[#fdf2f8] flex items-center justify-center">
                  <img
                    src="/api/images/logo"
                    alt="GoldBlack Lash — logotipo"
                    width={120}
                    height={120}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div>
                <span className="font-display text-xl font-bold tracking-tight text-ink block">
                  GoldBlack <span className="font-serif italic text-gold-gradient">Lash</span>
                </span>
              </div>
            </div>

            <p className="mt-6 max-w-xs text-sm leading-7 text-muted">
              Un pequeño momento para ti.
              <br />
              Una nueva forma de mirar.
            </p>

            <a
              href={business.instagram}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-xl border border-[#ec4899]/25 bg-white px-5 py-3 text-xs font-bold text-[#db2777] transition-all hover:bg-[#fdf2f8] hover:border-[#ec4899]/50 focus-visible:outline-accent shadow-sm"
            >
              Síguenos en Instagram ↗
            </a>
          </div>

          <div>
            <h2 className="font-body text-xs font-semibold tracking-widest uppercase text-ink">
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
            <h2 className="font-body text-xs font-semibold tracking-widest uppercase text-ink">
              Tu visita
            </h2>

            <address className="mt-6 text-sm leading-7 text-muted not-italic">
              {business.address}
              <br />
              {business.postalCode} {business.city}
            </address>

            <ul className="mt-6 space-y-3 text-xs text-muted">
              {business.hours.map((slot) => (
                <li key={slot.days} className="flex justify-between gap-3">
                  <span>{slot.days}</span>
                  <span>{slot.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-body text-xs font-semibold tracking-widest uppercase text-ink">
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
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-[#ec4899]/15 pt-7 text-[0.65rem] leading-6 text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {business.name}.
            Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
