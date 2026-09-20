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
          <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-[#ec4899] px-3.5 py-1 rounded-full bg-[#ec4899]/10 border border-[#ec4899]/30">
            Diseño Oficial Blanco y Rosa · Proyecto Web
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Tarjeta de Presentación — {business.name}
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Edición exclusiva con la estética del sitio web (blanco, rosa y ciruela) y el logotipo oficial. Dimensión europea estándar de <strong>85 x 55 mm</strong> (8,5 x 5,5 cm).
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
                  ? 'bg-gradient-to-r from-[#ec4899] to-[#db2777] text-white shadow-md shadow-[#ec4899]/25'
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
                  ? 'bg-gradient-to-r from-[#ec4899] to-[#db2777] text-white shadow-md shadow-[#ec4899]/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Reverso (Logotipo Oficial + Lema)
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
            className="w-full max-w-[640px] aspect-[85/55] relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(236,72,153,0.35)] border border-[#f472b6]/40 bg-[#FFF8FA] print-area transition-all duration-300"
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
                <div
                  className="w-full h-full p-5 sm:p-7 flex justify-between items-center text-[#46253A] relative bg-gradient-to-br from-[#FFFFFF] via-[#FFF6F9] to-[#FCE5F0] border-4 sm:border-[6px] border-transparent"
                  style={{
                    borderImage: 'linear-gradient(135deg, #E9A81C 0%, #F472B6 28%, #EC4899 50%, #F472B6 72%, #E9A81C 100%) 1',
                  }}
                >
                  {/* Columna izquierda: Marca y Contacto */}
                  <div className="flex-1 h-full flex flex-col justify-between py-1 pr-3">
                    {/* Encabezado con Logotipo Oficial del Sitio Web (En la parte superior) */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/goldblack_logo_transparent.png"
                          alt="Logotipo Oficial GoldBlack Lash"
                          className="w-10 h-8 sm:w-12 sm:h-9 object-contain drop-shadow-sm shrink-0"
                        />
                        <div>
                          <h2 className="text-base sm:text-lg font-serif font-bold tracking-wider text-[#46253A] uppercase leading-tight">
                            GoldBlack <span className="italic bg-gradient-to-r from-[#EC4899] to-[#E9A81C] bg-clip-text text-transparent">Lash</span>
                          </h2>
                        </div>
                      </div>
                      <p className="text-[8px] sm:text-[9px] tracking-widest text-[#9A7585] uppercase font-bold pl-0.5">
                        Estudio de Pestañas <span className="text-[#EC4899]">✦</span> Beauty & Confidence
                      </p>
                      <div className="w-full h-[1.5px] bg-gradient-to-r from-[#EC4899] via-[#F472B6] to-transparent" />
                    </div>

                    {/* Lista de Contacto (3 ítems: Teléfono, Email, Ubicación) */}
                    <div className="flex-1 flex flex-col justify-center space-y-2.5 sm:space-y-3.5 my-auto text-[10px] sm:text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-[#F472B6] flex items-center justify-center text-[#EC4899] text-[9px] sm:text-[10px] shadow-xs shrink-0">
                          📞
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[7px] uppercase font-bold text-[#9A7585] tracking-wider">Citas & Atención</span>
                          <a href={`tel:${business.phoneClean}`} className="font-bold text-[#381A2D] hover:text-[#EC4899]">
                            {business.phoneDisplay}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-[#F472B6] flex items-center justify-center text-[#EC4899] text-[9px] sm:text-[10px] shadow-xs shrink-0">
                          ✉️
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[7px] uppercase font-bold text-[#9A7585] tracking-wider">Correo Oficial</span>
                          <a href={`mailto:${business.email}`} className="font-bold text-[#381A2D] hover:text-[#EC4899]">
                            {business.email}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-[#F472B6] flex items-center justify-center text-[#EC4899] text-[9px] sm:text-[10px] shadow-xs shrink-0">
                          📍
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[7px] uppercase font-bold text-[#9A7585] tracking-wider">Ubicación</span>
                          <span className="font-bold text-[#381A2D]">
                            Montequinto · Dos Hermanas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna derecha: QR EXACTO DE INSTAGRAM */}
                  <div className="shrink-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 p-1 rounded-2xl sm:rounded-3xl bg-white border-2 border-[#F472B6] shadow-[0_10px_25px_-5px_rgba(236,72,153,0.3)] overflow-hidden">
                      <img
                        src="/qr-instagram.png"
                        alt="QR Instagram Oficial GoldBlack Lash"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="px-2 py-0.5 rounded-full bg-white/90 border border-[#F472B6] text-[7px] sm:text-[8px] font-extrabold text-[#DB2777] uppercase tracking-wider shadow-xs">
                        Síguenos en Instagram
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-extrabold text-[#46253A] tracking-wider mt-0.5">
                        @goldblack_lash
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* REVERSO VECTORIAL — Con el LOGOTIPO OFICIAL DEL SITIO WEB */
                <div
                  className="w-full h-full p-6 sm:p-8 flex flex-col items-center justify-center text-center text-[#46253A] relative bg-gradient-to-br from-[#FFFFFF] via-[#FFF5F9] to-[#FCE8F2] border-4 sm:border-[6px] border-transparent"
                  style={{
                    borderImage: 'linear-gradient(135deg, #E9A81C 0%, #F472B6 28%, #EC4899 50%, #F472B6 72%, #E9A81C 100%) 1',
                  }}
                >
                  {/* Halo sutil y Logotipo Oficial Real */}
                  <div className="relative flex items-center justify-center mb-1">
                    <div className="absolute w-36 h-28 sm:w-48 sm:h-36 rounded-full bg-radial from-[#ec4899]/20 to-transparent blur-md pointer-events-none" />
                    <img
                      src="/goldblack_logo_transparent.png"
                      alt="Logotipo Oficial Real GoldBlack Lash"
                      className="relative w-36 h-24 sm:w-48 sm:h-32 object-contain drop-shadow-md"
                    />
                  </div>

                  <h2 className="text-sm sm:text-base font-serif font-bold tracking-widest uppercase mt-0.5">
                    <span className="italic bg-gradient-to-r from-[#EC4899] via-[#FB7185] to-[#E9A81C] bg-clip-text text-transparent">Lash Studio</span>
                  </h2>

                  <p className="text-xs sm:text-sm font-serif italic text-[#9A7585] mt-1 max-w-[85%]">
                    “Un pequeño momento para ti · Una nueva forma de mirar”
                  </p>

                  <div className="w-40 sm:w-56 h-[1.5px] bg-gradient-to-r from-transparent via-[#EC4899] to-transparent my-2" />

                  <span className="px-3 sm:px-4 py-1 rounded-full bg-white/90 border border-[#F472B6] text-[8px] sm:text-[9px] font-extrabold text-[#DB2777] uppercase tracking-widest shadow-xs">
                    Dos Hermanas · Montequinto, Sevilla
                  </span>

                  <p className="text-[8px] sm:text-[9px] font-semibold text-[#9A7585] uppercase tracking-wider mt-1.5">
                    Citas exclusivas bajo reserva
                  </p>
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
              className="p-3.5 rounded-2xl bg-[#14141c] hover:bg-[#1a1a24] border border-[#f472b6]/40 text-center transition-all flex flex-col items-center justify-center gap-1 group shadow-lg cursor-pointer"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">📥</span>
              <span className="text-xs font-bold text-white">Descargar Anverso (PNG Máster)</span>
              <span className="text-[10px] text-zinc-400">Blanco y Rosa con QR y Datos · 600 DPI</span>
            </a>
            <a
              href="/tarjeta-anverso.jpg"
              download="GoldBlack_Lash_Tarjeta_Anverso_85x55mm.jpg"
              className="text-center text-[10px] text-zinc-400 hover:text-[#ec4899] transition-colors py-1 cursor-pointer"
            >
              Descargar versión JPG (98% calidad) →
            </a>
          </div>

          <div className="flex flex-col gap-1.5">
            <a
              href="/tarjeta-reverso.png"
              download="GoldBlack_Lash_Tarjeta_Reverso_85x55mm_Master.png"
              className="p-3.5 rounded-2xl bg-[#14141c] hover:bg-[#1a1a24] border border-[#f472b6]/40 text-center transition-all flex flex-col items-center justify-center gap-1 group shadow-lg cursor-pointer"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">📥</span>
              <span className="text-xs font-bold text-white">Descargar Reverso (PNG Máster)</span>
              <span className="text-[10px] text-zinc-400">Logotipo Oficial del Sitio Web · 600 DPI</span>
            </a>
            <a
              href="/tarjeta-reverso.jpg"
              download="GoldBlack_Lash_Tarjeta_Reverso_85x55mm.jpg"
              className="text-center text-[10px] text-zinc-400 hover:text-[#ec4899] transition-colors py-1 cursor-pointer"
            >
              Descargar versión JPG (98% calidad) →
            </a>
          </div>

          <div className="flex flex-col justify-start">
            <button
              type="button"
              onClick={handlePrint}
              className="p-3.5 h-[84px] rounded-2xl bg-gradient-to-r from-[#ec4899] via-[#fb7185] to-[#e9a81c] text-white font-bold text-center transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-[#ec4899]/25 active:scale-95 cursor-pointer"
            >
              <span className="text-xl">🖨️</span>
              <span className="text-xs font-bold">Imprimir / Guardar PDF</span>
              <span className="text-[10px] text-white/90 font-medium">Escala 100% (85 x 55 mm)</span>
            </button>
          </div>
        </div>

        {/* Ficha Técnica para Imprenta */}
        <div className="p-5 rounded-3xl bg-[#121218] border border-white/10 space-y-3 text-left no-print">
          <h3 className="text-sm font-bold text-[#ec4899] font-serif flex items-center gap-2">
            <span>📋</span> Especificaciones Técnicas de Imprenta
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
              <span className="text-white font-bold">Seda Mate 350g – 400g</span>
              <span className="text-zinc-500 block text-[9px]">Tacto sedoso premium</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-zinc-400 block text-[10px] uppercase">Acabado Recomendado</span>
              <span className="text-white font-bold text-[#ec4899]">Soft Touch + UVI Brillo</span>
              <span className="text-zinc-500 block text-[9px]">Relieve en logo y QR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
