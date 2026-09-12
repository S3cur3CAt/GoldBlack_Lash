import { useState, useRef, useEffect } from 'react'

export interface ReservationEventDetail {
  serviceName?: string
  serviceId?: string
}

export function openReservationModal(options?: ReservationEventDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('goldblack:open-reservation', { detail: options || {} }))
  }
}

interface ReservationModalProps {
  open?: boolean
  onClose?: () => void
  serviceName?: string
  serviceId?: string
}

const POPULAR_SERVICES = [
  'Volumen Ruso (Más Popular)',
  'Volumen 3D',
  'Volumen 4D',
  'Volumen 5D',
  'Volumen 6D',
  'Mega Volumen Glam',
  'Lifting de Pestañas con Tinte & Queratina',
  'Retoque (2 a 3 semanas)',
  'Retirada Profesional & Spa Ocular',
  'Asesoramiento Personalizado',
]

export function ReservationModal({
  open: controlledOpen,
  onClose: controlledOnClose,
  serviceName: initialServiceName,
  serviceId: initialServiceId,
}: ReservationModalProps) {
  const [isOpen, setIsOpen] = useState(controlledOpen ?? false)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [selectedService, setSelectedService] = useState(initialServiceName || 'Volumen Ruso (Más Popular)')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Sync with controlled prop if passed
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setIsOpen(controlledOpen)
    }
  }, [controlledOpen])

  // Listen to global open event
  useEffect(() => {
    const handleOpen = (e: any) => {
      const detail = e.detail as ReservationEventDetail | undefined
      if (detail?.serviceName) {
        setSelectedService(detail.serviceName)
      }
      setIsSuccess(false)
      setError(null)
      setIsOpen(true)
    }

    window.addEventListener('goldblack:open-reservation', handleOpen)
    return () => {
      window.removeEventListener('goldblack:open-reservation', handleOpen)
    }
  }, [])

  // Handle dialog opening & closing
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) dialog.showModal()
      setTimeout(() => nameInputRef.current?.focus(), 150)
      document.body.style.overflow = 'hidden'
    } else {
      if (dialog.open) dialog.close()
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  function handleClose() {
    setIsOpen(false)
    controlledOnClose?.()
    if (isSuccess) {
      setClientName('')
      setClientPhone('')
      setClientEmail('')
      setNotes('')
      setIsSuccess(false)
    }
    setError(null)
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      handleClose()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedName = clientName.trim()
    const trimmedPhone = clientPhone.trim()
    const trimmedEmail = clientEmail.trim()

    if (!trimmedName) {
      setError('Por favor, indica tu nombre completo.')
      return
    }
    if (!trimmedPhone || trimmedPhone.replace(/\D/g, '').length < 9) {
      setError('Por favor, introduce un teléfono de contacto válido (mínimo 9 dígitos).')
      return
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Por favor, introduce una dirección de correo electrónico válida.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const appointmentId = `apt-web-${Date.now()}`
      const today = new Date().toISOString().split('T')[0]

      const payload = {
        id: appointmentId,
        clientName: trimmedName,
        clientPhone: trimmedPhone,
        clientEmail: trimmedEmail,
        serviceName: selectedService,
        serviceId: initialServiceId || 'web-reservation',
        date: today,
        time: 'Por coordinar',
        durationMinutes: 90,
        price: 30,
        status: 'pendiente',
        paymentStatus: 'pendiente',
        notes: notes.trim()
          ? `Solicitud web: ${notes.trim()}`
          : 'Solicitud de reserva online desde el sitio web',
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}: No se pudo guardar la reserva.`)
      }

      setIsSuccess(true)
    } catch (err: any) {
      console.error('Error enviando reserva:', err)
      setError(
        err.message || 'Ocurrió un error al enviar tu solicitud. Inténtalo de nuevo en unos momentos.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen && !controlledOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault()
        handleClose()
      }}
      className="reservation-modal-backdrop"
    >
      <div className="reservation-modal-card reservation-modal-card-horizontal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="reservation-close-btn"
          aria-label="Cerrar ventana"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {isSuccess ? (
          /* SUCCESS VIEW */
          <div className="reservation-success-view">
            <div className="reservation-success-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>

            <span className="reservation-badge">¡Solicitud Registrada!</span>
            <h3 className="reservation-title">¡Reserva enviada con éxito!</h3>

            <p className="reservation-text max-w-lg mx-auto">
              Muchas gracias, <strong className="text-ink font-semibold">{clientName}</strong>.
              Tu cita para <strong className="text-rose font-semibold">{selectedService}</strong> ha quedado registrada en nuestra aplicación de administración.
            </p>

            <div className="reservation-notice-box max-w-md mx-auto space-y-1.5">
              <p className="text-xs text-muted leading-relaxed">
                Hemos enviado un correo con todos los detalles a <strong className="text-ink font-semibold">{clientEmail}</strong>.
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Nos pondremos en contacto contigo al número <strong className="text-ink font-mono">{clientPhone}</strong> para coordinar tu horario ideal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="reservation-submit-btn max-w-sm mx-auto mt-4"
            >
              Entendido, gracias
            </button>
          </div>
        ) : (
          /* FORM VIEW */
          <div className="reservation-form-view">
            <div className="reservation-header">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <span className="reservation-badge">GoldBlack Lash Studio</span>
                <span className="text-[11px] font-medium text-rose tracking-wide flex items-center gap-1 bg-blush/60 px-2.5 py-0.5 rounded-full">
                  ⚡ Confirmación directa con el estudio
                </span>
              </div>
              <h2 className="reservation-title">Reserva tu momento</h2>
              <p className="reservation-subtitle">
                Introduce tus datos para registrar tu cita. Nos pondremos en contacto contigo para coordinar tu horario ideal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="reservation-form">
              <div className="reservation-form-grid">
                {/* Left Column */}
                <div className="reservation-col">
                  {/* Name */}
                  <div className="reservation-field-group">
                    <label htmlFor="res-name" className="reservation-label">
                      Nombre completo <span className="text-rose">*</span>
                    </label>
                    <div className="reservation-input-wrapper">
                      <svg className="reservation-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <input
                        ref={nameInputRef}
                        id="res-name"
                        type="text"
                        required
                        placeholder="Ej. María García"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="reservation-input"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="reservation-field-group">
                    <label htmlFor="res-email" className="reservation-label">
                      Correo electrónico para confirmación <span className="text-rose">*</span>
                    </label>
                    <div className="reservation-input-wrapper">
                      <svg className="reservation-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                      <input
                        id="res-email"
                        type="email"
                        required
                        placeholder="tu-correo@ejemplo.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="reservation-input"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="reservation-field-group">
                    <label htmlFor="res-phone" className="reservation-label">
                      Número de teléfono móvil <span className="text-rose">*</span>
                    </label>
                    <div className="reservation-input-wrapper">
                      <svg className="reservation-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      <input
                        id="res-phone"
                        type="tel"
                        required
                        placeholder="Ej. 604 18 76 76"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="reservation-input font-mono"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="reservation-col">
                  {/* Service Selection */}
                  <div className="reservation-field-group">
                    <label htmlFor="res-service" className="reservation-label">
                      Tratamiento de interés
                    </label>
                    <div className="reservation-input-wrapper">
                      <svg className="reservation-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                      </svg>
                      <select
                        id="res-service"
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="reservation-input cursor-pointer"
                      >
                        {POPULAR_SERVICES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="reservation-field-group">
                    <label htmlFor="res-notes" className="reservation-label">
                      Preferencia de horario o comentario <span className="text-muted text-[11px] font-normal">(opcional)</span>
                    </label>
                    <textarea
                      id="res-notes"
                      rows={2}
                      placeholder="Ej. Preferiblemente por las mañanas..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="reservation-input resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="reservation-error-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="reservation-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <span className="reservation-spinner" />
                    Registrando reserva...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Confirmar mi reserva
                  </>
                )}
              </button>

              <p className="reservation-footer-notice">
                🔒 Tu información queda registrada de forma privada y segura en nuestro panel de citas.
              </p>
            </form>
          </div>
        )}
      </div>
    </dialog>
  )
}
