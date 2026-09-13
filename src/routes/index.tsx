import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { StudioVisual } from '#/components/StudioVisual'
import { openReservationModal } from '#/components/ReservationModal'
import {
  business,
  faqs,
} from '#/data/site'

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: [
      {
        title: `${business.name} — Enamórate de tu mirada`,
      },
      {
        name: 'description',
        content:
          'Extensiones de pestañas y cuidado facial con diseño personalizado. Descubre tu efecto ideal y disfruta de un momento para ti en GoldBlack Lash.',
      },
    ],
  }),
})

function Home() {
  return (
    <>
      <Hero />
      <ServicesPreview />
      <Experience />
      <FaqSection />
    </>
  )
}

const heroVideos = [
  { key: 'hero-video', file: 'hero-video.mp4' },
  { key: 'hero-video-2', file: 'hero-video-2.mp4' },
  { key: 'hero-video-3', file: 'hero-video-3.mp4' },
]

function Hero() {
  const [activeVideo, setActiveVideo] = useState(0)
  const video0Ref = useRef<HTMLVideoElement>(null)
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)
  const videoRefs = [video0Ref, video1Ref, video2Ref]

  const handleEnded = (index: number) => {
    const nextIndex = (index + 1) % heroVideos.length
    const nextVideo = videoRefs[nextIndex]?.current
    if (nextVideo) {
      nextVideo.currentTime = 0
      nextVideo.play().catch(() => {})
    }
    setActiveVideo(nextIndex)
  }

  useEffect(() => {
    if (video0Ref.current) {
      video0Ref.current.play().catch(() => {})
    }
  }, [])

  return (
    <section className="beauty-hero rounded-b-[3rem] md:rounded-b-[5rem]">
      {/* Videos de fondo en bucle alternado (servidos desde Supabase) */}
      {heroVideos.map((vid, index) => (
        <video
          key={vid.key}
          ref={videoRefs[index]}
          autoPlay={index === 0}
          muted
          playsInline
          preload={index === 0 ? 'auto' : 'metadata'}
          aria-hidden="true"
          tabIndex={-1}
          onEnded={() => handleEnded(index)}
          onError={() => handleEnded(index)}
          className={`hero-video-bg ${activeVideo === index ? 'hero-video-active' : 'hero-video-inactive'}`}
        >
          <source src={`/${vid.file}`} type="video/mp4" />
          <source src={`/api/images/${vid.key}`} type="video/mp4" />
        </video>
      ))}

      {/* Velo estético de luminosidad para legibilidad y elegancia */}
      <div className="hero-video-overlay" aria-hidden="true" />

      <div className="wrap relative z-10 pt-9 pb-7 text-center sm:pt-12 sm:pb-8 md:pt-18 md:pb-12">
        <div className="reveal-in">
          <p className="eyebrow justify-center">
            {business.city} · Estudio de pestañas
          </p>

          <h1 className="hero-title mx-auto mt-6 max-w-5xl">
            Enamórate de
            <br />
            <em>tu mirada.</em>
          </h1>

          <p className="body-copy mx-auto mt-6 max-w-lg text-[#f5f5f7] font-medium text-[1.05rem] leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            Pestañas que realzan lo que te hace única. Un diseño a tu
            medida y un momento de cuidado solo para ti.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => openReservationModal()}
              className="button button-dark sm:w-auto cursor-pointer"
            >
              Reserva tu momento
              <span aria-hidden="true">↗</span>
            </button>

            <Link
              to="/servicios"
              className="button sm:w-auto"
            >
              Descubre tu efecto
            </Link>
          </div>
        </div>

        <div className="hero-gallery reveal-in reveal-delay">
          <div className="hero-side hero-side-left">
            <StudioVisual
              src="/api/images/pieza-01"
              alt="Detalle de un diseño de pestañas clásicas"
            />
          </div>

          <div className="hero-center">
            <StudioVisual
              src="/api/images/pieza-04"
              alt="Detalle de un diseño de pestañas híbridas"
              priority
            />
          </div>

          <div className="hero-side hero-side-right">
            <StudioVisual
              src="/api/images/pieza-05"
              alt="Detalle de lifting natural con efecto apertura"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function ServicesPreview() {
  return (
    <section className="section">
      <div className="wrap">
        <header className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">
            Encuentra tu favorito
          </p>

          <h2 className="section-title mt-5">
            Una mirada,
            <br />
            muchas formas de brillar.
          </h2>

          <p className="body-copy mx-auto mt-5 max-w-lg">
            Desde un acabado delicado hasta un volumen que no pasa
            desapercibido. Encontramos el efecto que mejor encaja contigo.
          </p>
        </header>

        <div className="mt-9 text-center">
          <Link to="/servicios" className="button">
            Ver todos los servicios
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function Experience() {
  const details = [
    {
      title: 'Primero, te escucho',
      body:
        'Hablamos de tu estilo, de tu rutina y de cómo te gustaría verte.',
    },
    {
      title: 'Después, diseñamos',
      body:
        'Elegimos un efecto que tenga en cuenta tu ojo y tu pestaña natural.',
    },
    {
      title: 'Ahora, relájate',
      body:
        'Disfruta de tu momento mientras trabajamos con calma y atención.',
    },
  ]

  return (
    <section className="px-3 md:px-6">
      <div className="rounded-[3rem] bg-lilac/70 py-16 md:rounded-[4rem] md:py-20">
        <div className="wrap grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-md pb-9">
            <div className="overflow-hidden rounded-t-[12rem] rounded-b-[3rem] border-4 border-[#d4af37]/40 shadow-panel">
              <StudioVisual
                src="/api/images/pieza-05"
                alt="Detalle de volumen ruso"
                label=""
                className="rounded-none!"
              />
            </div>

            <div className="absolute right-2 bottom-0 left-2 rounded-[1.8rem] border border-[#d4af37]/30 bg-[#0e0e14]/95 px-6 py-5 text-center shadow-soft sm:right-6 sm:left-6">
              <p className="font-display text-2xl italic text-rose">
                “Más que pestañas,
                <br />
                un momento para ti.”
              </p>
            </div>
          </div>

          <div>
            <p className="eyebrow">
              La experiencia GoldBlack
            </p>

            <h2 className="section-title mt-5">
              Aquí, el cuidado
              <br />
              empieza contigo.
            </h2>

            <p className="body-copy mt-6">
              No se trata solo de elegir una técnica. Se trata de sentirte
              cómoda, escuchada y feliz con tu mirada.
            </p>

            <ol className="mt-8 space-y-6">
              {details.map((item, index) => (
                <li key={item.title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#161622] border border-[#d4af37]/30 font-display text-lg text-rose">
                    {index + 1}
                  </span>

                  <div>
                    <h3 className="font-display text-xl">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm leading-7 text-muted">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <Link to="/sobre-mi" className="text-link mt-8">
              Conoce el estudio
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}


function FaqSection() {
  return (
    <section className="pb-16 md:pb-24">
      <div className="wrap">
        <div className="soft-panel grid gap-10 p-7 md:p-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow">
              Estamos para ayudarte
            </p>

            <h2 className="section-title mt-5">
              ¿Es tu
              <br />
              primera vez?
            </h2>

            <p className="body-copy mt-5">
              Es normal tener preguntas. Queremos que llegues a tu cita
              con tranquilidad y sepas qué esperar.
            </p>

            <Link
              to="/servicios"
              hash="faq"
              className="text-link mt-6"
            >
              Resolver todas mis dudas
              <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="space-y-3">
            {faqs.slice(0, 3).map((faq) => (
              <details
                key={faq.q}
                className="group rounded-[1.4rem] bg-paper px-5 py-5"
              >
                <summary className="flex list-none items-center justify-between gap-5 text-sm font-semibold leading-6">
                  {faq.q}

                  <span
                    aria-hidden="true"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#181824] border border-[#d4af37]/30 text-lg text-rose transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>

                <p className="mt-4 text-sm leading-7 text-muted">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

