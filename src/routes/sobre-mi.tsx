import { Link, createFileRoute } from '@tanstack/react-router'

import { Diamond, PageHero } from '#/components/PageHero'
import { openReservationModal } from '#/components/ReservationModal'
import { business } from '#/data/site'

export const Route = createFileRoute('/sobre-mi')({
  component: SobreMi,
  head: () => ({
    meta: [
      {
        title: `El estudio — ${business.name}`,
      },
      {
        name: 'description',
        content:
          'Conoce la filosofía de GoldBlack Lash: diseño personalizado, atención al detalle y un espacio pensado para disfrutar de tu momento de cuidado.',
      },
    ],
  }),
})

const values = [
  {
    icon: '♡',
    title: 'Escucharte de verdad',
    body:
      'Tu estilo, tus dudas y tu rutina son el punto de partida. Antes de elegir una técnica, hablamos de lo que quieres conseguir.',
  },
  {
    icon: '✧',
    title: 'Diseñar para ti',
    body:
      'La forma de tu ojo y tu pestaña natural importan. Buscamos un efecto que tenga sentido para tu mirada, no una fórmula repetida.',
  },
  {
    icon: '❋',
    title: 'Cuidar el proceso',
    body:
      'Trabajar con atención, explicar cada paso y procurar que te sientas cómoda también forma parte del resultado.',
  },
  {
    icon: '↗',
    title: 'Acompañarte después',
    body:
      'Te explico el mantenimiento y los cuidados en casa para que sepas cómo seguir cuidando tu diseño después de la cita.',
  },
]

function SobreMi() {
  return (
    <>
      <PageHero
        eyebrow="La esencia del estudio"
        title="Un espacio para cuidarte. Una mirada muy tuya."
        lead="GoldBlack nace de una forma personal de entender la belleza: realzar lo que te hace única, escucharte y cuidar los pequeños detalles."
        crumbs={[{ label: 'El estudio' }]}
      />

      <section className="section">
        <div className="wrap grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-md pb-10">
            <div className="overflow-hidden rounded-t-[12rem] rounded-b-[3rem] border-8 border-white shadow-panel">
              <StudioVisual
                src="/api/images/pieza-05"
                alt="Detalle de volumen ruso"
                label="Tu pequeño momento de calma"
                className="rounded-none!"
              />
            </div>

            <div className="absolute right-3 bottom-0 left-3 rounded-[1.8rem] border border-line bg-white px-6 py-5 text-center shadow-soft sm:right-8 sm:left-8">
              <p className="font-display text-2xl italic text-rose">
                Belleza con calma,
                <br />
                cuidado con intención.
              </p>

              <p className="mt-3 text-[0.6rem] tracking-widest text-muted uppercase">
                {business.city} · Cita previa
              </p>
            </div>
          </div>

          <div>
            <p className="eyebrow">Mi forma de trabajar</p>

            <h2 className="section-title mt-5">
              Primero tú.
              <br />
              Después, la técnica.
            </h2>

            <div className="body-copy mt-7 space-y-5">
              <p>
                No todas buscamos lo mismo cuando nos miramos al espejo.
                A veces apetece un resultado delicado; otras, una mirada
                con más presencia. Por eso, el primer paso es escucharte.
              </p>

              <p>
                Antes de elegir longitudes y curvaturas, observo la forma
                de tu ojo y tu pestaña natural. También hablamos de tu
                día a día: quiero que el diseño encaje contigo, no solo
                con una fotografía de referencia.
              </p>

              <p>
                Me gusta trabajar con calma, explicar las opciones y
                prestar atención a esos detalles que hacen que un
                resultado se sienta personal.
              </p>
            </div>

            <Link to="/servicios" className="text-link mt-7">
              Descubre nuestros servicios
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-3 md:px-6">
        <div className="rounded-[3rem] bg-blush/70 py-16 md:rounded-[4rem] md:py-20">
          <div className="wrap">
            <header className="mx-auto max-w-2xl text-center">
              <p className="eyebrow justify-center">
                Lo que hace especial tu visita
              </p>

              <h2 className="section-title mt-5">
                El cuidado está
                <br />
                en los detalles.
              </h2>

              <p className="body-copy mx-auto mt-5 max-w-lg">
                Más allá de una técnica, quiero que encuentres
                una experiencia cercana, tranquila y pensada para ti.
              </p>
            </header>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value) => (
                <article
                  key={value.title}
                  className="rounded-[2rem] border border-white bg-white/90 p-7 shadow-soft"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 place-items-center rounded-full bg-blush text-2xl text-rose"
                  >
                    {value.icon}
                  </span>

                  <h3 className="mt-6 font-display text-2xl leading-tight">
                    {value.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-muted">
                    {value.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="mx-auto max-w-3xl text-center">
            <span
              aria-hidden="true"
              className="font-display text-6xl leading-none text-rose/50"
            >
              “
            </span>

            <blockquote className="mt-1 font-display text-3xl leading-snug text-plum sm:text-4xl md:text-5xl">
              No se trata de cambiar tu mirada.
              Se trata de descubrir todo lo que ya tiene.
            </blockquote>

            <p className="mt-7 text-[0.65rem] font-semibold tracking-[0.2em] text-rose uppercase">
              La filosofía GoldBlack
            </p>
          </div>

          <Diamond className="my-14 md:my-20" />

          <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="eyebrow">Antes de tu primera cita</p>

              <h2 className="section-title mt-5">
                Sentirte tranquila
                <br />
                también importa.
              </h2>

              <p className="body-copy mt-6">
                Si es tu primera vez, no necesitas tenerlo todo decidido.
                Podemos hablar de tus dudas y valorar qué opciones
                tienen sentido para ti.
              </p>

              <Link
                to="/servicios"
                hash="faq"
                className="text-link mt-7"
              >
                Consultar preguntas frecuentes
                <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div className="rounded-[2.5rem] border border-line bg-white p-7 shadow-soft sm:p-9">
              <h3 className="font-display text-2xl">
                Algunas cosas que conviene contarme
              </h3>

              <ul className="mt-6 space-y-5">
                <PreparationItem
                  title="El resultado que te gusta"
                  body="Puedes traer una referencia o explicarme si buscas algo natural, definido o con más volumen."
                />

                <PreparationItem
                  title="Tu experiencia anterior"
                  body="Si ya llevas extensiones o has probado otros tratamientos, cuéntame cómo te han ido."
                />

                <PreparationItem
                  title="Cualquier sensibilidad o molestia"
                  body="Si tienes alergias conocidas, irritación ocular o has tenido una reacción previa, avísame antes de la cita. Puede ser necesario aplazar el tratamiento o consultar con un profesional sanitario."
                />
              </ul>

              <p className="mt-7 rounded-2xl bg-paper px-5 py-4 text-xs leading-7 text-muted">
                La valoración previa nos ayuda a decidir cómo proceder.
                Tu comodidad y el cuidado de tu pestaña natural van primero.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="wrap">
          <div className="booking-panel px-6 py-14 text-center md:py-20">
            <div className="relative z-10 mx-auto max-w-2xl">
              <span
                aria-hidden="true"
                className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/25 text-3xl text-accent"
              >
                ♡
              </span>

              <p className="mt-6 text-[0.65rem] font-semibold tracking-[0.2em] text-accent uppercase">
                Me encantará conocerte
              </p>

              <h2 className="section-title mt-5">
                Hagamos un poquito
                <br />
                de espacio para ti.
              </h2>

              <p className="mx-auto mt-6 max-w-lg text-sm leading-8 text-white/75">
                Escríbeme, cuéntame qué tienes en mente y buscamos
                el momento para tu próxima visita.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => openReservationModal()}
                  className="button button-light focus-visible:outline-accent cursor-pointer"
                >
                  Reservar mi cita
                  <span aria-hidden="true">→</span>
                </button>

                <Link
                  to="/contacto"
                  className="button border-white/30 text-white hover:bg-white/10 focus-visible:outline-accent"
                >
                  Contacto y ubicación
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function PreparationItem({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden="true"
        className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blush text-sm text-rose"
      >
        ✓
      </span>

      <div>
        <h4 className="font-body text-sm font-semibold">
          {title}
        </h4>
        <p className="mt-2 text-sm leading-7 text-muted">
          {body}
        </p>
      </div>
    </li>
  )
}