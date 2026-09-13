import type { ReactNode } from 'react'
 
export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
}: {
  eyebrow: string
  title: string
  lead?: string
  crumbs?: Array<{ label: string; to?: string }>
  children?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-blush/70">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-20 h-80 w-80 rounded-full border border-rose/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-rose/10"
      />

      <div className="wrap relative pt-8 pb-12 sm:pt-10 sm:pb-16 md:pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="eyebrow justify-center">{eyebrow}</p>

          <h1 className="mt-5 font-display text-[clamp(2.8rem,5.8vw,5.5rem)] leading-[1.08] tracking-[-0.035em] text-balance">
            {title}
          </h1>

          {lead ? (
            <p className="body-copy mx-auto mt-6 max-w-2xl">{lead}</p>
          ) : null}

          {children}
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
      <span className="text-xl text-rose">✧</span>
      <span className="h-px w-20 bg-line" />
    </div>
  )
}
