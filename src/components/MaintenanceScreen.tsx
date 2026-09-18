import type { StudioConfigData } from '../server/config.server'

interface MaintenanceScreenProps {
  liveConfig: StudioConfigData
}

export function MaintenanceScreen({ liveConfig }: MaintenanceScreenProps) {
  const whatsappUrl = liveConfig.phoneClean
    ? `https://wa.me/${liveConfig.phoneClean}?text=${encodeURIComponent(
        '¡Hola GoldBlack Lash! He visto que la web está en mantenimiento y quería consultar disponibilidad para una cita.'
      )}`
    : null

  const phoneTel = liveConfig.phoneClean ? `tel:${liveConfig.phoneClean}` : null

  return (
    <div className="relative min-h-screen w-full bg-[#08080a] text-ink flex flex-col justify-between overflow-x-hidden selection:bg-accent/30 selection:text-[#fff3d6]">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-128 w-200 rounded-full bg-radial from-accent/12 via-[#aa820a]/05 to-transparent blur-3xl opacity-70" />
        <div className="absolute -bottom-32 right-10 h-112 w-140 rounded-full bg-radial from-[#e5c158]/08 via-transparent to-transparent blur-3xl opacity-50" />
      </div>

      {/* Header bar */}
      <header className="relative z-10 w-full pt-6 sm:pt-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between py-3 px-5 sm:px-6 rounded-2xl bg-[#0c0c11]/80 backdrop-blur-2xl border border-accent/25 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl p-px bg-linear-to-b from-accent/35 via-accent/15 to-white/5 border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              <div className="h-full w-full rounded-[10px] overflow-hidden bg-[#08080c] flex items-center justify-center">
                <img
                  src="/api/images/logo"
                  alt="GoldBlack Lash Logo"
                  width={88}
                  height={88}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-ink leading-none">
                GoldBlack <span className="text-rose font-serif italic">Lash</span>
              </span>
              <span className="text-[9px] font-semibold tracking-widest uppercase text-muted mt-0.5">
                Studio de Miradas
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a1608] border border-accent/40 px-3 py-1 text-[0.68rem] font-bold tracking-wider text-rose uppercase shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-rose" />
            Mantenimiento
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 text-center max-w-4xl mx-auto w-full">
        {/* Featured Maintenance Illustration / Image */}
        <div className="w-full max-w-2xl mx-auto mb-8 sm:mb-10 group">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-accent/30 bg-[#101017] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.95),0_0_35px_rgba(212,175,55,0.12)]">
            <img
              src="/Mantenimiento.png"
              alt="Sitio web en mantenimiento — GoldBlack Lash"
              className="w-full h-auto object-contain max-h-105 sm:max-h-125 mx-auto block"
              loading="eager"
            />
            <div className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl border border-white/10" />
          </div>
        </div>

        {/* Text Details */}
        <div className="max-w-xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-[#121218]/90 px-3.5 py-1 text-xs font-semibold text-rose shadow-xs">
            <span>✦</span>
            <span>Estamos preparando novedades para ti</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight leading-tight">
            Volvemos en <em className="font-serif italic text-rose">muy poco.</em>
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-[#a5a5b2] max-w-lg mx-auto">
            Estamos realizando mejoras en nuestro estudio digital para ofrecerte una experiencia aún más exclusiva. Mientras tanto, seguimos atendiéndote con cita previa por nuestros canales habituales:
          </p>

          {/* Contact Actions */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="button button-dark cursor-pointer text-xs"
              >
                <span>WhatsApp directo</span>
                <span aria-hidden="true">↗</span>
              </a>
            )}

            {phoneTel && (
              <a
                href={phoneTel}
                className="button cursor-pointer text-xs"
              >
                <span>Llamar {liveConfig.phoneDisplay}</span>
              </a>
            )}

            {liveConfig.instagram && (
              <a
                href={liveConfig.instagram}
                target="_blank"
                rel="noreferrer"
                className="button cursor-pointer text-xs"
              >
                <span>Instagram {liveConfig.instagramHandle || '@goldblack_lash'} ↗</span>
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 px-4 text-center border-t border-accent/15 bg-[#0a0a0e]/60 backdrop-blur-md">
        <p className="text-xs text-[#7e7e8d]">
          © {new Date().getFullYear()} {liveConfig.name || 'GoldBlack Lash'} · {liveConfig.city || 'Dos Hermanas, Sevilla'}. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
