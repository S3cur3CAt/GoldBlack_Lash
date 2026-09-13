import React, { useState, useMemo } from 'react'
import { Invoice, PaymentMethod, InvoiceStatus, StudioConfig } from '../types/admin'
import {
  IconReceipt,
  IconCreditCard,
  IconPrinter,
  IconDownload,
  IconSearch,
  IconCheck,
  IconX,
  IconPlus,
  IconAlertCircle,
  IconClock,
} from './Icons'

interface BillingProps {
  invoices: Invoice[]
  config: StudioConfig
  onSaveInvoice: (invoice: Invoice) => void
  onDeleteInvoice?: (id: string) => void
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (open: boolean) => void
}

export const Billing: React.FC<BillingProps> = ({
  invoices,
  config,
  onSaveInvoice,
  onDeleteInvoice,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)

  // Form State for new invoice
  const [formData, setFormData] = useState<Partial<Invoice>>({
    clientName: '',
    clientNif: '',
    clientPhone: '',
    clientEmail: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ description: 'Servicio de Extensiones de Pestañas', quantity: 1, unitPrice: 35, total: 35 }],
    subtotal: 28.93,
    taxRate: 21,
    taxAmount: 6.07,
    total: 35,
    paymentMethod: 'bizum',
    status: 'cobrada',
    notes: '',
  })

  // Calculations & KPIs
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

  // Handle item change in modal
  const handleItemChange = (index: number, field: string, val: any) => {
    const items = [...(formData.items || [])]
    items[index] = { ...items[index], [field]: val }
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(items[index].quantity) || 1
      const p = Number(items[index].unitPrice) || 0
      items[index].total = Number((q * p).toFixed(2))
    }

    const total = items.reduce((acc, item) => acc + (item.total || 0), 0)
    const rate = Number(formData.taxRate) || 0
    const subtotal = Number((total / (1 + rate / 100)).toFixed(2))
    const taxAmount = Number((total - subtotal).toFixed(2))

    setFormData({
      ...formData,
      items,
      subtotal,
      taxAmount,
      total,
    })
  }

  // Handle create invoice submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientName?.trim()) return

    const year = new Date().getFullYear()
    const nextNum = `${year}-${String(invoices.length + 1).padStart(3, '0')}`

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: nextNum,
      date: formData.date || new Date().toISOString().split('T')[0],
      clientName: formData.clientName.trim(),
      clientNif: formData.clientNif?.trim() || undefined,
      clientPhone: formData.clientPhone?.trim() || undefined,
      clientEmail: formData.clientEmail?.trim() || undefined,
      items: formData.items || [],
      subtotal: Number(formData.subtotal) || 0,
      taxRate: Number(formData.taxRate) || 21,
      taxAmount: Number(formData.taxAmount) || 0,
      total: Number(formData.total) || 0,
      paymentMethod: (formData.paymentMethod as PaymentMethod) || 'bizum',
      status: (formData.status as InvoiceStatus) || 'cobrada',
      notes: formData.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    }

    onSaveInvoice(newInvoice)
    setIsCreateModalOpen(false)
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Numero', 'Fecha', 'Cliente', 'NIF', 'Telefono', 'Metodo_Pago', 'Base_Imponible', 'IVA_Pct', 'Cuota_IVA', 'Total', 'Estado']
    const rows = filteredInvoices.map((inv) => [
      inv.number,
      inv.date,
      `"${inv.clientName.replace(/"/g, '""')}"`,
      inv.clientNif || '',
      inv.clientPhone || '',
      inv.paymentMethod,
      inv.subtotal.toFixed(2),
      `${inv.taxRate}%`,
      inv.taxAmount.toFixed(2),
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
    setSelectedInvoice(invoice)
    setIsPrintModalOpen(true)
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-80px)] select-none">

      {/* Top Financial KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Facturado Este Mes */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-[#20202d] hover:border-gold-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ingresos Este Mes</span>
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 shadow-gold-glow">
              <IconReceipt size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-sans tracking-tight text-gold-300">{kpis.monthTotal.toFixed(2)} €</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {kpis.countMonth} facturas y recibos emitidos este mes
          </p>
        </div>

        {/* Card 2: Total Cobrado en Caja */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-[#20202d] hover:border-gold-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Cobrado</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <IconCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-sans tracking-tight text-emerald-400">{kpis.totalCobrado.toFixed(2)} €</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Pagos asentados en caja sin incidencias
          </p>
        </div>

        {/* Card 3: Pendiente de Cobro */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-[#20202d] hover:border-gold-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pendiente de Cobro</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <IconClock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-sans tracking-tight text-amber-300">{kpis.totalPendiente.toFixed(2)} €</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Citas o recibos pendientes de liquidar
          </p>
        </div>

        {/* Card 4: Desglose Métodos de Pago */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-[#20202d] hover:border-gold-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Métodos de Pago</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <IconCreditCard size={18} />
            </div>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">Bizum:</span>
              <span className="font-mono font-bold text-white">{kpis.paymentBreakdown.bizum.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">Tarjeta (TPV):</span>
              <span className="font-mono font-bold text-white">{kpis.paymentBreakdown.tarjeta.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">Efectivo:</span>
              <span className="font-mono font-bold text-white">{kpis.paymentBreakdown.efectivo.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-4 rounded-2xl bg-[#111118] border border-[#20202c] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#171722] border border-[#222232]">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'all' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todas ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('cobrada')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'cobrada' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              Cobradas
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pendiente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'pendiente' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              Pendientes
            </button>
          </div>

          {/* Payment Method Filter */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#171722] border border-[#242436] text-xs text-gray-200 focus:outline-none focus:border-gold-500"
          >
            <option value="all">Todos los pagos</option>
            <option value="bizum">Bizum</option>
            <option value="tarjeta">Tarjeta (TPV)</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[240px]">
            <IconSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, NIF o nº..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#161622] border border-[#272738] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            title="Descargar registro en archivo Excel CSV para gestoría"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191924] hover:bg-[#222232] text-gray-300 hover:text-white border border-[#2b2b3d] text-xs font-semibold transition-all cursor-pointer"
          >
            <IconDownload size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="rounded-2xl bg-[#111118] border border-[#20202c] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151520] border-b border-[#222234] text-gray-400 uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3.5 px-5 font-bold">Nº Factura / Ticket</th>
                <th className="py-3.5 px-4 font-bold">Fecha</th>
                <th className="py-3.5 px-4 font-bold">Clienta</th>
                <th className="py-3.5 px-4 font-bold">Concepto</th>
                <th className="py-3.5 px-4 font-bold">Método Pago</th>
                <th className="py-3.5 px-4 font-bold">Estado</th>
                <th className="py-3.5 px-4 font-bold text-right">Total</th>
                <th className="py-3.5 px-5 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2c]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <p className="text-sm font-semibold">No se encontraron facturas o recibos.</p>
                    <p className="text-xs text-gray-500 mt-1">Usa el botón "+ Emitir Factura" para crear la primera o generar tickets.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#151522]/60 transition-colors">
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
                    <td className="py-4 px-4 text-gray-300 max-w-[220px] truncate">
                      {inv.items?.[0]?.description || 'Servicios de estética'}
                      {inv.items && inv.items.length > 1 && (
                        <span className="text-[10px] text-gold-400 ml-1">+{inv.items.length - 1} más</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-[#1c1c2a] border border-[#2b2b3e] text-gray-300">
                        {inv.paymentMethod}
                      </span>
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPrint(inv)}
                          title="Imprimir o ver ticket para la clienta"
                          className="p-1.5 rounded-lg bg-[#1a1a28] hover:bg-[#252538] text-gold-400 hover:text-gold-300 border border-gold-500/30 transition-colors cursor-pointer"
                        >
                          <IconPrinter size={15} />
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Emitir Nueva Factura / Ticket */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#181824] via-[#12121a] to-[#0c0c12] border border-gold-500/40 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[#242436]">
              <h3 className="font-sans text-xl font-bold text-white flex items-center gap-2">
                <IconReceipt size={22} className="text-gold-400" />
                <span>Emitir Nueva Factura / Ticket</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#252536] transition-colors cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Nombre de la Clienta *</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName || ''}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Ej. Sofía Benítez"
                    className="w-full px-3 py-2 rounded-xl bg-[#161622] border border-[#2b2b3d] text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">DNI / NIF (Opcional)</label>
                  <input
                    type="text"
                    value={formData.clientNif || ''}
                    onChange={(e) => setFormData({ ...formData, clientNif: e.target.value })}
                    placeholder="48923412X"
                    className="w-full px-3 py-2 rounded-xl bg-[#161622] border border-[#2b2b3d] text-white focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Fecha de Emisión</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161622] border border-[#2b2b3d] text-white focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Método de Pago</label>
                  <select
                    value={formData.paymentMethod || 'bizum'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161622] border border-[#2b2b3d] text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="bizum">Bizum</option>
                    <option value="tarjeta">Tarjeta (TPV)</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              {/* Items / Concept */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#0f0f16] border border-[#222234]">
                <div className="font-semibold text-gray-300">Concepto del Tratamiento</div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formData.items?.[0]?.description || ''}
                    onChange={(e) => handleItemChange(0, 'description', e.target.value)}
                    placeholder="Descripción del servicio"
                    className="col-span-2 px-3 py-2 rounded-xl bg-[#161622] border border-[#28283a] text-white focus:outline-none focus:border-gold-500 text-xs"
                  />
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={formData.items?.[0]?.unitPrice ?? 35}
                      onChange={(e) => handleItemChange(0, 'unitPrice', e.target.value)}
                      className="w-full px-3 py-2 pr-6 rounded-xl bg-[#161622] border border-[#28283a] text-white focus:outline-none focus:border-gold-500 text-xs font-mono font-bold"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-[#202030]">
                  <span>Base Imponible: <strong className="text-gray-300 font-mono">{formData.subtotal?.toFixed(2)} €</strong></span>
                  <span>IVA (21%): <strong className="text-gray-300 font-mono">{formData.taxAmount?.toFixed(2)} €</strong></span>
                  <span className="text-sm font-bold text-gold-300">Total: {formData.total?.toFixed(2)} €</span>
                </div>
              </div>

              {/* Status & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Estado de Cobro</label>
                  <select
                    value={formData.status || 'cobrada'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161622] border border-[#2b2b3d] text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="cobrada">Cobrada</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="anulada">Anulada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Observaciones</label>
                  <input
                    type="text"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ej. Cobrado en estudio"
                    className="w-full px-3 py-2 rounded-xl bg-[#161622] border border-[#2b2b3d] text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222232]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1a1a26] text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-bold uppercase tracking-wider shadow-gold-glow transition-all cursor-pointer active:scale-95"
                >
                  Guardar y Emitir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ticket / Factura Imprimible (Apple-style receipt) */}
      {isPrintModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white text-gray-900 shadow-2xl p-6 sm:p-8 relative print:m-0 print:p-4 print:shadow-none">
            {/* Action Bar (hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 print:hidden mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recibo / Ticket de Compra</span>
              <div className="flex items-center gap-2">
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
                <span className="font-mono font-bold text-gray-900">{selectedInvoice.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha:</span>
                <span className="font-mono text-gray-900">{selectedInvoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Clienta:</span>
                <span className="font-bold text-gray-900">{selectedInvoice.clientName}</span>
              </div>
              {selectedInvoice.clientNif && (
                <div className="flex justify-between">
                  <span className="text-gray-500">NIF / CIF:</span>
                  <span className="font-mono text-gray-900">{selectedInvoice.clientNif}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Forma de Pago:</span>
                <span className="font-semibold text-gray-900 uppercase">{selectedInvoice.paymentMethod}</span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="py-3 border-b border-dashed border-gray-300 space-y-2 text-xs">
              <div className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">Tratamientos Realizados</div>
              {selectedInvoice.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-900 font-medium">{item.description}</span>
                    <span className="text-gray-400 text-[10px] block">Cant: {item.quantity} x {item.unitPrice.toFixed(2)} €</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">{item.total.toFixed(2)} €</span>
                </div>
              ))}
            </div>

            {/* Tax and Total */}
            <div className="py-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600 text-[11px]">
                <span>Base Imponible:</span>
                <span className="font-mono">{selectedInvoice.subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-600 text-[11px]">
                <span>IVA ({selectedInvoice.taxRate}%):</span>
                <span className="font-mono">{selectedInvoice.taxAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-900">
                <span>TOTAL:</span>
                <span className="font-mono">{selectedInvoice.total.toFixed(2)} €</span>
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

    </div>
  )
}
