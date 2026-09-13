import React from 'react'
import type { SeasonalEffectType } from './SeasonalParticles'

interface SeasonalCornerBadgeProps {
  effect?: SeasonalEffectType
  className?: string
  position?: 'top-right' | 'top-left'
}

/**
 * Indicativo festivo / estacional de alta calidad para las esquinas
 * de tarjetas de precios, servicios y galería.
 */
export const SeasonalCornerBadge: React.FC<SeasonalCornerBadgeProps> = ({
  effect = 'none',
  className = '',
  position = 'top-right',
}) => {
  if (!effect || effect === 'none') return null

  const posClasses =
    position === 'top-right'
      ? '-top-3.5 -right-3.5 rotate-12'
      : '-top-3.5 -left-3.5 -rotate-12'

  return (
    <div
      className={`absolute ${posClasses} z-20 pointer-events-none select-none transition-transform duration-300 hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${className}`}
      aria-hidden="true"
    >
      {effect === 'snow' && (
        /* Gorro de Papá Noel rojo con borla blanca para Navidad */
        <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sombra base */}
          <ellipse cx="32" cy="54" rx="20" ry="4" fill="rgba(0,0,0,0.3)" />
          {/* Cono rojo del gorro */}
          <path
            d="M14 48 C 18 36, 28 20, 48 16 C 54 15, 52 24, 46 28 C 38 34, 46 44, 48 48 Z"
            fill="url(#santaRedGrad)"
          />
          {/* Pliegue sombra roja */}
          <path
            d="M34 26 C 42 22, 49 20, 48 24 C 42 29, 36 34, 38 42 Z"
            fill="#991b1b"
            opacity="0.4"
          />
          {/* Borde de pelo blanco inferior */}
          <rect x="10" y="44" width="40" height="12" rx="6" fill="url(#furWhiteGrad)" stroke="#e2e8f0" strokeWidth="0.8" />
          {/* Detalles textura pelaje */}
          <circle cx="16" cy="50" r="2.5" fill="#ffffff" />
          <circle cx="24" cy="49" r="3" fill="#f8fafc" />
          <circle cx="32" cy="50" r="3.2" fill="#ffffff" />
          <circle cx="40" cy="49" r="3" fill="#f8fafc" />
          <circle cx="46" cy="50" r="2.5" fill="#ffffff" />
          {/* Borla blanca de la punta */}
          <circle cx="49" cy="18" r="6" fill="url(#furWhiteGrad)" stroke="#e2e8f0" strokeWidth="0.8" />
          <circle cx="48" cy="17" r="2" fill="#ffffff" />
          <defs>
            <linearGradient id="santaRedGrad" x1="14" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id="furWhiteGrad" x1="10" y1="44" x2="50" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {effect === 'halloween' && (
        /* Calabaza festiva de Halloween con ojos brillantes */
        <svg width="42" height="42" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Tallo verde */}
          <path d="M32 14 C 33 8, 38 6, 42 7 C 40 11, 36 14, 34 16 Z" fill="#15803d" />
          {/* Cuerpo calabaza */}
          <ellipse cx="23" cy="38" rx="14" ry="17" fill="#ea580c" />
          <ellipse cx="41" cy="38" rx="14" ry="17" fill="#ea580c" />
          <ellipse cx="32" cy="38" rx="15" ry="19" fill="#f97316" />
          {/* Ojos triangulares tallados */}
          <polygon points="26,30 22,36 30,36" fill="#450a0a" />
          <polygon points="38,30 34,36 42,36" fill="#450a0a" />
          {/* Nariz */}
          <polygon points="32,38 30,42 34,42" fill="#450a0a" />
          {/* Sonrisa tenebrosa */}
          <path d="M22 46 Q 32 54 42 46 Q 39 49 32 50 Q 25 49 22 46 Z" fill="#450a0a" />
          {/* Brillo dorado en ojos */}
          <circle cx="25" cy="34" r="1.5" fill="#fef08a" />
          <circle cx="37" cy="34" r="1.5" fill="#fef08a" />
        </svg>
      )}

      {effect === 'sakura' && (
        /* Ramo delicado de flor de cerezo de primavera */
        <svg width="42" height="42" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Tallo sutil */}
          <path d="M20 44 Q 32 32 44 20" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
          {/* Flor central */}
          <g transform="translate(32, 28)">
            {[0, 72, 144, 216, 288].map((rot) => (
              <path
                key={rot}
                d="M0 0 C -6 -10, -4 -16, 0 -17 C 4 -16, 6 -10, 0 0"
                fill="#fbcfe8"
                stroke="#f472b6"
                strokeWidth="0.8"
                transform={`rotate(${rot})`}
              />
            ))}
            <circle cx="0" cy="0" r="3" fill="#f43f5e" />
            <circle cx="0" cy="0" r="1.5" fill="#fef08a" />
          </g>
        </svg>
      )}

      {effect === 'leaves' && (
        /* Hoja de otoño de arce en ámbar dorado */
        <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Tallo */}
          <path d="M18 50 L 26 40" stroke="#713f12" strokeWidth="2.5" strokeLinecap="round" />
          {/* Hoja de arce */}
          <path
            d="M26 40 C 22 36, 14 36, 16 28 C 22 30, 26 26, 26 22 C 28 14, 36 14, 38 22 C 38 26, 42 30, 48 28 C 50 36, 42 36, 38 40 Z"
            fill="url(#autumnGrad)"
            stroke="#9a3412"
            strokeWidth="0.8"
          />
          {/* Nervadura central */}
          <path d="M26 40 Q 32 30 38 22" stroke="#7c2d12" strokeWidth="1" />
          <defs>
            <linearGradient id="autumnGrad" x1="16" y1="14" x2="48" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {effect === 'rose_petals' && (
        /* Rosa roja aterciopelada de San Valentín */
        <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="16" fill="#881337" />
          <circle cx="32" cy="32" r="12" fill="#9f1239" />
          <path d="M24 28 C 28 20, 36 20, 40 28 C 36 34, 28 34, 24 28 Z" fill="#be123c" />
          <path d="M26 34 C 30 40, 34 40, 38 34" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="32" cy="31" r="4" fill="#e11d48" />
        </svg>
      )}

      {effect === 'gold_dust' && (
        /* Sello de Oro 24k GoldBlack Atelier */
        <svg width="42" height="42" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="17" fill="#181824" stroke="#d4af37" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="14" fill="#08080a" stroke="#d4af37" strokeWidth="0.8" strokeDasharray="2 2" />
          {/* Estrella dorada de 4 puntas */}
          <path
            d="M32 20 L34 29 L43 32 L34 35 L32 44 L30 35 L21 32 L30 29 Z"
            fill="url(#goldBadgeGrad)"
          />
          <circle cx="32" cy="32" r="1.5" fill="#ffffff" />
          <defs>
            <linearGradient id="goldBadgeGrad" x1="21" y1="20" x2="43" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {effect === 'new_year' && (
        /* Estrella diamantada de Fin de Año con destellos dorados */
        <svg width="42" height="42" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M32 12 L36 26 L50 32 L36 38 L32 52 L28 38 L14 32 L28 26 Z"
            fill="url(#nyGrad)"
          />
          <circle cx="32" cy="32" r="3" fill="#ffffff" />
          <defs>
            <linearGradient id="nyGrad" x1="14" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      )}
    </div>
  )
}

interface SeasonalHeaderDecorProps {
  effect?: SeasonalEffectType
}

/**
 * Decoración sutil y festiva para el logotipo o barra del encabezado principal
 */
export const SeasonalHeaderDecor: React.FC<SeasonalHeaderDecorProps> = ({ effect = 'none' }) => {
  if (!effect || effect === 'none') return null

  if (effect === 'snow') {
    // Gorrito navideño miniatura en el logo
    return (
      <span
        className="absolute -top-3 -right-2 z-20 pointer-events-none drop-shadow-md select-none transform rotate-12"
        title="¡Feliz Navidad desde GoldBlack Lash!"
      >
        <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
          <path d="M14 48 C 18 36, 28 20, 48 16 C 54 15, 52 24, 46 28 C 38 34, 46 44, 48 48 Z" fill="#dc2626" />
          <rect x="10" y="44" width="40" height="12" rx="6" fill="#ffffff" />
          <circle cx="49" cy="18" r="6" fill="#ffffff" />
        </svg>
      </span>
    )
  }

  if (effect === 'halloween') {
    // Calabaza / murciélago miniatura
    return (
      <span
        className="absolute -top-3 -right-2 z-20 pointer-events-none drop-shadow-md select-none transform rotate-6"
        title="¡Feliz Halloween desde GoldBlack Lash!"
      >
        <span className="text-base" role="img" aria-label="Halloween">🎃</span>
      </span>
    )
  }

  if (effect === 'sakura') {
    return (
      <span
        className="absolute -top-2.5 -right-2.5 z-20 pointer-events-none drop-shadow-md select-none"
        title="Primavera en GoldBlack Lash"
      >
        <span className="text-sm" role="img" aria-label="Primavera">🌸</span>
      </span>
    )
  }

  if (effect === 'leaves') {
    return (
      <span
        className="absolute -top-2.5 -right-2.5 z-20 pointer-events-none drop-shadow-md select-none"
        title="Otoño en GoldBlack Lash"
      >
        <span className="text-sm" role="img" aria-label="Otoño">🍂</span>
      </span>
    )
  }

  if (effect === 'rose_petals') {
    return (
      <span
        className="absolute -top-2.5 -right-2.5 z-20 pointer-events-none drop-shadow-md select-none"
        title="San Valentín en GoldBlack Lash"
      >
        <span className="text-sm" role="img" aria-label="San Valentín">🌹</span>
      </span>
    )
  }

  if (effect === 'gold_dust') {
    return (
      <span
        className="absolute -top-2 -right-2 z-20 pointer-events-none drop-shadow-md select-none"
        title="Firma Atelier GoldBlack"
      >
        <span className="text-xs text-gold-400">✦</span>
      </span>
    )
  }

  if (effect === 'new_year') {
    return (
      <span
        className="absolute -top-2.5 -right-2.5 z-20 pointer-events-none drop-shadow-md select-none"
        title="¡Feliz Año Nuevo!"
      >
        <span className="text-sm" role="img" aria-label="Fin de Año">✨</span>
      </span>
    )
  }

  return null
}
