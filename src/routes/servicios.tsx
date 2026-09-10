import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { PageHero } from '#/components/PageHero'
import { StudioVisual } from '#/components/StudioVisual'
import {
  business,
  faqs,
  serviceCategories,
  whatsappLink,
  type Service,
  type ServiceCategory,
} from '#/data/site'

type ServiciosSearch = {
  categoria?: string
}

export const Route = createFileRoute('/servicios')({
  component: Servicios,
  validateSearch: (search: Record<string, unknown>): ServiciosSearch => ({
    categoria:
      typeof search.categoria === 'string' ? search.categoria : undefined,
  }),
  head: () => ({
    meta: [
      {
        title: `Servicios y precios — ${business.name}`,
      },
      {
        name: 'description',
        content:
          'Descubre nuestros servicios de extensiones de pestañas, lifting y mantenimiento. Consulta precios, duración y reserva tu momento de cuidado.',
      },
    ],
  }),
})

function Servicios() {
  const { categoria } = Route.useSearch()

  const active = serviceCategories.some((category) => category.id === categoria)
    ? categoria
    : undefined

  const [visible, setVisible] = useState<string | undefined>(active)

  useEffect(() => {
    setVisible(active)

    if (!active) return

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    document.getElementById(active)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [active])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((item) => item.isIntersecting)

        if (entry) {
          setVisible(entry.target.id)
        }
      },
      {
        rootMargin: '-25% 0px -65% 0px',
        threshold: 0,
      },
    )

    const ids = [
      ...serviceCategories.map((category) => category.id),
      'faq',
    ]

    for (const id of ids) {
      const element = document.getElementById(id)

      if (element) {
        observer.observe(element)
      }
    }

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <PageHero
        eyebrow="Nuestra carta de belleza"
        title="El efecto perfecto es el que va contigo."
        lead="Natural, definido o con un poquito más de volumen. Descubre nuestros servicios y elegimos juntas cómo realzar tu mirada."
        crumbs={[{ label: 'Servicios' }]}
      >
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <span className="rounded-full border border-white bg-white/80 px-4 py-2 text-[0.65rem] text-muted">
            Diseño personalizado
          </span>
          <span className="rounded-full border border-white bg-white/80 px-4 py-2 text-[0.65rem] text-muted">
            Atención con cita previa
          </span>
          <span className="rounded-full border border-white bg-white/80 px-4 py-2 text-[0.65rem] text-muted">
            Asesoría de cuidados
          </span>
        </div>
      </PageHero>

      <nav
        aria-label="Categorías de servicios"
        className="sticky top-20 sm:top-28 z-30 border-b border-line/70 bg-paper/95 backdrop-blur-xl"
      >
        <ul className="wrap flex gap-2 overflow-x-auto py-3">
          {serviceCategories.map((category) => (
            <li key={category.id}>
              <Link
                to="/servicios"
                search={{ categoria: category.id }}
                hash={category.id}
                aria-current={
                  visible === category.id ? 'location' : undefined
                }
                className={`category-tab ${
                  visible === category.id ? 'is-active' : ''
                }`}
              >
                {category.name}
              </Link>
            </li>
          ))}

          <li>
            <Link
              to="/servicios"
              search={{}}
              hash="faq"
              aria-current={visible === 'faq' ? 'location' : undefined}
              className={`category-tab ${
                visible === 'faq' ? 'is-active' : ''
              }`}
            >
              Preguntas frecuentes
            </Link>
          </li>
        </ul>
      </nav>

      <div className="wrap">
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-7 text-muted">
          Los precios son orientativos. Confirmaremos los detalles del servicio
          y su adecuación a tu pestaña natural en la valoración previa.
        </p>

        {serviceCategories.map((category, index) => (
          <CategoryBlock
            key={category.id}
            category={category}
            index={index}
          />
        ))}

        <ProcessBlock />
        <FaqBlock />
        <BookingCta />
      </div>
    </>
  )
}

function CategoryBlock({
  category,
  index,
}: {
  category: ServiceCategory
  index: number
}) {
  const symbols = ['✧', '♡', '❋']

  return (
    <section
      id={category.id}
      className="section scroll-mt-40 border-b border-line"
    >
      <div className="grid items-start gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <header className="lg:sticky lg:top-44">
          <span
            aria-hidden="true"
            className="grid h-16 w-16 place-items-center rounded-full bg-blush text-3xl text-rose"
          >
            {symbols[index % symbols.length]}
          </span>

          <p className="eyebrow mt-6">
            Un cuidado para cada momento
          </p>

          <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            {category.name}
          </h2>

          <p className="body-copy mt-5 max-w-sm">
            {category.blurb}
          </p>

          <a
            href={whatsappLink(
              `¡Hola! Me gustaría recibir asesoría sobre ${category.name.toLowerCase()}.`,
            )}
            target="_blank"
            rel="noreferrer"
            className="text-link mt-6"
          >
            Ayúdame a elegir
            <span aria-hidden="true">↗</span>
          </a>
        </header>

        <div className="space-y-6">
          {category.services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <article
      className={`rounded-[2rem] border p-6 shadow-soft transition-shadow hover:shadow-panel sm:p-8 ${
        service.featured
          ? 'border-rose/20 bg-blush'
          : 'border-line bg-surface'
      }`}
    >
      {service.featured ? (
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose/15 bg-white/80 px-3 py-1.5 text-[0.6rem] font-bold tracking-widest text-rose uppercase">
          <span aria-hidden="true">♡</span>
          Favorito del estudio
        </p>
      ) : null}

      {service.image ? (
        <div className="beauty-card-visual mt-0 mb-6">
          <StudioVisual
            src={service.image}
            alt={`Máquina de ${service.name.toLowerCase()}`}
            label=""
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-sm">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-2xl leading-tight sm:text-3xl">
              {service.name}
            </h3>
            {service.badge ? (
              <span className="rounded-full bg-blush px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-plum border border-rose/15 shadow-soft">
                {service.badge}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-xs text-muted">
            Duración aproximada · {service.duration}
          </p>
        </div>

        <p className="shrink-0 font-display text-3xl text-rose">
          {service.price}
        </p>
      </div>

      <p className="mt-5 text-sm leading-7 text-muted">
        {service.description}
      </p>

      <ul className="mt-5 space-y-2.5">
        {service.includes.map((item) => (
          <li key={item} className="flex gap-3 text-xs leading-6">
            <span aria-hidden="true" className="text-rose">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7 border-t border-rose/10 pt-6">
        <a
          href={whatsappLink(
            [
              `*Me interesa este servicio — ${business.name}*`,
              '---------------------------',
              `*Servicio:* ${service.name}${service.badge ? ` (${service.badge})` : ''} (${service.price})`,
              `*Duración aprox.:* ${service.duration}`,
              '---------------------------',
              '*Nombre:*',
              '*Teléfono:*',
              `${business.siteUrl}`,
            ].join('\n'),
          )}
          target="_blank"
          rel="noreferrer"
          className={`button w-full sm:w-auto ${
            service.featured ? 'button-dark' : 'button-accent'
          }`}
        >
          Reservar este servicio
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  )
}

function ProcessBlock() {
  const steps = [
    {
      title: 'Te escucho',
      body: 'Hablamos de tu estilo, de tu rutina y del resultado que te gustaría conseguir.',
    },
    {
      title: 'Diseñamos juntas',
      body: 'Elegimos técnica, curvatura y longitud teniendo en cuenta tu pestaña natural.',
    },
    {
      title: 'Tu momento de calma',
      body: 'Tú te relajas mientras trabajamos con cuidado y atención en cada detalle.',
    },
    {
      title: 'Seguimos cuidándolas',
      body: 'Te explico los cuidados en casa y cuándo conviene revisar tu diseño.',
    },
  ]

  return (
    <section className="section">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow justify-center">La experiencia</p>
        <h2 className="section-title mt-5">
          Así empieza tu nueva mirada.
        </h2>
      </header>

      <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-[2rem] border border-line bg-white p-7 text-center shadow-soft"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blush font-display text-xl text-rose">
              {index + 1}
            </span>

            <h3 className="mt-5 font-display text-xl">
              {step.title}
            </h3>

            <p className="mt-3 text-sm leading-7 text-muted">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function FaqBlock() {
  return (
    <section id="faq" className="scroll-mt-40 pb-16 md:pb-24">
      <div className="rounded-[2.5rem] bg-lilac/60 p-6 sm:p-10 lg:p-12">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <header>
            <p className="eyebrow">Con toda tranquilidad</p>

            <h2 className="section-title mt-5">
              Tus dudas,
              <br />
              resueltas.
            </h2>

            <p className="body-copy mt-5">
              Queremos que llegues a tu cita sabiendo qué esperar.
              Si necesitas preguntar algo más, estoy al otro lado.
            </p>

            <a
              href={whatsappLink(
                '¡Hola! Tengo una duda antes de reservar mi cita.',
              )}
              target="_blank"
              rel="noreferrer"
              className="text-link mt-6"
            >
              Hacer una pregunta
              <span aria-hidden="true">↗</span>
            </a>
          </header>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-[1.4rem] border border-white bg-white/85 px-5 py-5"
              >
                <summary className="flex list-none items-center justify-between gap-5 text-sm font-semibold leading-6">
                  {faq.q}

                  <span
                    aria-hidden="true"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blush text-lg text-rose transition-transform group-open:rotate-45"
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

function BookingCta() {
  return (
    <section className="pb-16 md:pb-24">
      <div className="booking-panel px-6 py-12 text-center md:py-16">
        <div className="relative z-10 mx-auto max-w-xl">
          <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-accent uppercase">
            No tienes que decidirlo todo ahora
          </p>

          <h2 className="mt-5 font-display text-4xl leading-tight md:text-5xl">
            Encontramos tu efecto juntas.
          </h2>

          <p className="mt-5 text-sm leading-8 text-white/75">
            Cuéntame qué te gusta y te ayudo a elegir el servicio
            que mejor encaja con tu mirada.
          </p>

          <a
            href={whatsappLink()}
            target="_blank"
            rel="noreferrer"
            className="button button-light mt-7 focus-visible:outline-accent"
          >
            Quiero reservar mi momento
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}