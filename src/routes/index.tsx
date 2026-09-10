import { Link, createFileRoute } from '@tanstack/react-router'

import { StudioVisual } from '#/components/StudioVisual'
import {
  business,
  faqs,
  galleryPieces,
  serviceCategories,
  whatsappLink,
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
          'Extensiones de pestañas y lifting con diseño personalizado. Descubre tu efecto ideal y disfruta de un momento para ti en GoldBlack Lash.',
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
      <GalleryPreview />
      <FaqSection />
      <BookingSection />
    </>
  )
}

function Hero() {
  return (
    <section className="beauty-hero rounded-b-[3rem] md:rounded-b-[5rem]">
      {/* Video de fondo subido y servido desde Neon Postgres */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        className="hero-video-bg"
      >
        <source src="/api/images/hero-video" type="video/mp4" />
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

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

          <p className="body-copy mx-auto mt-6 max-w-lg">
            Pestañas que realzan lo que te hace única. Un diseño a tu
            medida y un momento de cuidado solo para ti.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="button button-dark sm:w-auto"
            >
              Reserva tu momento
              <span aria-hidden="true">↗</span>
            </a>

            <Link
              to="/servicios"
              className="button bg-white/70 sm:w-auto"
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

          <div className="floating-note note-left gentle-float">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush text-lg text-rose"
            >
              ♡
            </span>

            <div className="text-left">
              <p className="text-xs font-bold">Tan tú.</p>

              <p className="mt-1 text-[0.6rem] text-muted">
                Diseño personalizado
              </p>
            </div>
          </div>

          <div className="floating-note note-right gentle-float">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lilac text-lg text-rose"
            >
              ✧
            </span>

            <div className="text-left">
              <p className="text-xs font-bold">
                Tu pequeño ritual
              </p>

              <p className="mt-1 text-[0.6rem] text-muted">
                Relájate. Nos ocupamos de tu mirada.
              </p>
            </div>
          </div>
        </div>

        <ul className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[0.65rem] font-semibold text-muted md:gap-x-14">
          {[
            'Diseño a medida',
            'Atención con cita previa',
            'Cuidado en cada detalle',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span aria-hidden="true" className="text-rose">
                ✧
              </span>

              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ServicesPreview() {
  const images: Record<string, string> = {
    extensiones: '/api/images/pieza-02',
    extras: '/api/images/pieza-05',
  }

  const taglines: Record<string, string> = {
    extensiones: 'Realza tu mirada',
    extras: 'Un extra de cuidado',
  }

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

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {serviceCategories.map((category) => {
            const service =
              category.services.find((item) => item.featured) ??
              category.services[0]

            if (!service) return null

            return (
              <Link
                key={category.id}
                to="/servicios"
                search={{ categoria: category.id }}
                hash={category.id}
                className="beauty-card group"
              >
                <div className="beauty-card-visual">
                  <StudioVisual
                    src={images[category.id]}
                    alt={`Detalle de ${service.name}`}
                    label={category.name}
                  />
                </div>

                <div className="flex flex-1 flex-col px-7 pt-4 pb-7">
                  <p className="text-[0.6rem] font-bold tracking-[0.15em] text-rose uppercase">
                    {taglines[category.id] ?? 'Realza tu mirada'}
                  </p>

                  <h3 className="mt-3 font-display text-3xl leading-tight">
                    {service.name}
                  </h3>

                  <p className="mt-4 flex-1 text-sm leading-7 text-muted">
                    {service.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-5">
                    <div>
                      <p className="font-display text-2xl">
                        {service.price}
                      </p>

                      <p className="mt-1 text-[0.65rem] text-muted">
                        {service.duration}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 place-items-center rounded-full bg-blush text-rose transition-colors group-hover:bg-plum group-hover:text-white"
                    >
                      ↗
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

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
            <div className="overflow-hidden rounded-t-[12rem] rounded-b-[3rem] border-8 border-white shadow-panel">
              <StudioVisual
                src="/api/images/pieza-05"
                alt="Detalle de volumen ruso"
                label=""
                className="rounded-none!"
              />
            </div>

            <div className="absolute right-2 bottom-0 left-2 rounded-[1.8rem] border border-white bg-white/95 px-6 py-5 text-center shadow-soft sm:right-6 sm:left-6">
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
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white font-display text-lg text-rose">
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

function GalleryPreview() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">
              Un poquito de inspiración
            </p>

            <h2 className="section-title mt-5">
              Miradas que
              <br />
              hablan por sí solas.
            </h2>
          </div>

          <Link
            to="/galeria"
            className="text-link self-start sm:self-auto"
          >
            Explorar resultados
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {galleryPieces.slice(0, 4).map((piece, index) => (
            <Link
              key={piece.id}
              to="/galeria"
              className={`group min-w-0 ${
                index % 2 === 1 ? 'mt-8' : ''
              }`}
            >
              <div className="overflow-hidden rounded-4xl bg-blush">
                <StudioVisual
                  src={piece.image}
                  alt={piece.title}
                  label={piece.technique}
                  className="transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>

              <h3 className="mt-4 font-display text-xl">
                {piece.title}
              </h3>

              <p className="mt-1 text-[0.65rem] text-muted">
                {piece.technique}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-5">
          <p className="text-sm text-muted">
            Más detalles, más inspiración y novedades.
          </p>

          <a
            href={business.instagram}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            {business.instagramHandle}
            <span aria-hidden="true">↗</span>
          </a>
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
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-lg text-rose transition-transform group-open:rotate-45"
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

function BookingSection() {
  return (
    <section className="pb-16 md:pb-24">
      <div className="wrap">
        <div className="booking-panel px-6 py-14 text-center md:px-12 md:py-20">
          <div className="relative z-10 mx-auto max-w-2xl">
            <span
              aria-hidden="true"
              className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/25 text-3xl text-accent"
            >
              ♡
            </span>

            <p className="mt-6 text-[0.65rem] font-semibold tracking-[0.2em] text-accent uppercase">
              Te mereces este momento
            </p>

            <h2 className="section-title mt-5">
              Tu próxima mirada
              <br />
              favorita es la tuya.
            </h2>

            <p className="mx-auto mt-6 max-w-lg text-sm leading-8 text-white/75">
              Cuéntame qué tienes en mente y buscamos tu cita. Si no sabes
              qué efecto elegir, lo descubrimos juntas.
            </p>

          <div className="mx-auto mt-8 flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noreferrer"
                className="button button-light focus-visible:outline-accent"
              >
                Reservar por WhatsApp
                <span aria-hidden="true">↗</span>
              </a>

              <Link
                to="/contacto"
                className="button border-white/30 text-white hover:bg-white/10 focus-visible:outline-accent"
              >
                Ver contacto
              </Link>
            </div>

            <p className="mt-6 text-[0.65rem] text-white/65">
              {business.city} · Atención personalizada · Cita previa
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
