import React, { createContext, useContext, useState, ReactNode } from 'react'
import {
  IconAlertTriangle,
  IconCheck,
  IconTrash,
  IconX,
  IconInfo,
} from '../components/Icons'

export interface AlertOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  confirmText?: string
}

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
}

interface DialogContextValue {
  showAlert: (options: AlertOptions | string) => void
  showConfirm: (options: ConfirmOptions) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

export const useDialog = (): DialogContextValue => {
  const ctx = useContext(DialogContext)
  if (!ctx) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return ctx
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertOptions | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null)

  const showAlert = (options: AlertOptions | string) => {
    if (typeof options === 'string') {
      setAlertState({ message: options, type: 'info' })
    } else {
      setAlertState(options)
    }
  }

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmState(options)
  }

  const closeAlert = () => setAlertState(null)
  const closeConfirm = () => setConfirmState(null)

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Luxury Alert Modal */}
      {alertState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md rounded-2xl bg-[#14141c] border border-gold-500/30 shadow-2xl p-6 relative">
            <button
              onClick={closeAlert}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#222230] transition-colors"
            >
              <IconX size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  alertState.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                    : alertState.type === 'error'
                    ? 'bg-red-950/60 border-red-500/40 text-red-400'
                    : alertState.type === 'warning'
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                    : 'bg-[#1e1e2c] border-gold-500/30 text-gold-400'
                }`}
              >
                {alertState.type === 'success' ? (
                  <IconCheck size={22} />
                ) : alertState.type === 'warning' ? (
                  <IconAlertTriangle size={22} />
                ) : alertState.type === 'error' ? (
                  <IconAlertTriangle size={22} />
                ) : (
                  <IconInfo size={22} />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h4 className="font-serif text-lg font-bold text-white tracking-wide">
                  {alertState.title || (alertState.type === 'error' ? 'Error' : alertState.type === 'warning' ? 'Atención' : 'Información')}
                </h4>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed whitespace-pre-line">
                  {alertState.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-5 mt-4 border-t border-[#222230]">
              <button
                type="button"
                autoFocus
                onClick={closeAlert}
                className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-gold-glow"
              >
                {alertState.confirmText || 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Luxury Confirm Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md rounded-2xl bg-[#14141c] border border-gold-500/30 shadow-2xl p-6 relative">
            <button
              onClick={closeConfirm}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#222230] transition-colors"
            >
              <IconX size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  confirmState.danger
                    ? 'bg-red-950/60 border-red-500/40 text-red-400'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                }`}
              >
                {confirmState.danger ? (
                  <IconTrash size={20} />
                ) : (
                  <IconAlertTriangle size={20} />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h4 className="font-serif text-lg font-bold text-white tracking-wide">
                  {confirmState.title}
                </h4>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed whitespace-pre-line">
                  {confirmState.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-[#222230]">
              <button
                type="button"
                onClick={closeConfirm}
                className="px-4 py-2.5 rounded-xl bg-[#20202e] hover:bg-[#28283a] text-gray-300 text-xs font-semibold transition-colors"
              >
                {confirmState.cancelText || 'Cancelar'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  const cb = confirmState.onConfirm
                  closeConfirm()
                  cb()
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm ${
                  confirmState.danger
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gold-500 hover:bg-gold-400 text-ink-950 shadow-gold-glow'
                }`}
              >
                {confirmState.confirmText || (confirmState.danger ? 'Eliminar' : 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}
