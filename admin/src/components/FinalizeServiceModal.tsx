import React, { useState, useEffect } from 'react'
import { Appointment, StudioConfig, PaymentMethod, Client, Invoice } from '../types/admin'
import {
  IconCheck,
  IconX,
  IconReceipt,
  IconCreditCard,
  IconMail,
  IconSparkles,
  IconClock,
} from './Icons'
import { LogoBizum, LogoCreditCards, LogoCash, LogoBankTransfer } from './PaymentLogos'

interface FinalizeServiceModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  config: StudioConfig
  clients?: Client[]
  onConfirm: (options: {
    paymentMethod: PaymentMethod
    clientEmail?: string
    clientNif?: string
    sendEmail?: boolean
    customNotes?: string
  }) => Promise<any>
}

export const FinalizeServiceModal: React.FC<FinalizeServiceModalProps> = ({
  isOpen,
  onClose,
  appointment,
  config,
  clients = [],
  onConfirm,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bizum')
  const [clientEmail, setClientEmail] = useState('')
  const [clientNif, setClientNif] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [customNotes, setCustomNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize data when appointment changes
  useEffect(() => {
    if (appointment) {
      // Look up if client already has email or NIF in clients database
      let initialEmail = appointment.clientEmail || ''
      let initialNif = ''

      const matchedClient = clients.find(
        (c) =>
          (appointment.clientPhone && c.phone === appointment.clientPhone) ||
          (appointment.clientName && c.name.toLowerCase() === appointment.clientName.toLowerCase())
      )

      if (matchedClient) {
        if (!initialEmail && matchedClient.email) initialEmail = matchedClient.email
        if (matchedClient.nif) initialNif = matchedClient.nif
      }

      setClientEmail(initialEmail)
      setClientNif(initialNif)
      setSendEmail(Boolean(initialEmail.trim()))
      setCustomNotes(`Tratamiento de pestañas completado en estudio (${appointment.time})`)
      setPaymentMethod(
        appointment.paymentStatus === 'pagado' || appointment.paymentStatus === 'seña_pagada'
          ? 'bizum'
          : 'bizum'
      )
    }
  }, [appointment, clients, isOpen])

  if (!isOpen || !appointment) return null

  const totalPrice = Number(appointment.price) || 0
  const subtotal = totalPrice
  const taxAmount = 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onConfirm({
        paymentMethod,
        clientEmail: clientEmail.trim() || undefined,
        clientNif: clientNif.trim() || undefined,
        sendEmail: sendEmail && Boolean(clientEmail.trim()),
        customNotes: customNotes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      console.error('[Finalize Service Error]:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-[#12121a] border border-gold-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#242436] flex items-center justify-between bg-gradient-to-r from-[#171724] via-[#1a1a2b] to-[#12121a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gold-500/15 border border-gold-500/30 text-gold-400 shadow-gold-glow">
              <IconReceipt size={22} className="text-gold-400" />
            </div>
            <div>
              <h3 className="font-sans text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Finalizar Servicio & Emitir Factura
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Emisión automática en Facturación & Caja
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#202030] transition-colors cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {/* Summary Card */}
          <div className="p-4 rounded-2xl bg-[#161622] border border-[#262638] space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gold-400 block">
                  Clienta
                </span>
                <h4 className="text-base font-bold text-white">{appointment.clientName}</h4>
                <p className="text-xs font-mono text-gray-400">{appointment.clientPhone}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                  Servicio
                </span>
                <span className="text-sm font-semibold text-gold-300 block">{appointment.serviceName}</span>
                <span className="text-[11px] text-gray-400 flex items-center justify-end gap-1 mt-0.5">
                  <IconClock size={11} /> {appointment.date} • {appointment.time}
                </span>
              </div>
            </div>

            {/* Technical curl/length if present */}
            {(appointment.curl || appointment.length || appointment.style) && (
              <div className="pt-2 border-t border-[#222232] flex flex-wrap items-center gap-2 text-[10.5px] text-gray-400">
                {appointment.style && (
                  <span className="px-2 py-0.5 rounded bg-[#1c1c2a] text-gray-300 border border-[#2b2b3d]">
                    {appointment.style}
                  </span>
                )}
                {appointment.curl && (
                  <span className="px-2 py-0.5 rounded bg-[#1c1c2a] text-gray-300 border border-[#2b2b3d]">
                    Curva: <strong className="text-gold-400">{appointment.curl}</strong>
                  </span>
                )}
                {appointment.length && (
                  <span className="px-2 py-0.5 rounded bg-[#1c1c2a] text-gray-300 border border-[#2b2b3d]">
                    {appointment.length}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Financial Summary Card - Sin IVA */}
          <div className="p-4 rounded-2xl bg-[#0e0e14] border border-[#202030] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                Importe Total del Servicio
              </span>
              <span className="text-xs text-gray-500">Tarifa final neta (Sin IVA)</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-gold-300">
                {totalPrice.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Payment Method Selector with Real Logos */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
              Método de Cobro en Estudio *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'bizum' as PaymentMethod,
                  label: 'Bizum',
                  renderLogo: () => <LogoBizum size={24} />,
                  subtitle: 'Directo al móvil',
                },
                {
                  id: 'tarjeta' as PaymentMethod,
                  label: 'Tarjeta / TPV',
                  renderLogo: () => <LogoCreditCards height={18} />,
                  subtitle: 'Visa • Mastercard',
                },
                {
                  id: 'efectivo' as PaymentMethod,
                  label: 'Efectivo',
                  renderLogo: () => <LogoCash size={24} />,
                  subtitle: 'Moneda / Billete',
                },
                {
                  id: 'transferencia' as PaymentMethod,
                  label: 'Transferencia',
                  renderLogo: () => <LogoBankTransfer size={24} />,
                  subtitle: 'SEPA / Banco',
                },
              ].map((m) => {
                const isSelected = paymentMethod === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer min-h-[86px] ${
                      isSelected
                        ? 'bg-gold-500/20 border-gold-400 text-white shadow-gold-glow ring-1 ring-gold-400/50'
                        : 'bg-[#151520] border-[#252538] text-gray-400 hover:text-gray-200 hover:bg-[#1a1a28]'
                    }`}
                  >
                    <div className="h-7 flex items-center justify-center">
                      {m.renderLogo()}
                    </div>
                    <div className="leading-tight">
                      <span className="text-[11.5px] font-bold block text-white">{m.label}</span>
                      <span className="text-[9.5px] text-gray-400 block font-normal">{m.subtitle}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Email Dispatch Section */}
          <div className="p-4 rounded-2xl bg-[#161622] border border-[#252536] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-[#3a3a4e] text-gold-500 focus:ring-gold-400 cursor-pointer h-4 w-4 bg-[#1e1e2c]"
                />
                <span className="flex items-center gap-1.5">
                  <IconMail size={14} className="text-gold-400" />
                  Enviar factura oficial por correo a la clienta
                </span>
              </label>
            </div>

            {sendEmail && (
              <div className="space-y-2 pt-1 animate-fadeIn">
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="ejemplo: clienta@correo.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0f0f16] border border-[#2c2c3e] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
                <p className="text-[10.5px] text-gray-400 leading-tight">
                  Se enviará automáticamente el recibo oficial con diseño Atelier GoldBlack Lash mediante Resend.
                </p>
              </div>
            )}
          </div>

          {/* Optional Client NIF & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                DNI / NIF de la Clienta (Opcional)
              </label>
              <input
                type="text"
                value={clientNif}
                onChange={(e) => setClientNif(e.target.value)}
                placeholder="ej: 12345678Z"
                className="w-full px-3 py-2 rounded-xl bg-[#0f0f16] border border-[#252536] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Observaciones en Factura
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Notas de servicio"
                className="w-full px-3 py-2 rounded-xl bg-[#0f0f16] border border-[#252536] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#242436] flex items-center justify-between gap-3 bg-[#101016]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-[#1c1c28] hover:bg-[#252538] text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 max-w-[280px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-400 hover:from-gold-400 hover:to-amber-300 text-black font-bold text-xs uppercase tracking-wider shadow-gold-glow transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <IconCheck size={16} className="stroke-[2.5]" />
            <span>{isSubmitting ? 'Emitiendo Factura...' : '✓ Finalizar & Emitir Factura'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
