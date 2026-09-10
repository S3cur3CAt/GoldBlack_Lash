import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Probador AR de pestañas con DeepAR SDK + Beauty Plugin (Opción 1).
 *
 * Instalado con pnpm (no npm):
 *   pnpm add deepar @deepar/beauty
 *
 * La licencia gratuita se consigue en developer.deepar.ai -> New Project (FREE)
 * -> Web App -> copiar key a .env como VITE_DEEPAR_LICENSE_KEY.
 */

// Mapeo de servicios reales GoldBlack -> looks gratuitos de @deepar/beauty.
// Los templates se listan en runtime, estos son los nombres documentados.
const LASH_STYLES = [
  { id: 'subtle1', label: 'Clásicas', desc: 'Natural pelo a pelo', template: 'subtle1' },
  { id: 'normal2', label: 'Híbridas', desc: 'Textura suave', template: 'normal2' },
  { id: 'long', label: 'Efecto lifting', desc: 'Alarga y abre', template: 'long' },
  { id: 'dense', label: 'Volumen ruso', desc: 'Densidad media-alta', template: 'dense' },
  { id: 'kardashian', label: 'Mega volumen', desc: 'Máximo impacto', template: 'kardashian' },
  { id: 'subtle3', label: 'Lifting + tinte', desc: 'Curva delicada', template: 'subtle3' },
] as const

type Status = 'idle' | 'loading' | 'ready' | 'error'

const BEAUTY_ASSETS_URL =
  'https://cdn.jsdelivr.net/npm/@deepar/beauty@1.1.0-beta/dist/'

export function LashTryOn() {
  const previewRef = useRef<HTMLDivElement>(null)
  const deepARRef = useRef<any>(null)
  const beautyRef = useRef<any>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [activeStyle, setActiveStyle] = useState<string>(LASH_STYLES[3].template)
  const [smoothing, setSmoothing] = useState(true)

  const licenseKey = import.meta.env.VITE_DEEPAR_LICENSE_KEY as string | undefined

  const shutdown = useCallback(async () => {
    try {
      if (deepARRef.current?.shutdown) {
        await deepARRef.current.shutdown()
      }
    } catch {
      // ignorar errores al cerrar
    } finally {
      deepARRef.current = null
      beautyRef.current = null
      setStatus('idle')
    }
  }, [])

  useEffect(() => {
    return () => {
      void shutdown()
    }
  }, [shutdown])

  const applyStyle = useCallback((template: string, smooth: boolean) => {
    const beauty = beautyRef.current
    if (!beauty) return
    try {
      beauty.eyeMakeup.eyelashes.enable.set(true)
      // setTemplate acepta string o enum; usamos string para no acoplar tipos beta
      beauty.eyeMakeup.eyelashes.look.setTemplate(template)
      beauty.skinSmoothing.set(smooth ? 55 : 0)
    } catch (e) {
      console.warn('No se pudo aplicar el estilo', e)
    }
  }, [])

  const start = useCallback(async () => {
    if (!licenseKey) {
      setError(
        'Falta VITE_DEEPAR_LICENSE_KEY. Crea un proyecto FREE en developer.deepar.ai, añade una Web App con dominio localhost y pega la key en tu .env.',
      )
      setStatus('error')
      return
    }
    if (!previewRef.current) return
    setStatus('loading')
    setError(null)

    try {
      // Import dinámico: DeepAR solo funciona en navegador, nunca en SSR.
      const deepar = await import('deepar')
      const Beauty = await import('@deepar/beauty')

      await shutdown()

      const deepAR = await deepar.initialize({
        licenseKey,
        previewElement: previewRef.current,
        // Sin effect base: solo cámara + plugin de belleza (pack gratuito).
        // Si quieres un .deepar del Asset Store, pásalo aquí como `effect`.
      })

      const beauty = await Beauty.initializeBeauty(deepAR, BEAUTY_ASSETS_URL)

      deepARRef.current = deepAR
      beautyRef.current = beauty

      // Intentar listar templates reales (si la versión beta lo soporta),
      // si falla seguimos con la lista estática de arriba.
      try {
        const names = beauty.runtime?.getParameterTemplates?.(
          'eyeMakeup.eyelashes.look',
        )
        if (Array.isArray(names) && names.length > 0) {
          console.info('Eyelash templates disponibles:', names)
        }
      } catch {
        // no crítico
      }

      applyStyle(activeStyle, smoothing)
      setStatus('ready')
    } catch (e) {
      console.error(e)
      setStatus('error')
      setError(
        e instanceof Error
          ? `${e.name}: ${e.message}`
          : 'No se pudo iniciar la cámara AR. Revisa permisos HTTPS y la license key.',
      )
    }
  }, [licenseKey, activeStyle, smoothing, applyStyle, shutdown])

  const selectStyle = (template: string) => {
    setActiveStyle(template)
    applyStyle(template, smoothing)
  }

  const toggleSmoothing = () => {
    const next = !smoothing
    setSmoothing(next)
    applyStyle(activeStyle, next)
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-line bg-surface shadow-soft">
      <div className="relative bg-black">
        <div
          ref={previewRef}
          className="mx-auto aspect-[3/4] w-full max-w-md overflow-hidden sm:aspect-[4/5]"
          aria-label="Vista previa de cámara con realidad aumentada"
        />
        {status !== 'ready' ? (
          <div className="absolute inset-0 grid place-items-center bg-plum/85 p-8 text-center text-white">
            <div className="max-w-sm">
              <p className="text-4xl" aria-hidden="true">
                {status === 'loading' ? '✧' : '♡'}
              </p>
              <p className="mt-4 font-display text-2xl">
                {status === 'loading'
                  ? 'Activando tu espejo AR…'
                  : 'Pruébate tus pestañas en vivo'}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Permite el acceso a la cámara. Todo se procesa en tu móvil, no
                subimos tu vídeo a ningún servidor.
              </p>
              {!licenseKey ? (
                <p className="mt-4 rounded-2xl bg-white/10 p-4 text-left text-xs leading-6">
                  <strong>Falta la key gratuita:</strong> entra en{' '}
                  developer.deepar.ai → New Project (FREE) → Web App → dominio{' '}
                  <code>localhost</code> → copia la key a tu <code>.env</code>{' '}
                  como <code>VITE_DEEPAR_LICENSE_KEY=…</code> y reinicia{' '}
                  <code>pnpm dev</code>.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-6 sm:p-8">
        {error ? (
          <p
            role="alert"
            className="mb-5 rounded-2xl border border-rose/20 bg-blush px-4 py-3 text-sm leading-6"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {status === 'ready' ? (
            <button
              type="button"
              onClick={shutdown}
              className="button button-dark"
            >
              Detener cámara
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={status === 'loading'}
              className="button button-dark disabled:opacity-60"
            >
              {status === 'loading' ? 'Iniciando…' : 'Probar con mi cámara ↗'}
            </button>
          )}

          <button
            type="button"
            onClick={toggleSmoothing}
            aria-pressed={smoothing}
            className="button bg-white/70"
          >
            {smoothing ? 'Piel natural: on' : 'Piel natural: off'}
          </button>
        </div>

        <h2 className="mt-7 font-display text-2xl">Elige tu efecto</h2>
        <p className="mt-1 text-sm text-muted">
          Pack gratuito de DeepAR Beauty. Cada botón cambia el look de pestaña
          en tiempo real.
        </p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {LASH_STYLES.map((style) => {
            const active = style.template === activeStyle
            return (
              <li key={style.id}>
                <button
                  type="button"
                  onClick={() => selectStyle(style.template)}
                  aria-pressed={active}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? 'border-rose/30 bg-blush'
                      : 'border-line bg-white hover:border-rose/20'
                  }`}
                >
                  <span className="text-sm font-bold">{style.label}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {style.desc} · <code>{style.template}</code>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <p className="mt-6 text-xs leading-6 text-muted">
          Nota beta: el plugin Beauty en web muestra marca de agua y sesión de
          3 min en prueba. Para producción sin límites se pide build comercial
          a DeepAR. Tus estilos finales de GoldBlack se crean duplicando estas
          texturas en DeepAR Studio (gratis).
        </p>
      </div>
    </div>
  )
}
