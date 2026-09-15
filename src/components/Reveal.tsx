import { useEffect, useRef } from 'react'
import type { CSSProperties, ElementType, ReactNode } from 'react'

/**
 * Observador compartido: todas las instancias de <Reveal> usan el mismo
 * IntersectionObserver y se des-registran al hacerse visibles.
 */
let sharedObserver: IntersectionObserver | null = null

function getObserver() {
  if (typeof window === 'undefined') return null

  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            sharedObserver?.unobserve(entry.target)
          }
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px',
      },
    )
  }

  return sharedObserver
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    // Sin animación si el usuario prefiere menos movimiento.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.classList.add('is-visible')
      return
    }

    // Si ya está en pantalla al montar, evitamos el observador.
    const bounds = element.getBoundingClientRect()
    if (bounds.top < window.innerHeight && bounds.bottom > 0) {
      const raf = requestAnimationFrame(() => {
        element.classList.add('is-visible')
      })
      return () => cancelAnimationFrame(raf)
    }

    const observer = getObserver()
    observer?.observe(element)

    return () => observer?.unobserve(element)
  }, [])

  return ref
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  /** Retardo de entrada en milisegundos (para escalonar tarjetas). */
  delay?: number
  as?: ElementType
}) {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}
