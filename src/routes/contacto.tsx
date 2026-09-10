import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { PageHero } from '#/components/PageHero'
import {
  business,
  serviceCategories,
  whatsappLink,
} from '#/data/site'

export const Route = createFileRoute('/contacto')({
  component: Contacto,
  head: () => ({
    meta: [
      {
        title: `Contacto y reservas — ${business.name}`,
      },
      {
        name: 'description',
        content: `Reserva tu momento en ${business.name}, ${business.city}. Contacta por WhatsApp, consulta nuestros horarios y encuentra el estudio.`,
      },
    ],
  }),
})

function Contacto() {
  return (
    <>
      <PageHero
        eyebrow="Un momento solo para ti"
        title="Tu próxima mirada empieza con un hola."
        lead="Cuéntame qué te gustaría hacer y cuándo te viene bien. Si no sabes qué técnica elegir, empezamos por encontrar la tuya."
        crumbs={[{ label: 'Contacto' }]}
      />

      <section className="section">
        <div className="wrap grid items-start gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
          <BookingForm />

          <aside className="space-y-7">
            <DirectContact />
            <ContactDetails />
            <OpeningHours />
          </aside>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="wrap">
          <div className="rounded-[2.5rem] bg-lilac/60 p-6 md:p-10">
            <div className="grid items-center gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
              <div>
                <span
                  aria-hidden="true"
                  className="grid h-14 w-14 place-items-center rounded-full bg-white text-2xl text-rose"
                >
                  ♡
                </span>

                <p className="eyebrow mt-6">Te esperamos aquí</p>

                <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
                  Tu rincón de belleza en {business.city}.
                </h2>

                <address className="mt-5 text-sm leading-8 text-muted not-italic">
                  {business.address}
                  <br />
                  {business.postalCode} {business.city}
                </address>

                <a
                  href={business.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-dark mt-6"
                >
                  Cómo llegar
                  <span aria-hidden="true">↗</span>
                </a>
              </div>

              <div className="overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-soft">
                <iframe
                  title={`Ubicación de ${business.name}`}
                  src={business.mapsEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-80 w-full border-0 md:h-96"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function DirectContact() {
  return (
    <div className="rounded-[2rem] border border-rose/15 bg-blush p-7 md:p-8">
      <span
        aria-hidden="true"
        className="grid h-12 w-12 place-items-center rounded-full bg-white text-2xl text-rose"
      >
        ♡
      </span>

      <p className="eyebrow mt-5">Si prefieres algo más directo</p>

      <h2 className="mt-3 font-display text-3xl">
        Hablemos por WhatsApp.
      </h2>

      <p className="mt-4 text-sm leading-7 text-muted">
        Puedes enviarme tu idea, tus dudas o una foto de referencia.
        Te responderé personalmente.
      </p>

      <a
        href={whatsappLink()}
        target="_blank"
        rel="noreferrer"
        className="button button-dark mt-6 w-full"
      >
        Abrir WhatsApp
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  )
}

function ContactDetails() {
  return (
    <div className="rounded-[2rem] border border-line bg-white p-7 shadow-soft md:p-8">
      <h2 className="eyebrow">También me encuentras aquí</h2>

      <dl className="mt-6 space-y-6 text-sm">
        <div>
          <dt className="text-[0.65rem] font-semibold tracking-wider text-muted uppercase">
            Teléfono
          </dt>
          <dd className="mt-2">
            <a
              href={`tel:${business.phoneDisplay.replace(/\s/g, '')}`}
              className="transition-colors hover:text-rose"
            >
              {business.phoneDisplay}
            </a>
          </dd>
        </div>

        <div>
          <dt className="text-[0.65rem] font-semibold tracking-wider text-muted uppercase">
            Email
          </dt>
          <dd className="mt-2">
            <a
              href={`mailto:${business.email}`}
              className="break-words transition-colors hover:text-rose"
            >
              {business.email}
            </a>
          </dd>
        </div>

        <div>
          <dt className="text-[0.65rem] font-semibold tracking-wider text-muted uppercase">
            Instagram
          </dt>
          <dd className="mt-2">
            <a
              href={business.instagram}
              target="_blank"
              rel="noreferrer"
              className="break-words transition-colors hover:text-rose"
            >
              {business.instagramHandle}
              <span aria-hidden="true" className="ml-2">
                ↗
              </span>
            </a>
          </dd>
        </div>
      </dl>
    </div>
  )
}

function OpeningHours() {
  return (
    <div className="rounded-[2rem] border border-line bg-white p-7 shadow-soft md:p-8">
      <h2 className="eyebrow">Horario del estudio</h2>

      <ul className="mt-6 space-y-4">
        {business.hours.map((slot) => (
          <li
            key={slot.days}
            className="flex flex-wrap justify-between gap-3 border-b border-line pb-4 text-sm last:border-0 last:pb-0"
          >
            <span>{slot.days}</span>
            <span className="text-muted">{slot.time}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-2xl bg-paper px-4 py-3 text-xs leading-6 text-muted">
        Trabajo con cita previa. Si necesitas otra franja horaria,
        puedes consultar disponibilidad.
      </p>
    </div>
  )
}

type FormState = {
  nombre: string
  telefono: string
  servicio: string
  fecha: string
  mensaje: string
}

const emptyForm: FormState = {
  nombre: '',
  telefono: '',
  servicio: 'Necesito asesoría',
  fecha: '',
  mensaje: '',
}

function BookingForm() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [preparedLink, setPreparedLink] = useState<string | null>(null)

  const update = (field: keyof FormState, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))

    setError(null)
    setPreparedLink(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError('Indica tu nombre y un teléfono de contacto.')
      return
    }

    const servicePrice = serviceCategories
      .flatMap((category) => category.services)
      .find((service) => service.name === form.servicio)?.price

    const message = [
      `¡Hola! Quiero consultar una cita en ${business.name}.`,
      '',
      `Nombre: ${form.nombre.trim()}`,
      `Teléfono: ${form.telefono.trim()}`,
      `Servicio: ${form.servicio}${servicePrice ? ` (${servicePrice})` : ''}`,
      form.fecha.trim()
        ? `Disponibilidad: ${form.fecha.trim()}`
        : null,
      form.mensaje.trim()
        ? `Comentarios: ${form.mensaje.trim()}`
        : null,
      '',
      business.siteUrl,
    ]
      .filter((line): line is string => line !== null)
      .join('\n')

    const link = whatsappLink(message)

    setError(null)
    setPreparedLink(link)

    window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="booking-form-title"
      aria-describedby="booking-form-description"
      className="rounded-[2rem] border border-line bg-surface p-6 shadow-soft sm:p-10"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Solicitud de cita</p>

          <h2
            id="booking-form-title"
            className="mt-4 font-display text-3xl leading-tight sm:text-4xl"
          >
            Cuéntame qué te apetece.
          </h2>
        </div>

        <span
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blush text-2xl text-rose"
        >
          ✧
        </span>
      </div>

      <p
        id="booking-form-description"
        className="mt-5 text-sm leading-7 text-muted"
      >
        Rellena estos datos y prepararemos tu mensaje de WhatsApp.
        Confirmaremos la cita cuando acordemos fecha y hora.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Tu nombre *</span>
          <input
            type="text"
            name="nombre"
            autoComplete="name"
            required
            maxLength={100}
            value={form.nombre}
            onChange={(event) => update('nombre', event.target.value)}
            placeholder="¿Cómo te llamas?"
            className="field"
          />
        </label>

        <label className="block">
          <span className="field-label">Teléfono *</span>
          <input
            type="tel"
            name="telefono"
            autoComplete="tel"
            required
            maxLength={30}
            value={form.telefono}
            onChange={(event) => update('telefono', event.target.value)}
            placeholder="+34 600 000 000"
            className="field"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="field-label">
            ¿Qué te gustaría hacer?
          </span>

          <select
            name="servicio"
            value={form.servicio}
            onChange={(event) => update('servicio', event.target.value)}
            className="field"
          >
            <option value="Necesito asesoría">
              No lo tengo claro, necesito asesoría
            </option>

            {serviceCategories.map((category) => (
              <optgroup key={category.id} label={category.name}>
                {category.services.map((service) => (
                  <option key={service.id} value={service.name}>
                    {service.name} · {service.price}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="field-label">
            ¿Cuándo te viene bien?
          </span>

          <input
            type="text"
            name="fecha"
            maxLength={200}
            value={form.fecha}
            onChange={(event) => update('fecha', event.target.value)}
            placeholder="Por ejemplo: viernes por la tarde"
            className="field"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="field-label">
            Algo más que quieras contarme
          </span>

          <textarea
            name="mensaje"
            rows={4}
            maxLength={2000}
            value={form.mensaje}
            onChange={(event) => update('mensaje', event.target.value)}
            placeholder="Tu estilo, tus dudas o el efecto que te gustaría conseguir…"
            className="field resize-y"
          />
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="button button-dark mt-8 w-full"
      >
        Continuar en WhatsApp
        <span aria-hidden="true">↗</span>
      </button>

      {preparedLink ? (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-rose/15 bg-blush p-5 text-sm leading-7"
        >
          <p className="font-semibold">
            Tu mensaje está preparado.
          </p>

          <p className="mt-1 text-muted">
            Si WhatsApp no se ha abierto,{' '}
            <a
              href={preparedLink}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-plum underline underline-offset-4"
            >
              pulsa aquí para continuar
            </a>
            . Todavía debes enviar el mensaje en WhatsApp.
          </p>
        </div>
      ) : null}

      <p className="mt-5 text-xs leading-6 text-muted">
        * Campos obligatorios. Al continuar, los datos del formulario
        se incluirán en un enlace a WhatsApp. Esta web no guarda
        tu solicitud.
      </p>
    </form>
  )
}