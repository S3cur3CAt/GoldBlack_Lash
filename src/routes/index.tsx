import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { StudioVisual } from '#/components/StudioVisual'
import { openReservationModal } from '#/components/ReservationModal'
import { Reveal } from '#/components/Reveal'
import {
  business,
  faqs,
  serviceCategories,
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
  { key: 'hero-video-4', file: 'hero-video-4.mp4' },
  { key: 'hero-video-5', file: 'hero-video-5.mp4' },
]

function Hero() {
  const [activeVideo, setActiveVideo] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const heroRef = useRef<HTMLElement>(null)

  const handleEnded = () => {
    setActiveVideo((prev) => (prev + 1) % heroVideos.length)
  }

  // Pausar automáticamente el decodificador de vídeo cuando el hero no está visible
  // Libera de forma masiva memoria y GPU en dispositivos móviles al hacer scroll
  useEffect(() => {
    const heroEl = heroRef.current
    const videoEl = videoRef.current
    if (!heroEl || !videoEl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoEl.play().catch(() => {})
        } else {
          videoEl.pause()
        }
      },
      { threshold: 0.05 }
    )

    observer.observe(heroEl)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [activeVideo])

  const currentVid = heroVideos[activeVideo]

  return (
    <section ref={heroRef} className="beauty-hero rounded-b-[3rem] md:rounded-b-[5rem]">
      {/* Video de fondo optimizado: solo 1 decoder activo para máximo rendimiento en móviles */}
      <video
        ref={videoRef}
        key={currentVid.key}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        onEnded={handleEnded}
        onError={handleEnded}
        className="hero-video-bg hero-video-active"
      >
        <source src={`/${currentVid.file}`} type="video/mp4" />
        <source src={`/api/images/${currentVid.key}`} type="video/mp4" />
      </video>

      {/* Velo aurora para legibilidad y elegancia */}
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

        {/* Composición bento: pieza central + laterales desplazadas */}
        <div className="hero-bento reveal-in reveal-delay">
          <div className="hero-tile hero-tile-side hero-tile-side-left">
            <StudioVisual
              src="/api/images/pieza-01"
              alt="Detalle de un diseño de pestañas clásicas"
            />
          </div>

          <div className="hero-tile hero-tile-main">
            <StudioVisual
              src="/api/images/pieza-04"
              alt="Detalle de un diseño de pestañas híbridas"
              priority
            />
          </div>

          <div className="hero-tile hero-tile-side hero-tile-side-right">
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
  const featuredServices = serviceCategories.flatMap((cat) =>
    cat.services.map((srv) => ({ ...srv, categoryName: cat.name }))
  )

  // Composición bento: la primera y la última tarjeta ocupan doble columna.
  const spans = [
    'md:col-span-2',
    '',
    '',
    'md:col-span-2',
  ]

  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">
            Encuentra tu favorito
          </p>

          <h2 className="section-title mt-5">
            Una mirada,
            <br />
            muchas formas de <span className="text-gold-gradient">brillar.</span>
          </h2>

          <p className="body-copy mx-auto mt-5 max-w-lg">
            Desde un acabado delicado hasta un volumen que no pasa
            desapercibido. Encontramos el efecto que mejor encaja contigo.
          </p>
        </Reveal>

        {/* Bento grid de servicios */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {featuredServices.slice(0, 4).map((service, index) => (
            <Reveal
              key={service.id}
              delay={index * 90}
              className={spans[index] ?? ''}
            >
              <div className="bento-card p-6 flex flex-col justify-between group h-full">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/80 font-bold block mb-1">
                        {service.categoryName}
                      </span>
                      <h3 className="font-display text-2xl text-white group-hover:text-[#e5c158] transition-colors">
                        {service.name}
                      </h3>
                    </div>
                    <span className="shrink-0 font-display text-2xl font-semibold bg-[#101019]/90 px-3.5 py-1 rounded-full border border-[#d4af37]/25">
                      <span className="text-gold-gradient">{service.price}</span>
                    </span>
                  </div>

                  <p className="text-sm text-[#9e9ea7] mt-3 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs text-[#9e9ea7]">
                    <svg className="w-4 h-4 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Duración estimada: {service.duration}</span>
                  </div>

                  <ul className="mt-6 space-y-2 border-t border-[#d4af37]/15 pt-4">
                    {service.includes.map((inc) => (
                      <li key={inc} className="flex items-center gap-2.5 text-xs text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/60" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => openReservationModal()}
                    className="w-full button button-light py-2.5 text-xs font-bold group-hover:bg-[#d4af37]/10 transition-colors"
                  >
                    Reservar este servicio
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 text-center">
          <Link to="/servicios" className="button button-accent shadow-glow">
            Ver catálogo completo
            <span aria-hidden="true" className="ml-1">↗</span>
          </Link>
        </Reveal>
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
      <div className="aurora-band rounded-[3rem] py-16 md:rounded-[4rem] md:py-20">
        <div className="wrap grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <Reveal className="relative mx-auto w-full max-w-md pb-9">
            <div className="overflow-hidden rounded-[2rem] border border-[#d4af37]/30 shadow-panel">
              <StudioVisual
                src="/api/images/pieza-05"
                alt="Detalle de volumen ruso"
                label=""
                className="rounded-none!"
              />
            </div>

            <div className="absolute right-2 bottom-0 left-2 rounded-[1.8rem] border border-[#d4af37]/30 bg-[#0b0b12]/95 backdrop-blur-xl px-6 py-5 text-center shadow-soft sm:right-6 sm:left-6">
              <p className="font-display text-2xl italic text-rose">
                “Más que pestañas,
                <br />
                un momento para ti.”
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="eyebrow">
              La experiencia GoldBlack
            </p>

            <h2 className="section-title mt-5">
              Aquí, el cuidado
              <br />
              empieza <span className="text-gold-gradient">contigo.</span>
            </h2>

            <p className="body-copy mt-6">
              No se trata solo de elegir una técnica. Se trata de sentirte
              cómoda, escuchada y feliz con tu mirada.
            </p>

            <ol className="relative mt-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[1.15rem] before:w-px before:bg-[linear-gradient(180deg,transparent,rgba(212,175,55,0.55)_20%,rgba(229,193,88,0.55)_80%,transparent)]">
              {details.map((item, index) => (
                <li key={item.title} className="relative flex gap-4">
                  <span className="gold-node relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-lg text-rose">
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
          </Reveal>
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
          <Reveal>
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
          </Reveal>

          <div className="space-y-3">
            {faqs.slice(0, 3).map((faq, index) => (
              <Reveal key={faq.q} delay={index * 90}>
                <details className="bento-card group rounded-[1.4rem] px-5 py-5">
                  <summary className="flex list-none items-center justify-between gap-5 text-sm font-semibold leading-6">
                    {faq.q}

                    <span
                      aria-hidden="true"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full gold-node text-lg text-rose transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>

                  <p className="mt-4 text-sm leading-7 text-muted">
                    {faq.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
