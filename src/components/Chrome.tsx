import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { openReservationModal } from '#/components/ReservationModal'
import { SeasonalHeaderDecor } from '#/components/SeasonalDecoration'
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
        {/* Main Floating Header Pill */}
        <div className="w-full relative z-10 flex items-center justify-between gap-3 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-2xl bg-[#0c0c11]/85 backdrop-blur-2xl border border-[#d4af37]/25 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.85),0_0_0_1px_rgba(212,175,55,0.15)_inset,0_0_20px_rgba(212,175,55,0.1)]">
        {/* Brand / Gleaming Rounded Logo */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          aria-label={`${business.name}, ir al inicio`}
          className="group flex items-center gap-2.5 sm:gap-3 py-0.5"
        >
          <div className="relative shrink-0">
            <SeasonalHeaderDecor effect={business.seasonalEffect} />
            {/* Elegant minimal luxury frame */}
            <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl p-[1px] bg-gradient-to-b from-[#d4af37]/35 via-[#d4af37]/15 to-white/5 border border-white/10 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:border-[#d4af37]/50 group-hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.9)]">
              <div className="h-full w-full rounded-[10px] overflow-hidden bg-[#08080c] flex items-center justify-center">
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
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#f5f5f7] group-hover:text-[#e5c158] transition-colors leading-none">
              GoldBlack <span className="text-[#e5c158] font-serif italic">Lash</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase text-[#9e9ea7] mt-0.5">
              Studio de Miradas
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 lg:flex"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.to === '/' }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#9e9ea7] hover:text-[#f5f5f7] hover:bg-white/10 transition-all duration-200"
              activeProps={{
                className: 'bg-linear-to-r from-[#fcedc7] via-[#d4af37] to-[#aa820a] !text-[#08080a] font-bold shadow-sm border border-[#fcedc7]/70 outline-none',
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
            className="group relative hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-[#fcedc7] via-[#d4af37] to-[#aa820a] text-[#08080a] text-xs font-extrabold tracking-wide shadow-[0_4px_12px_-2px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_6px_16px_-2px_rgba(0,0,0,0.85)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer overflow-hidden border border-white/40"
          >
            <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative">Reserva tu momento</span>
            <span aria-hidden="true" className="relative text-[#08080a] font-black transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            ref={menuButton}
            type="button"
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#121218]/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-[#f5f5f7] shadow-sm lg:hidden hover:bg-[#1c1c28] transition-all cursor-pointer"
          >
            <span>{open ? 'Cerrar' : 'Menú'}</span>
            <span aria-hidden="true" className="text-base text-[#e5c158] font-bold">
              {open ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </div>

      {/* Fused U-Shape Bottom Tray — smooth opacity fade in and fade out on scroll */}
      {subBar ? (
        <div
          className={`relative -mt-2 z-0 flex justify-center w-full transition-all duration-300 ease-out ${
            scrolled
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
          aria-hidden={!scrolled}
        >
          <div className="pointer-events-auto no-scrollbar flex items-center justify-center pt-3 pb-2 px-3 sm:px-6 bg-[#0c0c11]/95 backdrop-blur-2xl border-x border-b border-[#d4af37]/25 rounded-b-xl sm:rounded-b-2xl shadow-[0_16px_36px_-10px_rgba(0,0,0,0.85),0_0_0_1px_rgba(212,175,55,0.12)_inset] max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-3rem)] overflow-x-auto mx-auto">
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
          className="pointer-events-auto max-w-6xl mx-auto mt-2 overflow-hidden rounded-3xl border border-[#d4af37]/30 bg-[#0c0c11]/95 backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.95),0_0_30px_rgba(212,175,55,0.15)] p-4 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="space-y-1">
            {tabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: tab.to === '/' }}
                className="flex items-center justify-between rounded-2xl px-4 py-3 font-display text-lg text-[#f5f5f7] hover:bg-white/10 transition-colors"
                activeProps={{ className: 'bg-[#d4af37]/20 !text-[#e5c158] font-bold border border-[#d4af37]/40' }}
              >
                {tab.label}
                <span aria-hidden="true" className="font-body text-xs text-[#9e9ea7]">
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
              className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-linear-to-r from-[#fcedc7] via-[#d4af37] to-[#aa820a] text-[#08080a] text-xs font-extrabold tracking-wide shadow-md cursor-pointer"
            >
              <span>Reserva tu momento</span>
              <span aria-hidden="true" className="text-[#08080a] font-black">↗</span>
            </button>
          </div>
        </nav>
      ) : null}
    </header>
  )
}

export function Footer() {
  const business = useStudioConfig()
  return (
    <footer className="rounded-t-[3rem] bg-[#060608] text-white border-t border-[#d4af37]/20 md:rounded-t-[5rem]">
      <div className="wrap pt-14 pb-7 md:pt-20">
        <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.7fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl p-[1px] bg-gradient-to-b from-[#d4af37]/35 via-[#d4af37]/15 to-white/5 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                <div className="h-full w-full rounded-[11px] overflow-hidden bg-[#08080c] flex items-center justify-center">
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
              className="mt-6 inline-flex rounded-xl border border-white/20 px-5 py-3 text-xs text-white transition-colors hover:bg-white/10 focus-visible:outline-accent"
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
