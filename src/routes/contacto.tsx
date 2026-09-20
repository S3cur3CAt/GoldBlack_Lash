import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { PageHero } from '#/components/PageHero'
import { Reveal } from '#/components/Reveal'
import { useStudioConfig } from '#/context/StudioConfigContext'
import {
  business,
  serviceCategories,
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
        content: `Reserva tu momento en ${business.name}, ${business.city}. Solicita tu cita, consulta nuestros horarios y encuentra el estudio.`,
      },
    ],
  }),
})

function Contacto() {
  const business = useStudioConfig()
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
          <Reveal>
            <BookingForm />
          </Reveal>

          <Reveal delay={120} className="space-y-7">
            <DirectContact />
            <ContactDetails />
            <OpeningHours />
          </Reveal>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="wrap">
          <div className="aurora-band rounded-[2.5rem] p-6 md:p-10">
            <div className="grid items-center gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
              <div>
                <p className="eyebrow">Te esperamos aquí</p>

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

              <div className="overflow-hidden rounded-[1.75rem] border border-[#ec4899]/25 bg-white shadow-soft">
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
  const business = useStudioConfig()
  return (
    <div className="bento-card bento-card-featured p-7 md:p-8">
      <p className="eyebrow">Atención personalizada</p>

      <h2 className="mt-3 font-display text-3xl">
        Escríbenos o llámanos.
      </h2>

      <p className="mt-4 text-sm leading-7 text-muted">
        Puedes enviarnos tus dudas por correo electrónico o llamarnos directamente. Estaremos encantadas de asesorarte.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <a
          href={`mailto:${business.email}`}
          className="button button-dark w-full justify-center"
        >
          Enviar email a {business.email}
          <span aria-hidden="true">✉</span>
        </a>
        <a
          href={`tel:${business.phoneDisplay.replace(/\s/g, '')}`}
          className="button button-accent w-full justify-center"
        >
          Llamar al {business.phoneDisplay}
          <span aria-hidden="true">📞</span>
        </a>
      </div>
    </div>
  )
}

function ContactDetails() {
  const business = useStudioConfig()
  return (
    <div className="bento-card p-7 md:p-8">
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
              className="wrap-break-word transition-colors hover:text-rose"
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
              className="wrap-break-word transition-colors hover:text-rose"
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
  const business = useStudioConfig()
  return (
    <div className="bento-card p-7 md:p-8">
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
  email: string
  telefono: string
  servicio: string
  fecha: string
  mensaje: string
}

const emptyForm: FormState = {
  nombre: '',
  email: '',
  telefono: '',
  servicio: 'Necesito asesoría',
  fecha: '',
  mensaje: '',
}

function BookingForm() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const update = (field: keyof FormState, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))

    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedNombre = form.nombre.trim()
    const trimmedEmail = form.email.trim()
    const trimmedTelefono = form.telefono.trim()

    if (!trimmedNombre) {
      setError('Por favor indica tu nombre.')
      return
    }

    if (!trimmedTelefono || trimmedTelefono.replace(/\D/g, '').length < 9) {
      setError('Por favor introduce un teléfono móvil o WhatsApp válido (mínimo 9 dígitos).')
      return
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Por favor introduce un correo electrónico válido.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const today = new Date().toISOString().split('T')[0]
      const appointmentId = `apt-web-${Date.now()}`

      const payload = {
        id: appointmentId,
        clientName: trimmedNombre,
        clientPhone: trimmedTelefono,
        clientEmail: trimmedEmail,
        serviceName: form.servicio,
        serviceId: 'web-contact-form',
        date: today,
        time: form.fecha.trim() || 'Por coordinar',
        durationMinutes: (() => {
          const lower = (form.servicio || '').toLowerCase()
          if (lower.includes('retirada')) return 30
          if (lower.includes('limpieza') || lower.includes('facial')) return 60
          if (lower.includes('volumen ruso') || lower.includes('ruso')) return 60
          if (lower.includes('3d') || lower.includes('4d') || lower.includes('5d') || lower.includes('6d') || lower.includes('volumen')) return 75
          return 60
        })(),
        price: 30,
        status: 'pendiente',
        paymentStatus: 'pendiente',
        notes: [
          form.fecha.trim() ? `Disponibilidad: ${form.fecha.trim()}` : null,
          form.mensaje.trim() ? `Mensaje: ${form.mensaje.trim()}` : null,
        ]
          .filter(Boolean)
          .join(' | ') || 'Solicitud desde página de contacto',
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudo registrar la solicitud.')
      }

      setIsSuccess(true)
    } catch (err: any) {
      console.error('[BookingForm Submit Error]', err)
      setError(err?.message || 'Ocurrió un error al enviar tu solicitud. Inténtalo de nuevo en unos minutos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bento-card p-8 sm:p-12 text-center items-center">
        <span
          aria-hidden="true"
          className="gold-node mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl text-rose"
        >
          ✓
        </span>

        <p className="eyebrow justify-center mt-6">¡Solicitud recibida!</p>

        <h2 className="mt-3 font-display text-3xl sm:text-4xl">
          ¡Gracias, {form.nombre}!
        </h2>

        <p className="mt-4 text-sm sm:text-base leading-7 text-muted max-w-lg mx-auto">
          Tu solicitud para <strong>{form.servicio}</strong> ha quedado registrada en nuestra agenda.
        </p>

        <div className="mt-6 p-5 rounded-2xl bg-[#fdf2f8] border border-[#ec4899]/20 text-xs sm:text-sm text-muted max-w-md mx-auto space-y-2">
          <p>
            💬 Te enviaremos la confirmación por WhatsApp a tu móvil <strong className="text-ink font-mono">{form.telefono}</strong>.
          </p>
          {form.email ? (
            <p>
              ✉ También te hemos enviado un correo con todos los detalles a <strong className="text-ink">{form.email}</strong>.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(emptyForm)
            setIsSuccess(false)
          }}
          className="button button-dark mt-8"
        >
          Enviar otra consulta
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="booking-form-title"
      aria-describedby="booking-form-description"
      className="bento-card p-6 sm:p-10"
    >
      <div>
        <p className="eyebrow">Solicitud de cita</p>

        <h2
          id="booking-form-title"
          className="mt-4 font-display text-3xl leading-tight sm:text-4xl"
        >
          Cuéntame qué te apetece.
        </h2>
      </div>

      <p
        id="booking-form-description"
        className="mt-5 text-sm leading-7 text-muted"
      >
        Rellena estos datos para coordinar tu cita. Te responderemos personalmente y te enviaremos la confirmación por WhatsApp.
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
          <span className="field-label">WhatsApp / Móvil para confirmación *</span>
          <input
            type="tel"
            name="telefono"
            autoComplete="tel"
            required
            maxLength={30}
            value={form.telefono}
            onChange={(event) => update('telefono', event.target.value)}
            placeholder="+34 600 00 00 00"
            className="field font-mono"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="field-label">Correo electrónico <span className="text-xs text-muted font-normal">(opcional)</span></span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={100}
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="tu-email@ejemplo.com"
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
                    {service.name}{service.badge ? ` (${service.badge})` : ''} · {service.price}
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
          className="mt-5 rounded-2xl border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.08)] p-4 text-sm text-[#be123c]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="button button-dark mt-8 w-full justify-center cursor-pointer"
      >
        {isSubmitting ? 'Enviando solicitud...' : 'Enviar solicitud de cita'}
        <span aria-hidden="true">→</span>
      </button>

      <p className="mt-5 text-xs leading-6 text-muted">
        * Campos obligatorios. Tu información se procesa de forma segura para coordinar tu cita en GoldBlack Lash Studio.
      </p>
    </form>
  )
}