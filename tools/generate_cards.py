import os
import base64
import subprocess
import sys

# Read the exact QR code uploaded by the user
qr_path = r'public/qr-instagram.png'
with open(qr_path, 'rb') as f:
    qr_b64 = base64.b64encode(f.read()).decode('utf-8')

# High-resolution 85x55 mm @ 600 DPI = 2008 x 1300 px
WIDTH = 2008
HEIGHT = 1300

# HTML template for FRONT (Anverso)
front_html = f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,500;1,600&display=swap');

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    width: {WIDTH}px;
    height: {HEIGHT}px;
    overflow: hidden;
    background: #FAF8F4;
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1F1914;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }}

  /* Fondo de papel algodón de lujo puro con degradado sedoso */
  .card-bg {{
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FAF8F4 50%, #F1ECE0 100%);
  }}

  .ambient-glow {{
    position: absolute;
    top: -100px;
    left: -100px;
    width: 900px;
    height: 900px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(230, 197, 110, 0.16) 0%, transparent 70%);
    pointer-events: none;
  }}

  .ambient-glow-qr {{
    position: absolute;
    bottom: -80px;
    right: -80px;
    width: 850px;
    height: 850px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(202, 158, 50, 0.14) 0%, transparent 70%);
    pointer-events: none;
  }}

  /* Marco exterior de oro metálico con doble filete de alta joyería */
  .gold-border-outer {{
    position: absolute;
    inset: 42px;
    border: 3.5px solid transparent;
    border-image: linear-gradient(135deg, #CA9E32 0%, #F7ECBF 25%, #A87D16 50%, #F5E8B8 75%, #8B650B 100%) 1;
    pointer-events: none;
  }}

  .gold-border-inner {{
    position: absolute;
    inset: 54px;
    border: 1.2px solid rgba(197, 155, 39, 0.45);
    pointer-events: none;
  }}

  .corner-accent {{
    position: absolute;
    width: 28px;
    height: 28px;
    border: 2.5px solid #C59B27;
    pointer-events: none;
  }}
  .corner-tl {{ top: 50px; left: 50px; border-right: none; border-bottom: none; }}
  .corner-tr {{ top: 50px; right: 50px; border-left: none; border-bottom: none; }}
  .corner-bl {{ bottom: 50px; left: 50px; border-right: none; border-top: none; }}
  .corner-br {{ bottom: 50px; right: 50px; border-left: none; border-top: none; }}

  .corner-dot {{
    position: absolute;
    width: 8px;
    height: 8px;
    background: #C59B27;
    transform: rotate(45deg);
    pointer-events: none;
  }}
  .dot-tl {{ top: 66px; left: 66px; }}
  .dot-tr {{ top: 66px; right: 66px; }}
  .dot-bl {{ bottom: 66px; left: 66px; }}
  .dot-br {{ bottom: 66px; right: 68px; }}

  /* Contenedor del contenido */
  .card-content {{
    position: relative;
    z-index: 10;
    width: 100%;
    height: 100%;
    padding: 85px 120px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}

  /* Columna izquierda: Marca y Datos de Contacto */
  .left-col {{
    flex: 1.25;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px 50px 20px 0;
  }}

  /* Marca Superior */
  .brand-top-block {{
    display: flex;
    flex-direction: column;
    gap: 14px;
  }}

  .brand-header {{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }}

  .lash-emblem {{
    width: 230px;
    height: 165px;
    filter: drop-shadow(0 8px 20px rgba(184, 142, 40, 0.45));
    margin-left: 2px;
  }}

  .brand-title {{
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 92px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #16120D;
    text-transform: uppercase;
    line-height: 1;
  }}

  .brand-title .gold-accent {{
    background: linear-gradient(135deg, #B5881E 0%, #E8C872 45%, #946C0D 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-style: italic;
    font-weight: 600;
    letter-spacing: 0.06em;
  }}

  .brand-tagline-pills {{
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 4px;
  }}

  .brand-subtitle {{
    font-size: 23px;
    font-weight: 700;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #8C7254;
  }}

  .brand-dots {{
    color: #C59B27;
    font-size: 18px;
  }}

  .brand-confidence {{
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #A27B1C;
  }}

  /* Divisor decorativo horizontal */
  .gold-divider {{
    width: 100%;
    height: 2.5px;
    background: linear-gradient(to right, #C59B27 0%, #F5E8BA 45%, rgba(197, 155, 39, 0.1) 100%);
    margin: 6px 0 10px;
  }}

  /* Lista de contactos ampliada y elegante */
  .contact-list {{
    display: flex;
    flex-direction: column;
    gap: 28px;
  }}

  .contact-item {{
    display: flex;
    align-items: center;
    gap: 28px;
  }}

  .contact-icon-box {{
    width: 76px;
    height: 76px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FFFFFF 0%, #F7EECD 100%);
    border: 2px solid #D4AF37;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 18px rgba(184, 142, 40, 0.22);
    flex-shrink: 0;
  }}

  .contact-icon-box svg {{
    width: 38px;
    height: 38px;
    color: #926A0C;
  }}

  .contact-sep {{
    font-size: 36px;
    color: #D4AF37;
    font-weight: 300;
    opacity: 0.75;
  }}

  .contact-content {{
    display: flex;
    flex-direction: column;
    gap: 3px;
  }}

  .contact-label {{
    font-size: 15px;
    font-weight: 600;
    color: #9A8068;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }}

  .contact-value {{
    font-size: 34px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #241B12;
    font-feature-settings: "tnum";
  }}

  /* Columna derecha: QR de Instagram Exacto del Usuario */
  .right-col {{
    flex: 0.92;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30px;
  }}

  /* El QR exacto con su propio marco dorado original */
  .qr-wrapper {{
    position: relative;
    width: 610px;
    height: 610px;
    border-radius: 50px;
    box-shadow: 0 28px 65px -10px rgba(148, 108, 13, 0.35), 0 0 0 1px rgba(212, 175, 55, 0.35);
    overflow: hidden;
    background: #FAF8F5;
  }}

  .qr-image {{
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }}

  /* Pie del QR con estética de marca */
  .qr-footer {{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }}

  .qr-banner-line {{
    display: flex;
    align-items: center;
    gap: 18px;
  }}

  .line-ornament {{
    width: 60px;
    height: 2px;
    background: linear-gradient(to right, transparent, #C59B27);
  }}
  .line-ornament.right {{
    background: linear-gradient(to left, transparent, #C59B27);
  }}

  .qr-badge-pill {{
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 34px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(202, 158, 50, 0.15) 0%, rgba(247, 236, 191, 0.38) 100%);
    border: 1.5px solid rgba(197, 155, 39, 0.55);
  }}

  .qr-badge-pill svg {{
    width: 28px;
    height: 28px;
    color: #926A0C;
  }}

  .qr-badge-pill span {{
    font-size: 19px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #7A5B0B;
  }}

  .qr-handle-text {{
    font-family: 'Outfit', sans-serif;
    font-size: 34px;
    font-weight: 700;
    color: #17120D;
    letter-spacing: 0.04em;
  }}
</style>
</head>
<body>
  <div class="card-bg"></div>
  <div class="ambient-glow"></div>
  <div class="ambient-glow-qr"></div>
  <div class="gold-border-outer"></div>
  <div class="gold-border-inner"></div>
  
  <div class="corner-accent corner-tl"></div>
  <div class="corner-accent corner-tr"></div>
  <div class="corner-accent corner-bl"></div>
  <div class="corner-accent corner-br"></div>

  <div class="corner-dot dot-tl"></div>
  <div class="corner-dot dot-tr"></div>
  <div class="corner-dot dot-bl"></div>
  <div class="corner-dot dot-br"></div>

  <div class="card-content">
    <!-- Columna Izquierda -->
    <div class="left-col">
      <div class="brand-top-block">
        <div class="brand-header">
          <svg class="lash-emblem" viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="goldGradLash" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#C59B27"/>
                <stop offset="35%" stop-color="#F7ECBF"/>
                <stop offset="70%" stop-color="#AA8018"/>
                <stop offset="100%" stop-color="#84600A"/>
              </linearGradient>
            </defs>
            <path d="M65 133C106 182 152 207 200 207C248 207 294 182 335 133" stroke="url(#goldGradLash)" stroke-width="15" stroke-linecap="round"/>
            <g stroke="url(#goldGradLash)" stroke-width="12" stroke-linecap="round">
              <path d="M82 151C71 156 61 166 53 181" />
              <path d="M105 171C95 181 87 194 83 208" />
              <path d="M134 189C125 203 120 218 118 230" />
              <path d="M166 202C161 217 159 233 160 246" />
              <path d="M200 207V253" />
              <path d="M234 202C239 217 241 233 240 246" />
              <path d="M266 189C275 203 280 218 282 230" />
              <path d="M295 171C305 181 313 194 317 208" />
              <path d="M318 151C329 156 339 166 347 181" />
            </g>
            <path d="M102 111C130 94 163 85 200 85C237 85 270 94 298 111" stroke="url(#goldGradLash)" stroke-width="5" stroke-linecap="round" opacity="0.6" />
            <path d="M311 60V88M297 74H325" stroke="url(#goldGradLash)" stroke-width="5.5" stroke-linecap="round"/>
            <path d="M77 81V97M69 89H85" stroke="url(#goldGradLash)" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
          </svg>

          <h1 class="brand-title">GOLDBLACK <span class="gold-accent">LASH</span></h1>
          
          <div class="brand-tagline-pills">
            <span class="brand-subtitle">Estudio de Pestañas</span>
            <span class="brand-dots">✦</span>
            <span class="brand-confidence">Beauty & Confidence</span>
          </div>
        </div>

        <div class="gold-divider"></div>
      </div>

      <!-- Lista de Contactos -->
      <div class="contact-list">
        <!-- Teléfono -->
        <div class="contact-item">
          <div class="contact-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <span class="contact-sep">|</span>
          <div class="contact-content">
            <span class="contact-label">Citas & Atención</span>
            <span class="contact-value">+34 604 18 76 76</span>
          </div>
        </div>

        <!-- Correo Oficial -->
        <div class="contact-item">
          <div class="contact-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <span class="contact-sep">|</span>
          <div class="contact-content">
            <span class="contact-label">Correo Oficial</span>
            <span class="contact-value">citas@goldblacklash.com</span>
          </div>
        </div>

        <!-- Sitio Web -->
        <div class="contact-item">
          <div class="contact-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
              <path d="M2 12h20"/>
            </svg>
          </div>
          <span class="contact-sep">|</span>
          <div class="contact-content">
            <span class="contact-label">Página Web</span>
            <span class="contact-value">www.goldblacklash.com</span>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="contact-item">
          <div class="contact-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span class="contact-sep">|</span>
          <div class="contact-content">
            <span class="contact-label">Ubicación</span>
            <span class="contact-value">Montequinto · Dos Hermanas (Sevilla)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Columna Derecha: QR EXACTO DEL USUARIO -->
    <div class="right-col">
      <div class="qr-wrapper">
        <img class="qr-image" src="data:image/png;base64,{qr_b64}" alt="QR Instagram Oficial GoldBlack Lash" />
      </div>

      <div class="qr-footer">
        <div class="qr-banner-line">
          <div class="line-ornament"></div>
          <div class="qr-badge-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
            <span>Síguenos en Instagram</span>
          </div>
          <div class="line-ornament right"></div>
        </div>
        <div class="qr-handle-text">@goldblack_lash</div>
      </div>
    </div>
  </div>
</body>
</html>'''

with open('card_front.html', 'w', encoding='utf-8') as f:
    f.write(front_html)

# HTML template for BACK (Reverso)
back_html = f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,500;1,600&display=swap');

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    width: {WIDTH}px;
    height: {HEIGHT}px;
    overflow: hidden;
    background: #FAF8F4;
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1F1914;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }}

  .card-bg {{
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 45%, #FFFFFF 0%, #FAF8F4 50%, #F1ECE0 100%);
  }}

  .center-glow {{
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1300px;
    height: 1300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(230, 197, 110, 0.18) 0%, transparent 65%);
    pointer-events: none;
  }}

  .gold-border-outer {{
    position: absolute;
    inset: 42px;
    border: 3.5px solid transparent;
    border-image: linear-gradient(135deg, #CA9E32 0%, #F7ECBF 25%, #A87D16 50%, #F5E8B8 75%, #8B650B 100%) 1;
    pointer-events: none;
  }}

  .gold-border-inner {{
    position: absolute;
    inset: 54px;
    border: 1.2px solid rgba(197, 155, 39, 0.45);
    pointer-events: none;
  }}

  .corner-accent {{
    position: absolute;
    width: 28px;
    height: 28px;
    border: 2.5px solid #C59B27;
    pointer-events: none;
  }}
  .corner-tl {{ top: 50px; left: 50px; border-right: none; border-bottom: none; }}
  .corner-tr {{ top: 50px; right: 50px; border-left: none; border-bottom: none; }}
  .corner-bl {{ bottom: 50px; left: 50px; border-right: none; border-top: none; }}
  .corner-br {{ bottom: 50px; right: 50px; border-left: none; border-top: none; }}

  .corner-dot {{
    position: absolute;
    width: 8px;
    height: 8px;
    background: #C59B27;
    transform: rotate(45deg);
    pointer-events: none;
  }}
  .dot-tl {{ top: 66px; left: 66px; }}
  .dot-tr {{ top: 66px; right: 66px; }}
  .dot-bl {{ bottom: 66px; left: 66px; }}
  .dot-br {{ bottom: 66px; right: 68px; }}

  .card-center {{
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
    max-width: 1600px;
    padding: 60px 40px;
  }}

  .lash-emblem-large {{
    width: 480px;
    height: 380px;
    filter: drop-shadow(0 14px 34px rgba(184, 142, 40, 0.42));
    margin-bottom: 8px;
  }}

  .brand-title-large {{
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 100px;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: #17120D;
    text-transform: uppercase;
    line-height: 1;
  }}

  .brand-title-large .gold-accent {{
    background: linear-gradient(135deg, #B5881E 0%, #E8C872 45%, #946C0D 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-style: italic;
    font-weight: 600;
    letter-spacing: 0.08em;
  }}

  .slogan {{
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 54px;
    font-style: italic;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: #926A0C;
    margin-top: 4px;
  }}

  .reverso-divider {{
    width: 520px;
    height: 2px;
    background: linear-gradient(to right, transparent, #C59B27 25%, #F7ECBF 50%, #C59B27 75%, transparent);
    margin: 14px 0 8px;
  }}

  .badge-studio {{
    display: inline-block;
    padding: 14px 50px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(202, 158, 50, 0.14) 0%, rgba(247, 236, 191, 0.3) 100%);
    border: 1.5px solid rgba(197, 155, 39, 0.5);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #7A5B0B;
  }}

  .footer-reverso {{
    margin-top: 14px;
    font-size: 22px;
    font-weight: 500;
    color: #8C7256;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }}
</style>
</head>
<body>
  <div class="card-bg"></div>
  <div class="center-glow"></div>
  <div class="gold-border-outer"></div>
  <div class="gold-border-inner"></div>

  <div class="corner-accent corner-tl"></div>
  <div class="corner-accent corner-tr"></div>
  <div class="corner-accent corner-bl"></div>
  <div class="corner-accent corner-br"></div>

  <div class="corner-dot dot-tl"></div>
  <div class="corner-dot dot-tr"></div>
  <div class="corner-dot dot-bl"></div>
  <div class="corner-dot dot-br"></div>

  <div class="card-center">
    <svg class="lash-emblem-large" viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGradLashRev" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#C59B27"/>
          <stop offset="35%" stop-color="#F7ECBF"/>
          <stop offset="70%" stop-color="#AA8018"/>
          <stop offset="100%" stop-color="#84600A"/>
        </linearGradient>
      </defs>
      <path d="M65 133C106 182 152 207 200 207C248 207 294 182 335 133" stroke="url(#goldGradLashRev)" stroke-width="15" stroke-linecap="round"/>
      <g stroke="url(#goldGradLashRev)" stroke-width="12" stroke-linecap="round">
        <path d="M82 151C71 156 61 166 53 181" />
        <path d="M105 171C95 181 87 194 83 208" />
        <path d="M134 189C125 203 120 218 118 230" />
        <path d="M166 202C161 217 159 233 160 246" />
        <path d="M200 207V253" />
        <path d="M234 202C239 217 241 233 240 246" />
        <path d="M266 189C275 203 280 218 282 230" />
        <path d="M295 171C305 181 313 194 317 208" />
        <path d="M318 151C329 156 339 166 347 181" />
      </g>
      <path d="M102 111C130 94 163 85 200 85C237 85 270 94 298 111" stroke="url(#goldGradLashRev)" stroke-width="5" stroke-linecap="round" opacity="0.6" />
      <path d="M311 60V88M297 74H325" stroke="url(#goldGradLashRev)" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M77 81V97M69 89H85" stroke="url(#goldGradLashRev)" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    </svg>

    <h2 class="brand-title-large">GOLDBLACK <span class="gold-accent">LASH</span></h2>
    <p class="slogan">“El arte de realzar tu mirada”</p>
    
    <div class="reverso-divider"></div>
    
    <div>
      <span class="badge-studio">Estudio de Autora · Montequinto, Sevilla</span>
    </div>

    <p class="footer-reverso">Citas exclusivas bajo reserva · www.goldblacklash.com</p>
  </div>
</body>
</html>'''

with open('card_back.html', 'w', encoding='utf-8') as f:
    f.write(back_html)

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_path):
    print('Chrome not found at', chrome_path)
    sys.exit(1)

front_abs = os.path.abspath('card_front.html')
back_abs = os.path.abspath('card_back.html')
anverso_png = os.path.abspath('public/tarjeta-anverso.png')
reverso_png = os.path.abspath('public/tarjeta-reverso.png')
anverso_jpg = os.path.abspath('public/tarjeta-anverso.jpg')
reverso_jpg = os.path.abspath('public/tarjeta-reverso.jpg')

print('Rendering Anverso with Chrome headless...')
subprocess.run([
    chrome_path,
    '--headless=new',
    '--disable-gpu',
    f'--screenshot={anverso_png}',
    f'--window-size={WIDTH},{HEIGHT}',
    '--hide-scrollbars',
    '--virtual-time-budget=2000',
    front_abs
], check=True)
print('Rendered Anverso PNG successfully')

print('Rendering Reverso with Chrome headless...')
subprocess.run([
    chrome_path,
    '--headless=new',
    '--disable-gpu',
    f'--screenshot={reverso_png}',
    f'--window-size={WIDTH},{HEIGHT}',
    '--hide-scrollbars',
    '--virtual-time-budget=2000',
    back_abs
], check=True)
print('Rendered Reverso PNG successfully')

# Also write JPG versions
try:
    from PIL import Image
    im_f = Image.open(anverso_png).convert('RGB')
    im_f.save(anverso_jpg, 'JPEG', quality=98)
    im_b = Image.open(reverso_png).convert('RGB')
    im_b.save(reverso_jpg, 'JPEG', quality=98)
    print('Generated ultra-high quality JPG versions')
except Exception as e:
    print('JPG conversion note:', e)
    import shutil
    shutil.copyfile(anverso_png, anverso_jpg)
    shutil.copyfile(reverso_png, reverso_jpg)

# Copy to artifacts directory so user can inspect in chat
artifact_dir = r'C:\Users\antonio\.gemini\antigravity-ide\brain\2f5fbd78-00d3-46f8-8a85-fa01cc55cc41'
if os.path.exists(artifact_dir):
    import shutil
    shutil.copyfile(anverso_jpg, os.path.join(artifact_dir, 'tarjeta_anverso_85x55mm.jpg'))
    shutil.copyfile(reverso_jpg, os.path.join(artifact_dir, 'tarjeta_reverso_85x55mm.jpg'))
    print('Copied card images to artifacts folder')

# Clean up temp HTML
for tmp in ['card_front.html', 'card_back.html']:
    if os.path.exists(tmp):
        os.remove(tmp)

print('Card generation finished successfully!')
