import React from 'react'
import { resolveSeasonalEffect, type SeasonalEffectType } from '../utils/seasonalCalendar'

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
  const activeEffect = resolveSeasonalEffect(effect)
  if (!activeEffect || activeEffect === 'none') return null

  if (activeEffect === 'snow') {
    return (
      <div
        className={`absolute z-20 pointer-events-none select-none transition-transform duration-300 hover:scale-110 drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)] ${className}`}
        style={
          position === 'top-right'
            ? {
                top: '-24px',
                right: '-8px',
                transformOrigin: '26px 42px',
                transform: 'rotate(45deg)',
              }
            : {
                top: '-24px',
                left: '-8px',
                transformOrigin: '26px 42px',
                transform: 'rotate(-45deg) scaleX(-1)',
              }
        }
        aria-hidden="true"
      >
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sombra base del gorro proyectada sobre la esquina de la tarjeta */}
          <path
            d="M 7 40 C 17 47, 35 47, 45 40 C 43 46, 33 51, 26 51 C 19 51, 9 46, 7 40 Z"
            fill="rgba(0, 0, 0, 0.45)"
          />
          {/* Cono rojo del gorro de Papá Noel */}
          <path
            d="M 10 38 C 12 24, 21 12, 33 8 C 38 6, 42 11, 38 16 C 33 22, 37 31, 42 38 C 32 42, 20 42, 10 38 Z"
            fill="url(#santaRedGrad)"
          />
          {/* Pliegue sombra terciopelo profundo */}
          <path
            d="M 26 22 C 33 19, 38 17, 37 20 C 33 25, 31 30, 33 36 C 30 37, 28 34, 26 22 Z"
            fill="#7f1d1d"
            opacity="0.4"
          />
          {/* Borde de pelo blanco que abraza ergonómicamente la curva de la esquina */}
          <path
            d="M 6 36 C 18 41.5, 34 41.5, 46 36 C 47 43.5, 35 48.5, 26 48.5 C 17 48.5, 5 43.5, 6 36 Z"
            fill="url(#furWhiteGrad)"
            stroke="#cbd5e1"
            strokeWidth="0.8"
          />
          {/* Textura pomposa de pelo */}
          <circle cx="11" cy="39.5" r="3.2" fill="#ffffff" />
          <circle cx="18" cy="42" r="3.6" fill="#f8fafc" />
          <circle cx="26" cy="43.5" r="3.8" fill="#ffffff" />
          <circle cx="34" cy="42" r="3.6" fill="#f8fafc" />
          <circle cx="41" cy="39.5" r="3.2" fill="#ffffff" />
          {/* Borla blanca esponjosa en la punta */}
          <circle cx="36" cy="11" r="5.5" fill="url(#furWhiteGrad)" stroke="#cbd5e1" strokeWidth="0.8" />
          <circle cx="35" cy="10" r="2.2" fill="#ffffff" />
          <defs>
            <linearGradient id="santaRedGrad" x1="10" y1="8" x2="42" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="25%" stopColor="#ef4444" />
              <stop offset="70%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id="furWhiteGrad" x1="6" y1="36" x2="46" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  }

  const posClasses =
    position === 'top-right'
      ? '-top-3.5 -right-3.5 rotate-12'
      : '-top-3.5 -left-3.5 -rotate-12'

  return (
    <div
      className={`absolute ${posClasses} z-20 pointer-events-none select-none transition-transform duration-300 hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${className}`}
      aria-hidden="true"
    >

      {activeEffect === 'halloween' && (
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

      {activeEffect === 'sakura' && (
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

      {activeEffect === 'leaves' && (
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

      {activeEffect === 'rose_petals' && (
        /* Rosa roja aterciopelada de San Valentín */
        <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="16" fill="#881337" />
          <circle cx="32" cy="32" r="12" fill="#9f1239" />
          <path d="M24 28 C 28 20, 36 20, 40 28 C 36 34, 28 34, 24 28 Z" fill="#be123c" />
          <path d="M26 34 C 30 40, 34 40, 38 34" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="32" cy="31" r="4" fill="#e11d48" />
        </svg>
      )}

      {activeEffect === 'gold_dust' && (
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

      {activeEffect === 'new_year' && (
        /* Estrella diamantada de Fin de Año con destellos dorados y fuegos artificiales */
        <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Chispas de fuegos artificiales alrededor */}
          <circle cx="18" cy="18" r="2" fill="#38bdf8" />
          <circle cx="48" cy="16" r="2.5" fill="#f43f5e" />
          <circle cx="12" cy="42" r="1.8" fill="#eab308" />
          <circle cx="50" cy="46" r="2.2" fill="#a855f7" />
          <circle cx="32" cy="6" r="2" fill="#facc15" />
          {/* Estrella principal brillante */}
          <path
            d="M32 10 L36.5 24.5 L51 29 L36.5 33.5 L32 48 L27.5 33.5 L13 29 L27.5 24.5 Z"
            fill="url(#nyGrad)"
          />
          <circle cx="32" cy="29" r="3.5" fill="#ffffff" />
          <defs>
            <linearGradient id="nyGrad" x1="13" y1="10" x2="51" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#fef08a" />
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
  const activeEffect = resolveSeasonalEffect(effect)
  if (!activeEffect || activeEffect === 'none') return null

  if (activeEffect === 'snow') {
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

  if (activeEffect === 'halloween') {
    // Calabaza miniatura
    return (
      <span
        className="absolute -top-3 -right-2 z-20 pointer-events-none drop-shadow-md select-none transform rotate-6"
        title="¡Feliz Halloween desde GoldBlack Lash!"
      >
        <span className="text-base" role="img" aria-label="Halloween">🎃</span>
      </span>
    )
  }

  if (activeEffect === 'sakura') {
    return (
      <span
        className="absolute -top-2.5 -right-2.5 z-20 pointer-events-none drop-shadow-md select-none"
        title="Primavera en GoldBlack Lash"
      >
        <span className="text-sm" role="img" aria-label="Primavera">🌸</span>
      </span>
    )
  }

  if (activeEffect === 'leaves') {
    return (
      <span
        className="absolute -top-2.5 -right-2.5 z-20 pointer-events-none drop-shadow-md select-none"
        title="Otoño en GoldBlack Lash"
      >
        <span className="text-sm" role="img" aria-label="Otoño">🍂</span>
      </span>
    )
  }

  if (activeEffect === 'rose_petals') {
    return (
      <span
        className="absolute -top-2.5 -right-2.5 z-20 pointer-events-none drop-shadow-md select-none"
        title="San Valentín en GoldBlack Lash"
      >
        <span className="text-sm" role="img" aria-label="San Valentín">🌹</span>
      </span>
    )
  }

  if (activeEffect === 'gold_dust') {
    return (
      <span
        className="absolute -top-2 -right-2 z-20 pointer-events-none drop-shadow-md select-none"
        title="Firma Atelier GoldBlack"
      >
        <span className="text-xs text-gold-400">✦</span>
      </span>
    )
  }

  if (activeEffect === 'new_year') {
    return (
      <span
        className="absolute -top-3 -right-3 z-20 pointer-events-none drop-shadow-md select-none animate-pulse"
        title="¡Feliz Año Nuevo! Fuegos Artificiales"
      >
        <span className="text-base" role="img" aria-label="Fuegos Artificiales Fin de Año">🎆</span>
      </span>
    )
  }

  return null
}
