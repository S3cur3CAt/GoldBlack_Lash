import type { ReactNode } from 'react'

import { Reveal } from '#/components/Reveal'

export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs: _crumbs,
  children,
}: {
  eyebrow: string
  title: string
  lead?: string
  crumbs?: Array<{ label: string; to?: string }>
  children?: ReactNode
}) {
  return (
    <section className="aurora-band relative overflow-hidden">
      {/* Halos aurora decorativos multicolor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[12%] h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(236,72,153,0.18),transparent)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 left-[8%] h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(192,132,252,0.18),transparent)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 left-[45%] h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(251,146,60,0.14),transparent)] blur-2xl"
      />

      <div className="wrap relative pt-8 pb-12 sm:pt-10 sm:pb-16 md:pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="eyebrow justify-center">{eyebrow}</p>

            <h1 className="mt-5 font-display text-[clamp(2.8rem,5.8vw,5.5rem)] leading-[1.08] tracking-[-0.035em] text-balance">
              {title}
            </h1>

            {lead ? (
              <p className="body-copy mx-auto mt-6 max-w-2xl">{lead}</p>
            ) : null}

            {children}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function Diamond({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-5 ${className}`}
    >
      <span className="h-px w-20 bg-line" />
      <span className="text-xl text-rose drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">✧</span>
      <span className="h-px w-20 bg-line" />
    </div>
  )
}
