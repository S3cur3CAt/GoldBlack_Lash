import React, { useState, useMemo, useEffect } from 'react'
import { Invoice, PaymentMethod, InvoiceStatus, StudioConfig, Client, AdminService, InvoiceItem } from '../types/admin'
import { useDialog } from '../context/DialogContext'
import { sendInvoiceEmail } from '../services/storage'
import {
  IconReceipt,
  IconCreditCard,
  IconPrinter,
  IconDownload,
  IconSearch,
  IconCheck,
  IconX,
  IconPlus,
  IconMail,
  IconTrash,
  IconEdit,
  IconEye,
  IconClock,
  IconUsers,
  IconSparkles,
  IconSend,
  IconWhatsApp,
} from './Icons'
import { WhatsAppModal } from './WhatsAppModal'
import { LogoBizum, LogoCreditCards, LogoCash, LogoBankTransfer } from './PaymentLogos'

interface BillingProps {
  invoices: Invoice[]
  clients?: Client[]
  services?: AdminService[]
  config: StudioConfig
  onSaveInvoice: (invoice: Invoice) => void
  onDeleteInvoice?: (id: string) => void
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (open: boolean) => void
}

export const Billing: React.FC<BillingProps> = ({
  invoices,
  clients = [],
  services = [],
  config,
  onSaveInvoice,
  onDeleteInvoice,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const { showAlert, showConfirm } = useDialog()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals state
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null)
  const [whatsappInvoice, setWhatsappInvoice] = useState<Invoice | null>(null)

  // Email modal form state
  const [emailRecipient, setEmailRecipient] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailCustomNote, setEmailCustomNote] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Form State for new or editing invoice
  const [formData, setFormData] = useState<{
    id?: string
    number: string
    clientName: string
    clientNif: string
    clientPhone: string
    clientEmail: string
    date: string
    items: InvoiceItem[]
    subtotal: number
    taxRate: number
    taxAmount: number
    total: number
    paymentMethod: PaymentMethod
    status: InvoiceStatus
    notes: string
  }>({
    number: '',
    clientName: '',
    clientNif: '',
    clientPhone: '',
    clientEmail: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ description: 'Servicio de Extensiones de Pestañas', quantity: 1, unitPrice: 30, total: 30 }],
    subtotal: 30,
    taxRate: 0,
    taxAmount: 0,
    total: 30,
    paymentMethod: 'bizum',
    status: 'cobrada',
    notes: '',
  })

  // Generate next sequential invoice number
  const generateNextNumber = () => {
    const year = new Date().getFullYear()
    const count = invoices.length + 1
    return `${year}-${String(count).padStart(3, '0')}`
  }

  // When opening Create Modal, reset form
  useEffect(() => {
    if (isCreateModalOpen) {
      const nextNum = generateNextNumber()
      setFormData({
        id: `fac-${Date.now()}`,
        number: nextNum,
        clientName: '',
        clientNif: '',
        clientPhone: '',
        clientEmail: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ description: 'Tratamiento de Pestañas', quantity: 1, unitPrice: 30, total: 30 }],
        subtotal: 30,
        taxRate: 0,
        taxAmount: 0,
        total: 30,
        paymentMethod: 'bizum',
        status: 'cobrada',
        notes: '',
      })
    }
  }, [isCreateModalOpen])

  // Open edit modal
  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv)
    setFormData({
      id: inv.id,
      number: inv.number,
      clientName: inv.clientName || '',
      clientNif: inv.clientNif || '',
      clientPhone: inv.clientPhone || '',
      clientEmail: inv.clientEmail || '',
      date: inv.date || new Date().toISOString().split('T')[0],
      items: inv.items && inv.items.length > 0 ? [...inv.items] : [{ description: 'Servicio', quantity: 1, unitPrice: inv.total, total: inv.total }],
      subtotal: inv.total || inv.subtotal || 0,
      taxRate: 0,
      taxAmount: 0,
      total: inv.total || 0,
      paymentMethod: inv.paymentMethod || 'bizum',
      status: inv.status || 'cobrada',
      notes: inv.notes || '',
    })
  }

  // Open email modal for specific invoice
  const handleOpenEmail = (inv: Invoice) => {
    setEmailInvoice(inv)
    let initialEmail = inv.clientEmail || ''
    if (!initialEmail && clients.length > 0) {
      const matchedClient = clients.find(
        (c) => (inv.clientPhone && c.phone === inv.clientPhone) || (inv.clientName && c.name.toLowerCase() === inv.clientName.toLowerCase())
      )
      if (matchedClient?.email) {
        initialEmail = matchedClient.email
      }
    }
    setEmailRecipient(initialEmail)
    setEmailSubject(`📄 Factura ${inv.number} — ${config.name}`)
    setEmailCustomNote(`Hola ${inv.clientName},\n\nTe adjuntamos el recibo oficial y desglose de tu servicio en ${config.name}.\n¡Muchas gracias por tu confianza!`)
  }

  // Send Email handler
  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInvoice) return

    const trimmedEmail = emailRecipient.trim()
    if (!trimmedEmail) {
      showAlert({
        title: 'Correo requerido',
        message: 'Por favor indica la dirección de correo de la clienta para enviar la factura.',
        type: 'warning',
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const res = await sendInvoiceEmail(emailInvoice, config, trimmedEmail, emailCustomNote)
      if (res.ok) {
        // If invoice didn't have email stored, update it
        if (emailInvoice.clientEmail !== trimmedEmail) {
          onSaveInvoice({ ...emailInvoice, clientEmail: trimmedEmail })
        }
        showAlert({
          title: 'Factura Enviada',
          message: `✓ La factura ${emailInvoice.number} ha sido enviada exitosamente a ${trimmedEmail}.`,
          type: 'success',
        })
        setEmailInvoice(null)
      } else {
        showAlert({
          title: 'Error al enviar',
          message: res.error || 'No se pudo enviar el correo de la factura.',
          type: 'error',
        })
      }
    } catch (err: any) {
      showAlert({
        title: 'Error de envío',
        message: err?.message || 'Error de conexión con el servicio de correo.',
        type: 'error',
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Delete invoice with confirmation
  const handleDelete = (inv: Invoice) => {
    showConfirm({
      title: '¿Eliminar Factura?',
      message: `¿Estás seguro de que deseas eliminar la factura ${inv.number} de ${inv.clientName} (${inv.total.toFixed(2)} €)? Se eliminará de la caja y de la base de datos de Supabase.`,
      confirmText: 'Eliminar Factura',
      danger: true,
      onConfirm: () => {
        if (onDeleteInvoice) {
          onDeleteInvoice(inv.id)
        }
        if (detailInvoice?.id === inv.id) setDetailInvoice(null)
        if (selectedInvoiceForPrint?.id === inv.id) setSelectedInvoiceForPrint(null)
        showAlert({
          title: 'Factura Eliminada',
          message: `La factura ${inv.number} ha sido eliminada correctamente.`,
          type: 'success',
        })
      },
    })
  }

  // Financial Calculations & KPIs
  const kpis = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let monthTotal = 0
    let yearTotal = 0
    let totalCobrado = 0
    let totalPendiente = 0
    let countMonth = 0

    const paymentBreakdown: Record<PaymentMethod, number> = {
      efectivo: 0,
      bizum: 0,
      tarjeta: 0,
      transferencia: 0,
    }

    invoices.forEach((inv) => {
      if (inv.status === 'anulada') return

      const d = new Date(inv.date)
      const amount = Number(inv.total) || 0

      // All-time totals
      if (inv.status === 'cobrada') {
        totalCobrado += amount
        if (paymentBreakdown[inv.paymentMethod] !== undefined) {
          paymentBreakdown[inv.paymentMethod] += amount
        }
      } else if (inv.status === 'pendiente') {
        totalPendiente += amount
      }

      // Year total
      if (d.getFullYear() === currentYear) {
        yearTotal += amount
      }

      // Month total
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        monthTotal += amount
        countMonth++
      }
    })

    return {
      monthTotal,
      yearTotal,
      totalCobrado,
      totalPendiente,
      countMonth,
      paymentBreakdown,
    }
  }, [invoices])

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (filterStatus !== 'all' && inv.status !== filterStatus) return false
        if (filterPayment !== 'all' && inv.paymentMethod !== filterPayment) return false
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchClient = (inv.clientName || '').toLowerCase().includes(q)
          const matchNum = (inv.number || '').toLowerCase().includes(q)
          const matchPhone = (inv.clientPhone || '').toLowerCase().includes(q)
          const matchNif = (inv.clientNif || '').toLowerCase().includes(q)
          if (!matchClient && !matchNum && !matchPhone && !matchNif) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [invoices, filterStatus, filterPayment, searchQuery])

  // Recalculate totals (Sin IVA / 0% VAT)
  const recalculateTotals = (items: InvoiceItem[], _rate?: number) => {
    const total = items.reduce((acc, item) => acc + (Number(item.total) || 0), 0)
    return { subtotal: total, taxAmount: 0, total }
  }

  // Handle item change in modal
  const handleItemChange = (index: number, field: string, val: any) => {
    const items = [...(formData.items || [])]
    items[index] = { ...items[index], [field]: val }
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(items[index].quantity) || 1
      const p = Number(items[index].unitPrice) || 0
      items[index].total = Number((q * p).toFixed(2))
    }

    const { subtotal, taxAmount, total } = recalculateTotals(items, formData.taxRate)
    setFormData({
      ...formData,
      items,
      subtotal,
      taxAmount,
      total,
    })
  }

  // Add line item
  const handleAddItem = () => {
    const items = [...(formData.items || []), { description: 'Tratamiento adicional', quantity: 1, unitPrice: 20, total: 20 }]
    const { subtotal, taxAmount, total } = recalculateTotals(items, formData.taxRate)
    setFormData({ ...formData, items, subtotal, taxAmount, total })
  }

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if ((formData.items || []).length <= 1) return
    const items = formData.items.filter((_, i) => i !== index)
    const { subtotal, taxAmount, total } = recalculateTotals(items, formData.taxRate)
    setFormData({ ...formData, items, subtotal, taxAmount, total })
  }

  // Select existing service to add
  const handleAddServiceToItems = (serviceId: string) => {
    const s = services.find((srv) => srv.id === serviceId)
    if (!s) return
    const unitPrice = s.priceNumber || parseFloat(s.price.replace(/[^\d.]/g, '')) || 30
    const newItem: InvoiceItem = {
      description: s.name,
      quantity: 1,
      unitPrice,
      total: unitPrice,
    }
    const items = [...formData.items, newItem]
    const { subtotal, taxAmount, total } = recalculateTotals(items, formData.taxRate)
    setFormData({ ...formData, items, subtotal, taxAmount, total })
  }

  // Select existing client
  const handleSelectClient = (clientId: string) => {
    const c = clients.find((cli) => cli.id === clientId)
    if (!c) return
    setFormData({
      ...formData,
      clientName: c.name,
      clientPhone: c.phone || formData.clientPhone,
      clientEmail: c.email || formData.clientEmail,
    })
  }

  // Handle submit form (Create or Edit)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientName.trim()) {
      showAlert({
        title: 'Clienta requerida',
        message: 'Por favor introduce el nombre de la clienta para emitir la factura.',
        type: 'warning',
      })
      return
    }

    const invoiceToSave: Invoice = {
      id: formData.id || `fac-${Date.now()}`,
      number: formData.number || generateNextNumber(),
      date: formData.date || new Date().toISOString().split('T')[0],
      clientName: formData.clientName.trim(),
      clientNif: formData.clientNif.trim() || undefined,
      clientPhone: formData.clientPhone.trim() || undefined,
      clientEmail: formData.clientEmail.trim() || undefined,
      items: formData.items,
      subtotal: Number(formData.total) || Number(formData.subtotal) || 0,
      taxRate: 0,
      taxAmount: 0,
      total: Number(formData.total) || 0,
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      notes: formData.notes.trim() || undefined,
      createdAt: editingInvoice ? editingInvoice.createdAt : new Date().toISOString(),
    }

    onSaveInvoice(invoiceToSave)

    if (editingInvoice) {
      if (detailInvoice?.id === editingInvoice.id) {
        setDetailInvoice(invoiceToSave)
      }
      setEditingInvoice(null)
      showAlert({
        title: 'Factura Actualizada',
        message: `✓ Factura ${invoiceToSave.number} guardada y sincronizada con Supabase.`,
        type: 'success',
      })
    } else {
      setIsCreateModalOpen(false)
      showAlert({
        title: 'Factura Emitida',
        message: `✓ Factura ${invoiceToSave.number} emitida y registrada en Supabase.`,
        type: 'success',
      })
    }
  }

  // Export to CSV for accountant
  const handleExportCSV = () => {
    if (invoices.length === 0) {
      showAlert({
        title: 'Sin datos',
        message: 'No hay facturas registradas para exportar.',
        type: 'info',
      })
      return
    }

    const headers = ['Numero', 'Fecha', 'Clienta', 'NIF', 'Telefono', 'Email', 'Metodo_Pago', 'Importe_Total', 'Estado']
    const rows = invoices.map((inv) => [
      inv.number,
      inv.date,
      `"${inv.clientName.replace(/"/g, '""')}"`,
      inv.clientNif || '',
      inv.clientPhone || '',
      inv.clientEmail || '',
      inv.paymentMethod,
      inv.total.toFixed(2),
      inv.status,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Facturacion_GoldBlackLash_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Open printable ticket view
  const handleOpenPrint = (invoice: Invoice) => {
    setSelectedInvoiceForPrint(invoice)
    setIsPrintModalOpen(true)
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full select-none">
      {/* Top Financial KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Facturado Este Mes */}
        <div className="p-5 rounded-2xl bg-ink-850 border border-line hover:border-gold-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Ingresos Este Mes</span>
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400">
              <IconReceipt size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-sans tracking-tight text-gold-300 tabular-nums">{kpis.monthTotal.toFixed(2)} €</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {kpis.countMonth} {kpis.countMonth === 1 ? 'factura emitida' : 'facturas emitidas'} este mes
          </p>
        </div>

        {/* Card 2: Total Cobrado en Caja */}
        <div className="p-5 rounded-2xl bg-ink-850 border border-line hover:border-gold-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Cobrado</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <IconCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-sans tracking-tight text-emerald-400 tabular-nums">{kpis.totalCobrado.toFixed(2)} €</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Pagos asentados en caja sin incidencias
          </p>
        </div>

        {/* Card 3: Pendiente de Cobro */}
        <div className="p-5 rounded-2xl bg-ink-850 border border-line hover:border-gold-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Pendiente de Cobro</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <IconClock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-sans tracking-tight text-amber-300 tabular-nums">{kpis.totalPendiente.toFixed(2)} €</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Servicios pendientes de cobro final
          </p>
        </div>

        {/* Card 4: Desglose por Método de Pago */}
        <div className="p-5 rounded-2xl bg-ink-850 border border-line hover:border-gold-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Desglose Métodos</span>
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400">
              <IconCreditCard size={18} />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />Bizum:</span>
              <strong className="font-mono text-white">{kpis.paymentBreakdown.bizum.toFixed(2)} €</strong>
            </div>
            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-purple-400" />Tarjeta / TPV:</span>
              <strong className="font-mono text-white">{kpis.paymentBreakdown.tarjeta.toFixed(2)} €</strong>
            </div>
            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Efectivo:</span>
              <strong className="font-mono text-white">{kpis.paymentBreakdown.efectivo.toFixed(2)} €</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-4 rounded-2xl bg-ink-850 border border-line flex flex-wrap items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-ink-800 border border-line">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === 'all'
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Todas ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('cobrada')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === 'cobrada'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Cobradas
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pendiente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === 'pendiente'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Pendientes
          </button>
        </div>

        {/* Payment Method Selector & Search */}
        <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-3 py-2 rounded-xl bg-ink-850 border border-line text-xs text-gray-300 focus:outline-none focus:border-gold-500"
          >
            <option value="all">Todos los métodos de pago</option>
            <option value="bizum">Bizum</option>
            <option value="tarjeta">Tarjeta (TPV)</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>

          <div className="relative flex-1 max-w-xs">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por clienta, NIF o nº..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-ink-850 border border-line text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            title="Descargar registro en archivo Excel CSV para gestoría contable"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink-800 hover:bg-ink-800 text-gray-300 hover:text-white border border-line-strong text-xs font-semibold transition-all cursor-pointer"
          >
            <IconDownload size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="rounded-2xl bg-ink-850 border border-line overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink-850 border-b border-line text-gray-400 uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3.5 px-5 font-bold">Nº Factura</th>
                <th className="py-3.5 px-4 font-bold">Fecha</th>
                <th className="py-3.5 px-4 font-bold">Clienta</th>
                <th className="py-3.5 px-4 font-bold">Concepto</th>
                <th className="py-3.5 px-4 font-bold">Método Pago</th>
                <th className="py-3.5 px-4 font-bold">Estado</th>
                <th className="py-3.5 px-4 font-bold text-right">Total</th>
                <th className="py-3.5 px-5 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-gray-400">
                    <IconReceipt size={32} className="mx-auto text-gray-600 mb-2" />
                    <p className="text-sm font-semibold text-gray-300">No hay facturas ni recibos registrados.</p>
                    <p className="text-xs text-gray-500 mt-1">Usa el botón "+ Emitir Factura" en la cabecera superior para crear la primera.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-ink-850/60 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-gold-400">
                      {inv.number}
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-mono">
                      {inv.date}
                    </td>
                    <td className="py-4 px-4 font-semibold text-white">
                      <div>{inv.clientName}</div>
                      {inv.clientNif && <div className="text-[10px] text-gray-500 font-mono">{inv.clientNif}</div>}
                    </td>
                    <td className="py-4 px-4 text-gray-300 max-w-[200px] truncate">
                      {inv.items?.[0]?.description || 'Servicios de estética'}
                      {inv.items && inv.items.length > 1 && (
                        <span className="text-[10px] text-gold-400 ml-1">+{inv.items.length - 1} más</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {inv.paymentMethod === 'bizum' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#00c4b4]/15 border border-[#00c4b4]/35 text-[#00e0cf]">
                          <LogoBizum size={15} />
                        </span>
                      ) : inv.paymentMethod === 'tarjeta' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-500/15 border border-blue-500/35 text-blue-300">
                          <LogoCreditCards height={13} />
                        </span>
                      ) : inv.paymentMethod === 'efectivo' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                          <LogoCash size={15} />
                          <span>Efectivo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 border border-purple-500/35 text-purple-300">
                          <LogoBankTransfer size={15} />
                          <span>Transferencia</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'cobrada'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : inv.status === 'pendiente'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-sm text-gold-300 text-right">
                      {inv.total.toFixed(2)} €
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Ver Detalles */}
                        <button
                          type="button"
                          onClick={() => setDetailInvoice(inv)}
                          title="Ver todos los detalles de la factura"
                          className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-750 text-gray-300 hover:text-white border border-line-strong transition-colors cursor-pointer"
                        >
                          <IconEye size={15} />
                        </button>

                        {/* 2. Enviar por Correo a este cliente */}
                        <button
                          type="button"
                          onClick={() => handleOpenEmail(inv)}
                          title="Enviar factura oficial por correo a esta clienta"
                          className="p-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/25 text-gold-400 border border-gold-500/30 transition-colors cursor-pointer"
                        >
                          <IconMail size={15} />
                        </button>

                        {/* Enviar Ticket por WhatsApp */}
                        <button
                          type="button"
                          onClick={() => setWhatsappInvoice(inv)}
                          title="Enviar ticket y recibo por WhatsApp a esta clienta"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          <IconWhatsApp size={15} />
                        </button>

                        {/* 3. Editar Factura */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(inv)}
                          title="Editar factura"
                          className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-750 text-gray-300 hover:text-gold-300 border border-line-strong transition-colors cursor-pointer"
                        >
                          <IconEdit size={15} />
                        </button>

                        {/* 4. Imprimir Ticket */}
                        <button
                          type="button"
                          onClick={() => handleOpenPrint(inv)}
                          title="Imprimir ticket para la clienta"
                          className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-750 text-gray-300 hover:text-white border border-line-strong transition-colors cursor-pointer"
                        >
                          <IconPrinter size={15} />
                        </button>

                        {/* 5. Marcar como cobrada (si pendiente) */}
                        {inv.status === 'pendiente' && (
                          <button
                            type="button"
                            onClick={() => onSaveInvoice({ ...inv, status: 'cobrada' })}
                            title="Marcar como cobrada"
                            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
                          >
                            <IconCheck size={15} />
                          </button>
                        )}

                        {/* 6. Eliminar Factura */}
                        <button
                          type="button"
                          onClick={() => handleDelete(inv)}
                          title="Eliminar factura de Supabase y de caja"
                          className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Emitir o Editar Factura */}
      {(isCreateModalOpen || editingInvoice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-ink-900 border border-line shadow-raised animate-scale-up p-6 sm:p-7 relative overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <h3 className="font-sans text-xl font-bold text-white flex items-center gap-2">
                <IconReceipt size={22} className="text-gold-400" />
                <span>{editingInvoice ? `Editar Factura ${editingInvoice.number}` : 'Emitir Nueva Factura / Ticket'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingInvoice(null)
                }}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-ink-750 transition-colors cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-4 text-xs">
              {/* Quick Select from existing clients */}
              {clients.length > 0 && !editingInvoice && (
                <div className="p-3 rounded-2xl bg-ink-850 border border-line flex items-center justify-between gap-3">
                  <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                    <IconUsers size={15} className="text-gold-400" />
                    Seleccionar clienta registrada:
                  </span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) handleSelectClient(e.target.value)
                    }}
                    className="px-3 py-1.5 rounded-xl bg-ink-800 border border-line-strong text-white focus:outline-none focus:border-gold-500 text-xs"
                  >
                    <option value="">-- Autocompletar clienta --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Client Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Nombre de la Clienta *</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName || ''}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Ej. Sofía Benítez"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-ink-850 border border-line-strong text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">DNI / NIF</label>
                  <input
                    type="text"
                    value={formData.clientNif || ''}
                    onChange={(e) => setFormData({ ...formData, clientNif: e.target.value })}
                    placeholder="48923412X"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-ink-850 border border-line-strong text-white focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={formData.clientPhone || ''}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="604 18 76 76"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-ink-850 border border-line-strong text-white focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Correo Electrónico (para envío de factura)</label>
                  <input
                    type="email"
                    value={formData.clientEmail || ''}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="clienta@correo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-ink-850 border border-line-strong text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Nº Factura / Ticket</label>
                  <input
                    type="text"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-ink-850 border border-line-strong text-gold-300 focus:outline-none focus:border-gold-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Fecha de Emisión</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-ink-850 border border-line-strong text-white focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-gray-400 mb-1.5 font-semibold text-xs uppercase tracking-wider">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'bizum' as PaymentMethod, label: 'Bizum', logo: <LogoBizum size={20} /> },
                      { id: 'tarjeta' as PaymentMethod, label: 'Tarjeta / TPV', logo: <LogoCreditCards height={16} /> },
                      { id: 'efectivo' as PaymentMethod, label: 'Efectivo', logo: <LogoCash size={20} /> },
                      { id: 'transferencia' as PaymentMethod, label: 'Transferencia', logo: <LogoBankTransfer size={20} /> },
                    ].map((m) => {
                      const isSel = (formData.paymentMethod || 'bizum') === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: m.id })}
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isSel
                              ? 'bg-gold-500/10 border-gold-500/50 text-white ring-1 ring-gold-500/30'
                              : 'bg-ink-850 border-line text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <div className="h-6 flex items-center justify-center">{m.logo}</div>
                          <span className="text-[11px] font-bold">{m.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Line Items Container */}
              <div className="space-y-3 p-4 rounded-2xl bg-ink-900 border border-line">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-gray-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <IconSparkles size={14} className="text-gold-400" />
                    <span>Partidas y Servicios Facturados</span>
                  </div>

                  {/* Add from catalog dropdown */}
                  {services.length > 0 && (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddServiceToItems(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-ink-800 border border-gold-500/30 text-gold-300 text-[11px] focus:outline-none font-semibold"
                    >
                      <option value="">+ Añadir del Catálogo...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.price})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-ink-850 p-2.5 rounded-xl border border-line">
                      <div className="col-span-6 sm:col-span-6">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Descripción del tratamiento"
                          className="w-full px-3 py-1.5 rounded-lg bg-ink-800 border border-line-strong text-white focus:outline-none focus:border-gold-500 text-xs"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          placeholder="Cant."
                          className="w-full px-2 py-1.5 rounded-lg bg-ink-800 border border-line-strong text-white focus:outline-none focus:border-gold-500 text-xs text-center font-mono"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-3 relative">
                        <input
                          type="number"
                          step="0.5"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          placeholder="Precio"
                          className="w-full px-3 py-1.5 pr-6 rounded-lg bg-ink-800 border border-line-strong text-gold-300 focus:outline-none focus:border-gold-500 text-xs font-mono font-bold text-right"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={formData.items.length <= 1}
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-gray-500 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                        >
                          <IconX size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-gold-400 hover:text-gold-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <IconPlus size={13} />
                    <span>Añadir otra línea</span>
                  </button>

                  <div className="text-right space-y-0.5 text-xs">
                    <div className="text-base font-bold text-gold-300 pt-1">
                      Total a Cobrar: {formData.total.toFixed(2)} €
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Estado de Cobro</label>
                  <select
                    value={formData.status || 'cobrada'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-ink-850 border border-line-strong text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="cobrada">Cobrada (Asentada en Caja)</option>
                    <option value="pendiente">Pendiente de Cobro</option>
                    <option value="anulada">Anulada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Observaciones / Notas</label>
                  <input
                    type="text"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ej. Pagado por Bizum en el estudio"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-ink-850 border border-line-strong text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setEditingInvoice(null)
                  }}
                  className="px-4 py-2.5 rounded-xl bg-ink-850 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
                >
                  {editingInvoice ? 'Guardar Cambios' : 'Guardar y Emitir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Ver Detalles Completos de Factura */}
      {detailInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-ink-900 border border-line shadow-raised animate-scale-up p-6 sm:p-7 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
                  <IconReceipt size={20} />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-bold text-white">Factura {detailInvoice.number}</h3>
                  <span className="text-[11px] text-gray-400">Fecha: {detailInvoice.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                    detailInvoice.status === 'cobrada'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : detailInvoice.status === 'pendiente'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {detailInvoice.status}
                </span>
                <button
                  type="button"
                  onClick={() => setDetailInvoice(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-ink-750 transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              {/* Client and Payment summary */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-ink-850 border border-line">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Datos de la Clienta</span>
                  <div className="font-bold text-white text-sm">{detailInvoice.clientName}</div>
                  {detailInvoice.clientNif && <div className="text-gray-300 font-mono">NIF/CIF: {detailInvoice.clientNif}</div>}
                  {detailInvoice.clientPhone && <div className="text-gray-300 font-mono">Tel: {detailInvoice.clientPhone}</div>}
                  {detailInvoice.clientEmail && <div className="text-gold-300">{detailInvoice.clientEmail}</div>}
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Cobro y Asentamiento</span>
                  <div className="font-bold text-gold-300 uppercase tracking-wider">{detailInvoice.paymentMethod}</div>
                  <div className="text-gray-400">Estado: <span className="font-semibold text-white capitalize">{detailInvoice.status}</span></div>
                  {detailInvoice.notes && <div className="text-[11px] text-gray-400 italic">"{detailInvoice.notes}"</div>}
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl bg-ink-850 border border-line overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ink-800 text-gray-400 uppercase text-[10px] border-b border-line">
                    <tr>
                      <th className="py-2.5 px-3.5">Descripción</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Precio</th>
                      <th className="py-2.5 px-3.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {detailInvoice.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3.5 text-white font-medium">{item.description}</td>
                        <td className="py-2 px-3 text-center text-gray-400 font-mono">{item.quantity}</td>
                        <td className="py-2 px-3 text-right text-gray-400 font-mono">{item.unitPrice.toFixed(2)} €</td>
                        <td className="py-2 px-3.5 text-right text-gold-300 font-mono font-bold">{item.total.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Economic Summary - Sin IVA */}
              <div className="p-3.5 rounded-xl bg-ink-850 border border-line flex justify-between items-center text-xs">
                <div>
                  <span className="text-xs text-gray-400 font-medium">Tarifa neta (Sin IVA aplicado)</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase block font-semibold">Total a Cobrar</span>
                  <span className="text-2xl font-bold font-sans tracking-tight text-gold-300">{detailInvoice.total.toFixed(2)} €</span>
                </div>
              </div>

              {/* Action Buttons inside Details Modal */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => handleDelete(detailInvoice)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <IconTrash size={14} />
                  <span>Eliminar</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDetailInvoice(null)
                      handleOpenEdit(detailInvoice)
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink-800 hover:bg-ink-750 text-gray-200 border border-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <IconEdit size={14} />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvoiceForPrint(detailInvoice)
                      setIsPrintModalOpen(true)
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink-800 hover:bg-ink-750 text-gray-200 border border-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <IconPrinter size={14} />
                    <span>Imprimir Ticket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleOpenEmail(detailInvoice)
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <IconMail size={14} />
                    <span>Enviar por Correo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWhatsappInvoice(detailInvoice)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm shadow-emerald-950/40"
                  >
                    <IconWhatsApp size={14} />
                    <span>Enviar por WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Enviar Factura por Correo Electrónico (Resend) */}
      {emailInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-ink-900 border border-line shadow-raised animate-scale-up p-6 sm:p-7 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
                  <IconMail size={20} />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-bold text-white">Enviar Factura por Correo</h3>
                  <span className="text-[11px] text-gray-400">Factura {emailInvoice.number} • {emailInvoice.clientName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailInvoice(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-ink-750 transition-colors cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Destinatario (Email de la Clienta) *</label>
                <input
                  type="email"
                  required
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="clienta@correo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ink-850 border border-line-strong text-white focus:outline-none focus:border-gold-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Asunto del Correo</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ink-850 border border-line-strong text-white focus:outline-none focus:border-gold-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Mensaje Personalizado / Nota</label>
                <textarea
                  rows={4}
                  value={emailCustomNote}
                  onChange={(e) => setEmailCustomNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-ink-850 border border-line-strong text-white focus:outline-none focus:border-gold-500 text-xs resize-none"
                />
              </div>

              {/* Preview Box */}
              <div className="p-3.5 rounded-2xl bg-ink-900 border border-line space-y-1.5">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Factura: <strong className="text-white font-mono">{emailInvoice.number}</strong></span>
                  <span>Fecha: <strong className="text-white font-mono">{emailInvoice.date}</strong></span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Importe total:</span>
                  <span className="text-gold-300 font-bold font-mono text-sm">{emailInvoice.total.toFixed(2)} €</span>
                </div>
                <p className="text-[10.5px] text-gray-500 pt-1 border-t border-line">
                  Se enviará un comprobante oficial de alta fidelidad con el membrete del atelier y el importe neto del servicio.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEmailInvoice(null)}
                  className="px-4 py-2.5 rounded-xl bg-ink-850 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-semibold uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
                >
                  <IconSend size={15} />
                  <span>{isSendingEmail ? 'Enviando...' : 'Enviar Factura'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Ticket / Factura Imprimible (Apple-style receipt) */}
      {isPrintModalOpen && selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white text-gray-900 shadow-2xl p-6 sm:p-8 relative print:m-0 print:p-4 print:shadow-none">
            {/* Action Bar (hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 print:hidden mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recibo / Ticket Oficial</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPrintModalOpen(false)
                    handleOpenEmail(selectedInvoiceForPrint)
                  }}
                  title="Enviar por correo"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 text-gold-800 text-xs font-bold transition-all cursor-pointer"
                >
                  <IconMail size={14} />
                  <span>Enviar</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow cursor-pointer"
                >
                  <IconPrinter size={14} />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>
            </div>

            {/* Printable Ticket Receipt Content */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-gray-300">
              <h2 className="font-bold text-lg text-gray-900 tracking-tight">{config.name}</h2>
              <p className="text-[11px] text-gray-600">{config.tagline}</p>
              <p className="text-[10px] text-gray-500">{config.address}, {config.city}</p>
              <p className="text-[10px] text-gray-500 font-mono">Tel: {config.phoneDisplay}</p>
            </div>

            <div className="py-3 border-b border-dashed border-gray-300 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Ticket / Factura:</span>
                <span className="font-mono font-bold text-gray-900">{selectedInvoiceForPrint.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha:</span>
                <span className="font-mono text-gray-900">{selectedInvoiceForPrint.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Clienta:</span>
                <span className="font-bold text-gray-900">{selectedInvoiceForPrint.clientName}</span>
              </div>
              {selectedInvoiceForPrint.clientNif && (
                <div className="flex justify-between">
                  <span className="text-gray-500">NIF / CIF:</span>
                  <span className="font-mono text-gray-900">{selectedInvoiceForPrint.clientNif}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Forma de Pago:</span>
                <span className="font-semibold text-gray-900 uppercase">{selectedInvoiceForPrint.paymentMethod}</span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="py-3 border-b border-dashed border-gray-300 space-y-2 text-xs">
              <div className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">Tratamientos Realizados</div>
              {selectedInvoiceForPrint.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-900 font-medium">{item.description}</span>
                    <span className="text-gray-400 text-[10px] block">Cant: {item.quantity} x {item.unitPrice.toFixed(2)} €</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">{item.total.toFixed(2)} €</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="py-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-900">
                <span>TOTAL:</span>
                <span className="font-mono">{selectedInvoiceForPrint.total.toFixed(2)} €</span>
              </div>
            </div>

            {/* Footer Greeting */}
            <div className="pt-4 text-center text-[10.5px] text-gray-500 space-y-1 border-t border-dashed border-gray-300">
              <p className="font-semibold text-gray-700">¡Gracias por tu confianza en GoldBlack Lash!</p>
              <p className="text-[9.5px]">Conserva este recibo para cualquier retoque o consulta.</p>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal for Billing Ticket Dispatch */}
      <WhatsAppModal
        isOpen={Boolean(whatsappInvoice)}
        onClose={() => setWhatsappInvoice(null)}
        invoice={whatsappInvoice}
        config={config}
        initialMode="factura"
      />
    </div>
  )
}
