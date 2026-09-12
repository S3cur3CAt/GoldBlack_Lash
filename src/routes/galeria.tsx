import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useRef, useState } from 'react'

import { PageHero } from '#/components/PageHero'
import { StudioVisual } from '#/components/StudioVisual'
import {
  business,
  galleryPieces as fallbackPieces,
  whatsappLink,
  type GalleryPiece,
} from '#/data/site'

const fetchLiveGallery = createServerFn({ method: 'GET' }).handler(async () => {
  const { fetchGalleryFromDb } = await import('../server/gallery.server')
  const dbItems = await fetchGalleryFromDb()
  return dbItems.map((item) => ({
    id: item.key || item.id,
    title: item.title,
    technique: item.category,
    detail: item.detail || '',
    image: item.image_url,
    price: item.price,
    badge: item.badge,
    featured: item.featured,
    elements: item.elements || [],
  }))
})

export const Route = createFileRoute('/galeria')({
  loader: async () => {
    try {
      const live = await fetchLiveGallery()
      return live && live.length > 0 ? live : fallbackPieces
    } catch {
      return fallbackPieces
    }
  },
  component: Galeria,
  head: () => ({
    meta: [
      {
        title: `Galería e inspiración — ${business.name}`,
      },
      {
        name: 'description',
        content:
          'Explora estilos de pestañas clásicas, híbridas, volumen y lifting. Encuentra inspiración para tu próxima cita en GoldBlack Lash.',
      },
    ],
  }),
})

const PRIORITY_TECHNIQUES = [
  'Volumen 3D',
  'Volumen 4D',
  'Volumen 5D',
  'Volumen 6D',
  'Volumen Ruso',
  'Volumen ruso',
  'Mega Volumen',
  'Clásicas Efecto Rímel',
  'Clásicas Pelo a Pelo',
  'Efecto Híbrido',
  'Híbridas / Kim',
  'Lifting de Pestañas',
  'Fibras Tecnológicas',
  'Densidad y Negro Intenso',
]

function Galeria() {
  const loaderPieces = Route.useLoaderData() || fallbackPieces
  const techniques = useMemo(() => {
    const rawSet = new Set<string>()
    loaderPieces.forEach((piece: any) => {
      if (piece.technique && typeof piece.technique === 'string') {
        rawSet.add(piece.technique.trim())
      }
    })
    const list = Array.from(rawSet)

    list.sort((a, b) => {
      const idxA = PRIORITY_TECHNIQUES.findIndex((p) => p.toLowerCase() === a.toLowerCase())
      const idxB = PRIORITY_TECHNIQUES.findIndex((p) => p.toLowerCase() === b.toLowerCase())
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.localeCompare(b)
    })

    return ['Todas', ...list]
  }, [loaderPieces])

  const [filter, setFilter] = useState('Todas')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const pieces = useMemo(
    () =>
      filter === 'Todas'
        ? loaderPieces
        : loaderPieces.filter((piece: any) => piece.technique === filter),
    [filter, loaderPieces],
  )

  const current = openIndex === null ? undefined : pieces[openIndex]

  const move = (direction: number) => {
    if (pieces.length < 2) return

    setOpenIndex((index) =>
      index === null
        ? null
        : (index + direction + pieces.length) % pieces.length,
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Un poquito de inspiración"
        title="Cada mirada tiene su propia belleza."
        lead="Explora efectos, texturas y curvaturas. Encuentra una referencia que te guste y la adaptamos a tu estilo y a tu pestaña natural."
        crumbs={[{ label: 'Galería' }]}
      />

      <div className="sticky top-20 sm:top-28 z-30 border-b border-line/70 bg-paper/95 backdrop-blur-xl">
        <ul
          aria-label="Filtrar diseños por técnica"
          className="wrap flex gap-2 overflow-x-auto py-3"
        >
          {techniques.map((technique) => (
            <li key={technique}>
              <button
                type="button"
                aria-pressed={filter === technique}
                onClick={() => {
                  setFilter(technique)
                  setOpenIndex(null)
                }}
                className={`category-tab ${
                  filter === technique ? 'is-active' : ''
                }`}
              >
                {technique}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
            <p
              aria-live="polite"
              aria-atomic="true"
              className="text-xs text-muted"
            >
              {pieces.length} {pieces.length === 1 ? 'diseño' : 'diseños'}
              {' · '}
              {filter}
            </p>

            <p className="text-xs text-muted">
              Abre tu favorito para descubrir los detalles
              <span aria-hidden="true" className="ml-2 text-rose">
                ♡
              </span>
            </p>
          </div>

          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {pieces.map((piece, index) => (
              <GalleryTile
                key={piece.id}
                piece={piece}
                onOpen={() => setOpenIndex(index)}
              />
            ))}
          </div>

          {!pieces.length ? (
            <div className="rounded-[2rem] border border-line bg-white px-6 py-14 text-center">
              <span aria-hidden="true" className="text-3xl text-rose">
                ✧
              </span>
              <h2 className="mt-4 font-display text-2xl">
                Pronto habrá más inspiración
              </h2>
              <p className="mt-3 text-sm text-muted">
                Todavía no hay diseños en esta categoría.
              </p>
            </div>
          ) : null}

          <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-7 text-muted">
            Las ilustraciones decorativas no representan resultados del
            tratamiento. Cada diseño se valora de forma individual.
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="wrap">
          <div className="rounded-[2.5rem] bg-blush px-6 py-12 text-center md:py-16">
            <span
              aria-hidden="true"
              className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-2xl text-rose"
            >
              ♡
            </span>

            <p className="eyebrow mt-6 justify-center">
              Sigamos inspirándonos
            </p>

            <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              Más miradas, más detalles.
            </h2>

            <p className="body-copy mx-auto mt-5 max-w-lg">
              En Instagram comparto novedades, inspiración y pequeños
              momentos del estudio.
            </p>

            <a
              href={business.instagram}
              target="_blank"
              rel="noreferrer"
              className="button button-dark mt-7"
            >
              {business.instagramHandle}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      {current && openIndex !== null ? (
        <Lightbox
          piece={current}
          position={openIndex + 1}
          total={pieces.length}
          onClose={() => setOpenIndex(null)}
          onPrevious={() => move(-1)}
          onNext={() => move(1)}
        />
      ) : null}
    </>
  )
}

function GalleryTile({
  piece,
  onOpen,
}: {
  piece: GalleryPiece
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`Ver ${piece.title}, ${piece.technique}`}
      onClick={onOpen}
      className="group min-w-0 rounded-[2rem] border border-line bg-white p-3 text-left shadow-soft transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative overflow-hidden rounded-[1.5rem]">
        <StudioVisual
          src={piece.image}
          alt={piece.title}
          label={piece.technique}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />

        <span className="absolute top-4 left-4 max-w-[calc(100%-2rem)] rounded-full bg-white/95 px-3 py-2 text-[0.6rem] font-semibold text-plum shadow-soft">
          {piece.technique}
        </span>

        <span
          aria-hidden="true"
          className="absolute right-4 bottom-4 grid h-11 w-11 place-items-center rounded-full bg-white text-lg text-rose shadow-soft transition-colors group-hover:bg-plum group-hover:text-white"
        >
          ↗
        </span>
      </div>

      <div className="px-3 pt-5 pb-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl">
            {piece.title}
          </h2>
          {piece.price && (
            <span className="font-display text-lg font-bold text-rose shrink-0">
              {piece.price}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs leading-6 text-muted">
          {piece.detail}
        </p>

        {piece.elements && piece.elements.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {piece.elements.map((el, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-blush px-2.5 py-0.5 text-[0.65rem] font-medium text-plum"
              >
                <span>♡</span>
                <span>{el}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function Lightbox({
  piece,
  position,
  total,
  onClose,
  onPrevious,
  onNext,
}: {
  piece: GalleryPiece
  position: number
  total: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow

    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus()
      }
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="gallery-dialog-title"
      aria-describedby="gallery-dialog-detail"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          onNext()
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          onPrevious()
        }
      }}
      className="fixed inset-0 m-auto w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-line bg-paper p-0 text-ink shadow-panel"
    >
      <div className="grid md:grid-cols-2">
        <div className="p-3 md:p-4">
          <StudioVisual
            key={piece.id}
            src={piece.image}
            alt={piece.title}
            label={piece.technique}
            className="max-md:max-h-[42dvh] md:h-full"
          />
        </div>

        <div className="flex min-w-0 flex-col px-6 pt-2 pb-7 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <p
              aria-live="polite"
              aria-atomic="true"
              className="text-xs text-muted"
            >
              Diseño {position} de {total}
            </p>

            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Cerrar visor"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-2xl text-rose transition-colors hover:bg-blush"
            >
              ×
            </button>
          </div>

          <div className="py-8 md:my-auto">
            <p className="eyebrow">{piece.technique}</p>

            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
              <h2
                id="gallery-dialog-title"
                className="font-display text-4xl leading-tight"
              >
                {piece.title}
              </h2>
              {piece.price && (
                <span className="font-display text-2xl font-bold text-rose">
                  {piece.price}
                </span>
              )}
            </div>

            <p id="gallery-dialog-detail" className="body-copy mt-4">
              {piece.detail}
            </p>

            {piece.elements && piece.elements.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {piece.elements.map((el, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1 text-xs font-medium text-plum"
                  >
                    <span>♡</span>
                    <span>{el}</span>
                  </span>
                ))}
              </div>
            )}

            <p className="mt-5 text-sm leading-7 text-muted">
              ¿Te gusta este estilo? Podemos tomarlo como referencia
              y valorar cómo adaptarlo a tu mirada.
            </p>

            <a
              href={whatsappLink(
                [
                  `*Me gusta este diseño — ${business.name}*`,
                  '---------------------------',
                  `*Diseño:* ${piece.title} (${piece.technique}${piece.price ? ` · ${piece.price}` : ''})`,
                  `*Referencia:* ${piece.detail}`,
                  '---------------------------',
                  '*Nombre:*',
                  '*Teléfono:*',
                  `${business.siteUrl}`,
                ].join('\n'),
              )}
              target="_blank"
              rel="noreferrer"
              className="button button-dark mt-7 w-full"
            >
              Me gusta este efecto
              <span aria-hidden="true">♡</span>
            </a>
          </div>

          <div className="flex justify-between gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={onPrevious}
              disabled={total < 2}
              className="min-h-11 rounded-full px-4 text-xs font-semibold text-muted transition-colors hover:bg-blush disabled:opacity-40"
            >
              ← Anterior
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={total < 2}
              className="min-h-11 rounded-full px-4 text-xs font-semibold text-muted transition-colors hover:bg-blush disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}