import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { business } from '#/data/site'

export const Route = createFileRoute('/tarjeta')({
  component: BusinessCardPage,
  head: () => ({
    meta: [
      { title: `Tarjeta de Presentación Oficial (85x55 mm) — ${business.name}` },
      {
        name: 'description',
        content: `Tarjeta de presentación física de lujo para ${business.name} (85 x 55 mm) con diseño claro, elegante y código QR de Instagram.`,
      },
    ],
  }),
})

function BusinessCardPage() {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front')
  const [viewMode, setViewMode] = useState<'render' | 'vector'>('render')

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Estilos específicos para impresión profesional exacta en 85x55mm */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, nav, .no-print {
            display: none !important;
          }
          .print-area {
            display: block !important;
            page-break-after: always;
            width: 85mm !important;
            height: 55mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: 85mm 55mm;
            margin: 0;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="text-center space-y-2 no-print">
          <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-accent px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
            Diseño Oficial de Imprenta
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Tarjeta de Presentación — {business.name}
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Diseño claro, minimalista y de lujo editorial acorde a la web. Dimensión europea estándar de <strong>85 x 55 mm</strong> (8,5 x 5,5 cm).
          </p>
        </div>

        {/* Selector de Cara (Anverso / Reverso) y Modo */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-white/5 border border-white/10 no-print">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSide === 'front'
                  ? 'bg-accent text-black shadow-md shadow-accent/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Anverso (Datos + QR Instagram)
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSide === 'back'
                  ? 'bg-accent text-black shadow-md shadow-accent/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Reverso (Emblema + Lema)
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode('render')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'render'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🖼️ Acabado Imprenta (HD)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('vector')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'vector'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ⚡ Maqueta Interactiva
            </button>
          </div>
        </div>

        {/* Visor de la Tarjeta en proporción exacta 85x55 */}
        <div className="flex justify-center items-center py-4">
          <div
            className="w-full max-w-[620px] aspect-[85/55] relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(212,175,55,0.25)] border border-accent/40 bg-[#fafaf8] print-area transition-all duration-300"
          >
            {viewMode === 'render' ? (
              /* Vista Render Master de Imprenta */
              <div className="w-full h-full relative">
                <img
                  src={activeSide === 'front' ? '/tarjeta-anverso.jpg' : '/tarjeta-reverso.jpg'}
                  alt={`Tarjeta GoldBlack Lash — ${activeSide === 'front' ? 'Anverso' : 'Reverso'}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              /* Vista Maqueta Vectorial Interactiva */
              activeSide === 'front' ? (
                /* ANVERSO VECTORIAL */
                <div className="w-full h-full p-6 sm:p-8 flex flex-col justify-between text-[#2d2218] relative bg-[#fafaf8] border-8 border-transparent"
                  style={{
                    borderImage: 'linear-gradient(135deg, #d4af37, #f3e5ab, #aa8c2c) 1',
                  }}
                >
                  {/* Encabezado con Logo y Marca */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <svg width="28" height="20" viewBox="0 0 100 60" fill="none" className="text-[#b88e28]">
                        <path
                          d="M10 20 Q50 5 90 20 Q95 21 80 32 Q60 40 40 38 Q20 35 10 20 Z"
                          fill="currentColor"
                        />
                        <path d="M25 25 Q30 50 35 55" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M38 27 Q45 52 50 58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M52 28 Q60 50 67 56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M66 26 Q75 46 82 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      <div>
                        <h2 className="text-lg sm:text-xl font-serif font-bold tracking-wider text-[#1a1410] uppercase">
                          GoldBlack <span className="italic text-[#b88e28]">Lash</span>
                        </h2>
                      </div>
                    </div>
                    <p className="text-[9px] sm:text-[10px] tracking-widest text-[#7d6854] uppercase font-semibold pl-1">
                      {business.tagline}
                    </p>
                  </div>

                  {/* Cuerpo: Datos a la izquierda y QR a la derecha */}
                  <div className="flex items-end justify-between gap-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[#b88e28] text-sm">📞</span>
                        <a href={`tel:${business.phoneClean}`} className="font-semibold text-[#2d2218] hover:text-[#b88e28]">
                          {business.phoneDisplay}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#b88e28] text-sm">✉️</span>
                        <a href={`mailto:${business.email}`} className="font-semibold text-[#2d2218] hover:text-[#b88e28]">
                          {business.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#b88e28] text-sm">🌐</span>
                        <span className="font-semibold text-[#2d2218]">
                          www.goldblacklash.com
                        </span>
                      </div>
                    </div>

                    {/* QR Code idéntico al solicitado */}
                    <div className="shrink-0 text-center space-y-1">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 p-1 rounded-2xl bg-white border-2 border-[#d4af37] shadow-lg overflow-hidden">
                        <img
                          src="/qr-instagram.png"
                          alt="QR Instagram GoldBlack Lash"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="block text-[8px] font-bold text-[#8a7250] uppercase tracking-wider">
                        Síguenos en Instagram
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* REVERSO VECTORIAL */
                <div
                  className="w-full h-full p-8 flex flex-col items-center justify-center text-center text-[#2d2218] relative bg-[#fafaf8] border-8 border-transparent"
                  style={{
                    borderImage: 'linear-gradient(135deg, #d4af37, #f3e5ab, #aa8c2c) 1',
                  }}
                >
                  <svg width="60" height="40" viewBox="0 0 100 60" fill="none" className="text-[#b88e28] mb-2">
                    <path
                      d="M10 20 Q50 5 90 20 Q95 21 80 32 Q60 40 40 38 Q20 35 10 20 Z"
                      fill="currentColor"
                    />
                    <path d="M25 25 Q30 50 35 55" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M38 27 Q45 52 50 58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M52 28 Q60 50 67 56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M66 26 Q75 46 82 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-wider text-[#1a1410] uppercase">
                    GoldBlack <span className="italic text-[#b88e28]">Lash</span>
                  </h2>
                  <p className="text-sm font-serif italic text-[#b88e28] mt-1">
                    Enamórate de tu mirada
                  </p>

                  <div className="mt-6 pt-3 border-t border-[#d4af37]/30 text-xs text-[#6a5440] space-y-0.5">
                    <p className="font-medium">{business.city}</p>
                    <p className="font-bold text-[#b88e28]">{business.instagramHandle}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Botones de Descarga e Impresión */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 no-print">
          <div className="flex flex-col gap-1.5">
            <a
              href="/tarjeta-anverso.png"
              download="GoldBlack_Lash_Tarjeta_Anverso_85x55mm_Master.png"
              className="p-3.5 rounded-2xl bg-[#14141c] hover:bg-[#1a1a24] border border-accent/40 text-center transition-all flex flex-col items-center justify-center gap-1 group shadow-lg cursor-pointer"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">📥</span>
              <span className="text-xs font-bold text-white">Descargar Anverso (PNG Máster)</span>
              <span className="text-[10px] text-zinc-400">Cara con QR y Datos · Ultra-HD 600 DPI</span>
            </a>
            <a
              href="/tarjeta-anverso.jpg"
              download="GoldBlack_Lash_Tarjeta_Anverso_85x55mm.jpg"
              className="text-center text-[10px] text-zinc-400 hover:text-accent transition-colors py-1 cursor-pointer"
            >
              Descargar versión JPG (98% calidad) →
            </a>
          </div>

          <div className="flex flex-col gap-1.5">
            <a
              href="/tarjeta-reverso.png"
              download="GoldBlack_Lash_Tarjeta_Reverso_85x55mm_Master.png"
              className="p-3.5 rounded-2xl bg-[#14141c] hover:bg-[#1a1a24] border border-accent/40 text-center transition-all flex flex-col items-center justify-center gap-1 group shadow-lg cursor-pointer"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">📥</span>
              <span className="text-xs font-bold text-white">Descargar Reverso (PNG Máster)</span>
              <span className="text-[10px] text-zinc-400">Cara con Emblema y Lema · Ultra-HD 600 DPI</span>
            </a>
            <a
              href="/tarjeta-reverso.jpg"
              download="GoldBlack_Lash_Tarjeta_Reverso_85x55mm.jpg"
              className="text-center text-[10px] text-zinc-400 hover:text-accent transition-colors py-1 cursor-pointer"
            >
              Descargar versión JPG (98% calidad) →
            </a>
          </div>

          <div className="flex flex-col justify-start">
            <button
              type="button"
              onClick={handlePrint}
              className="p-3.5 h-[84px] rounded-2xl bg-linear-to-r from-accent to-[#aa8c2c] text-black font-bold text-center transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-accent/20 active:scale-95 cursor-pointer"
            >
              <span className="text-xl">🖨️</span>
              <span className="text-xs font-bold">Imprimir / Guardar PDF</span>
              <span className="text-[10px] text-black/80 font-medium">Escala 100% (85 x 55 mm)</span>
            </button>
          </div>
        </div>

        {/* Ficha Técnica para Imprenta */}
        <div className="p-5 rounded-3xl bg-[#121218] border border-white/10 space-y-3 text-left no-print">
          <h3 className="text-sm font-bold text-accent font-serif flex items-center gap-2">
            <span>📋</span> Especificaciones Técnicas para la Imprenta
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-zinc-400 block text-[10px] uppercase">Dimensiones de Corte</span>
              <span className="text-white font-bold font-mono">85 x 55 mm</span>
              <span className="text-zinc-500 block text-[9px]">Estándar europeo</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-zinc-400 block text-[10px] uppercase">Con Sangrado (+2mm)</span>
              <span className="text-white font-bold font-mono">89 x 59 mm</span>
              <span className="text-zinc-500 block text-[9px]">Margen de seguridad</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-zinc-400 block text-[10px] uppercase">Papel Recomendado</span>
              <span className="text-white font-bold">Algodón 350g – 400g</span>
              <span className="text-zinc-500 block text-[9px]">Blanco Marfil / Mate Seda</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-zinc-400 block text-[10px] uppercase">Acabado Recomendado</span>
              <span className="text-white font-bold text-accent">Hot Stamping Oro</span>
              <span className="text-zinc-500 block text-[9px]">Relieve o foil dorado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
