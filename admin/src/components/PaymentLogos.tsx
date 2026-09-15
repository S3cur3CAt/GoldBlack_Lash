import React from 'react'

/**
 * Official Bizum Logo
 * Exact brand geometry: cyan circle with characteristic dots/connecting stroke and clean bizum logotype.
 */
export const LogoBizum: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="48" height="48" rx="12" fill="#00C4B4" />
        {/* Official Bizum glyph */}
        <circle cx="16" cy="18" r="4.5" fill="#FFFFFF" />
        <circle cx="32" cy="18" r="4.5" fill="#FFFFFF" />
        <circle cx="24" cy="31" r="5" fill="#FFFFFF" />
        <path
          d="M16 18C16 26 24 31 24 31C24 31 32 26 32 18"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-sans font-black tracking-tight text-[#00C4B4] text-xs lowercase">
        bizum
      </span>
    </div>
  )
}

/**
 * Real Credit Card Logos (Visa + Mastercard)
 * Official Visa wordmark + Mastercard overlapping red & yellow-orange circles.
 */
export const LogoCreditCards: React.FC<{ className?: string; height?: number }> = ({
  className = '',
  height = 20,
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Visa SVG Badge */}
      <div className="h-5 px-1.5 py-0.5 rounded bg-white flex items-center justify-center shadow-xs">
        <svg
          height={height * 0.7}
          viewBox="0 0 64 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M24.57 1.13L16.27 19.34H10.84L6.63 4.96C6.38 3.99 6.13 3.63 5.34 3.2C4.04 2.5 1.88 1.85 0 1.45L0.1 1.13H9.28C10.45 1.13 11.51 1.94 11.76 3.29L14.04 14.7L19.54 1.13H24.57ZM45.96 13.51C45.99 8.52 38.68 8.24 38.74 6.03C38.76 5.36 39.46 4.64 41.01 4.45C41.78 4.35 43.91 4.27 46.22 5.28L47.15 1.18C45.88 0.73 44.25 0.35 42.23 0.35C36.78 0.35 32.96 3.09 32.93 7.02C32.88 9.94 35.63 11.5 37.72 12.47C39.87 13.47 40.59 14.11 40.58 15.01C40.55 16.39 38.83 17.01 37.24 17.03C34.78 17.06 33.34 16.37 32.18 15.86L31.2 20.19C32.55 20.78 35.05 21.28 37.64 21.31C43.43 21.31 47.24 18.59 45.96 13.51ZM60.05 19.34H64.71L60.65 1.13H56.33C55.33 1.13 54.49 1.68 54.12 2.58L46.25 19.34H51.98L53.12 16.35H59.57L60.05 19.34ZM54.68 12.35L57.34 5.39L58.87 12.35H54.68ZM32.06 1.13L27.57 19.34H22.18L26.67 1.13H32.06Z"
            fill="#1434CB"
          />
        </svg>
      </div>

      {/* Mastercard SVG Badge */}
      <div className="h-5 px-1.5 py-0.5 rounded bg-ink-800 border border-line flex items-center justify-center shadow-xs">
        <svg
          height={height * 0.7}
          viewBox="0 0 36 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="11" cy="11" r="10" fill="#EB001B" />
          <circle cx="25" cy="11" r="10" fill="#F79E1B" fillOpacity="0.95" />
          <path
            d="M18 4.25C19.98 6.03 21.25 8.62 21.25 11.5C21.25 14.38 19.98 16.97 18 18.75C16.02 16.97 14.75 14.38 14.75 11.5C14.75 8.62 16.02 6.03 18 4.25Z"
            fill="#FF5F00"
          />
        </svg>
      </div>
    </div>
  )
}

/**
 * Realistic Euro Cash Icon
 */
export const LogoCash: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="3"
          y="10"
          width="42"
          height="28"
          rx="6"
          fill="#102619"
          stroke="#10B981"
          strokeWidth="2.5"
        />
        <circle cx="24" cy="24" r="7.5" fill="#064E3B" stroke="#34D399" strokeWidth="2" />
        <path
          d="M26.5 20.5C25.5 19.8 24 19.8 23 20.2C21.5 20.8 21 22.2 21 24C21 25.8 21.5 27.2 23 27.8C24 28.2 25.5 28.2 26.5 27.5M19.5 22.8H25M19.5 25.2H25"
          stroke="#6EE7B7"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="10" cy="24" r="2" fill="#34D399" />
        <circle cx="38" cy="24" r="2" fill="#34D399" />
      </svg>
    </div>
  )
}

/**
 * Bank / SEPA Transfer Icon
 */
export const LogoBankTransfer: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="12" fill="#141828" />
        {/* Pediment / Roof */}
        <path d="M24 10L38 17H10L24 10Z" fill="#60A5FA" />
        {/* Architrave */}
        <rect x="10" y="17" width="28" height="2.5" rx="1" fill="#93C5FD" />
        {/* 4 Pillars */}
        <rect x="13" y="21.5" width="3.5" height="12" rx="1" fill="#DBEAFE" />
        <rect x="20" y="21.5" width="3.5" height="12" rx="1" fill="#DBEAFE" />
        <rect x="27" y="21.5" width="3.5" height="12" rx="1" fill="#DBEAFE" />
        <rect x="34" y="21.5" width="3.5" height="12" rx="1" fill="#DBEAFE" />
        {/* Base / Podium */}
        <rect x="9" y="35" width="30" height="3" rx="1" fill="#93C5FD" />
      </svg>
    </div>
  )
}
