import { createFileRoute } from '@tanstack/react-router'

import { LashTryOn } from '#/components/LashTryOn'
import { PageHero } from '#/components/PageHero'
import { business, whatsappLink } from '#/data/site'

export const Route = createFileRoute('/probador')({
  component: Probador,
  head: () => ({
    meta: [
      {
        title: `Probador virtual de pestañas — ${business.name}`,
      },
      {
        name: 'description',
        content:
          'Pruébate los efectos de pestañas con tu cámara en tiempo real gracias a realidad aumentada. Elige entre clásicas, híbridas, volumen ruso y más.',
      },
    ],
  }),
})

function Probador() {
  return (
    <>
      <PageHero
        eyebrow="Espejo de realidad aumentada"
        title="Pruébate tu mirada antes de reservar."
        lead="Activa tu cámara y cambia entre nuestros efectos. Cuando encuentres tu favorito, resérvalo por WhatsApp."
        crumbs={[{ label: 'Probador virtual' }]}
      >
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <span className="rounded-full border border-white bg-white/80 px-4 py-2 text-[0.65rem] text-muted">
            100% en tu móvil · sin subir fotos
          </span>
          <span className="rounded-full border border-white bg-white/80 px-4 py-2 text-[0.65rem] text-muted">
            Pack gratuito DeepAR Beauty
          </span>
        </div>
      </PageHero>

      <div className="wrap section grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <LashTryOn />

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-line bg-white p-7 shadow-soft">
            <h2 className="font-display text-2xl">¿Cómo funciona?</h2>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-muted">
              <li>
                <strong className="text-ink">1.</strong> Pulsa «Probar con mi
                cámara» y permite el acceso.
              </li>
              <li>
                <strong className="text-ink">2.</strong> Elige efecto: Clásicas,
                Híbridas, Volumen ruso, Mega volumen…
              </li>
              <li>
                <strong className="text-ink">3.</strong> Mueve la cabeza y
                parpadea: el filtro sigue tu párpado.
              </li>
            </ol>
          </div>

          <div className="rounded-[2rem] bg-lilac/60 p-7">
            <h2 className="font-display text-2xl">¿Te gusta lo que ves?</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              El probador es una simulación. En estudio ajustamos curvatura,
              longitud y mapa a tu ojo real.
            </p>
            <a
              href={whatsappLink(
                '¡Hola! Me probé el efecto en el probador virtual y me gustaría reservar.',
              )}
              target="_blank"
              rel="noreferrer"
              className="button button-dark mt-5"
            >
              Reservar mi efecto ↗
            </a>
          </div>

          <div className="rounded-[2rem] border border-line bg-surface p-7 text-xs leading-6 text-muted">
            <h2 className="text-sm font-bold text-ink">
              Para desarrolladoras: pnpm, sin npm
            </h2>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-plum p-4 text-[0.7rem] leading-6 text-white">
{`# instalar (ya hecho en este proyecto)
pnpm add deepar @deepar/beauty

# auditar vulnerabilidades
pnpm audit
pnpm outdated

# key gratuita en .env (no commitear)
VITE_DEEPAR_LICENSE_KEY=tu_key_de_developer.deepar.ai`}
            </pre>
          </div>
        </aside>
      </div>
    </>
  )
}
