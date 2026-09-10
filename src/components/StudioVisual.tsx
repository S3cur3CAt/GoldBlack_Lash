import { useState } from 'react'

export function StudioVisual({
  src,
  alt = '',
  label = 'El arte de realzar tu mirada',
  className = '',
  priority = false,
}: {
  src?: string
  alt?: string
  label?: string
  className?: string
  priority?: boolean
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (src && failedSrc !== src) {
    return (
      <div className={`studio-visual studio-visual-image ${className}`}>
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={`studio-visual ${className}`}>
      <div aria-hidden="true" className="studio-visual-orbit" />

      <div
        aria-hidden="true"
        className="studio-visual-orbit scale-125 opacity-50"
      />

      <svg
        viewBox="0 0 400 320"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M65 133C106 182 152 207 200 207C248 207 294 182 335 133"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />

        <g
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        >
          <path d="M82 151C71 156 61 166 53 181" />
          <path d="M105 171C95 181 87 194 83 208" />
          <path d="M134 189C125 203 120 218 118 230" />
          <path d="M166 202C161 217 159 233 160 246" />
          <path d="M200 207V253" />
          <path d="M234 202C239 217 241 233 240 246" />
          <path d="M266 189C275 203 280 218 282 230" />
          <path d="M295 171C305 181 313 194 317 208" />
          <path d="M318 151C329 156 339 166 347 181" />
        </g>

        <path
          d="M102 111C130 94 163 85 200 85C237 85 270 94 298 111"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />

        <path
          d="M311 60V88M297 74H325"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M77 81V97M69 89H85"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>

      <p className="visual-caption">{label}</p>
    </div>
  )
}