import os
import base64
import subprocess
import sys

# Read the exact QR code uploaded by the user
qr_path = r'public/qr-instagram.png'
with open(qr_path, 'rb') as f:
    qr_b64 = base64.b64encode(f.read()).decode('utf-8')

# Read the official transparent logo of the website
logo_path = r'public/goldblack_logo_transparent.png'
with open(logo_path, 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')

# High-resolution 85x55 mm @ 600 DPI = 2008 x 1300 px
WIDTH = 2008
HEIGHT = 1300

# HTML template for FRONT (Anverso) — Estilo Blanco y Rosa Oficial de la Web
front_html = f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600&family=Nunito:wght@400;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    width: {WIDTH}px;
    height: {HEIGHT}px;
    overflow: hidden;
    background: #FFF8FA;
    font-family: 'Outfit', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #46253A;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }}

  /* Fondo Blanco y Rosa Aurora — Idéntico a la web www.goldblacklash.com */
  .card-bg {{
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 25% 20%, rgba(236, 72, 153, 0.18) 0%, transparent 55%),
      radial-gradient(circle at 85% 80%, rgba(244, 114, 182, 0.2) 0%, transparent 55%),
      radial-gradient(circle at 50% 115%, rgba(251, 146, 60, 0.12) 0%, transparent 50%),
      radial-gradient(circle at 80% 15%, rgba(192, 132, 252, 0.14) 0%, transparent 45%),
      linear-gradient(145deg, #FFFFFF 0%, #FFF6F9 45%, #FDF0F6 75%, #FCE5F0 100%);
  }}

  /* Marco exterior con bisel en oro y rosa fucsia sutil */
  .rose-border-outer {{
    position: absolute;
    inset: 42px;
    border: 3.5px solid transparent;
    border-image: linear-gradient(135deg, #E9A81C 0%, #F472B6 28%, #EC4899 50%, #F472B6 72%, #E9A81C 100%) 1;
    pointer-events: none;
  }}

  .rose-border-inner {{
    position: absolute;
    inset: 54px;
    border: 1.2px solid rgba(236, 72, 153, 0.3);
    pointer-events: none;
  }}

  /* Adornos de esquina en oro rosa */
  .corner-accent {{
    position: absolute;
    width: 28px;
    height: 28px;
    border: 2.5px solid #F472B6;
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
    background: #EC4899;
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
    padding: 68px 105px 68px 105px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}

  /* Columna izquierda: Marca y Contacto */
  .left-col {{
    flex: 1.25;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0 45px 6px 0;
  }}

  /* Bloque Superior: Logo Oficial del Sitio Web + Título */
  .brand-top-block {{
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 0;
  }}

  .brand-header-row {{
    display: flex;
    align-items: center;
    gap: 24px;
  }}

  /* Emblema oficial del sitio web */
  .brand-logo-img {{
    width: 145px;
    height: 114px;
    object-fit: contain;
    filter: drop-shadow(0 6px 16px rgba(236, 72, 153, 0.3));
    flex-shrink: 0;
  }}

  .brand-title-wrap {{
    display: flex;
    flex-direction: column;
    gap: 4px;
  }}

  .brand-title {{
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 74px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #46253A;
    text-transform: uppercase;
    line-height: 1;
  }}

  .brand-title .rose-accent {{
    background: linear-gradient(135deg, #EC4899 0%, #FB7185 50%, #E9A81C 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-style: italic;
    font-weight: 600;
    letter-spacing: 0.05em;
  }}

  .brand-tagline-pills {{
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 4px;
  }}

  .brand-subtitle {{
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #9A7585;
  }}

  .brand-dots {{
    color: #EC4899;
    font-size: 16px;
  }}

  .brand-confidence {{
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #DB2777;
  }}

  /* Divisor decorativo rosa y oro */
  .rose-divider {{
    width: 100%;
    height: 2.5px;
    background: linear-gradient(to right, #EC4899 0%, #F472B6 35%, #E9A81C 70%, transparent 100%);
    margin-top: 6px;
  }}

  /* Lista de contactos en tono rosa y plum de la web */
  .contact-list {{
    display: flex;
    flex-direction: column;
    gap: 34px;
    margin: 12px 0;
  }}

  .contact-item {{
    display: flex;
    align-items: center;
    gap: 24px;
  }}

  .contact-icon-box {{
    width: 76px;
    height: 76px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FFFFFF 0%, #FDF2F8 60%, #FCE7F3 100%);
    border: 2px solid #F472B6;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px rgba(236, 72, 153, 0.2);
    flex-shrink: 0;
  }}

  .contact-icon-box svg {{
    width: 36px;
    height: 36px;
    color: #EC4899;
  }}

  .contact-sep {{
    font-size: 34px;
    color: #F472B6;
    font-weight: 300;
    opacity: 0.7;
  }}

  .contact-content {{
    display: flex;
    flex-direction: column;
    gap: 3px;
  }}

  .contact-label {{
    font-size: 15px;
    font-weight: 700;
    color: #9A7585;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }}

  .contact-value {{
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #381A2D;
    font-feature-settings: "tnum";
  }}

  /* Pastilla de distinción inferior */
  .brand-bottom-badge {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}

  .bottom-badge-pill {{
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 10px 28px;
    border-radius: 999px;
    background: linear-gradient(135deg, #FFFFFF 0%, #FDF2F8 60%, #FCE7F3 100%);
    border: 1.5px solid rgba(244, 114, 182, 0.6);
    box-shadow: 0 4px 14px rgba(236, 72, 153, 0.12);
  }}

  .bottom-badge-pill span {{
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #9A7585;
  }}

  .bottom-badge-pill .pill-star {{
    color: #EC4899;
    font-size: 14px;
  }}

  /* Columna derecha: QR EXACTO DE INSTAGRAM DEL USUARIO */
  .right-col {{
    flex: 0.92;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 26px;
  }}

  .qr-wrapper {{
    position: relative;
    width: 580px;
    height: 580px;
    border-radius: 48px;
    box-shadow: 0 26px 65px -10px rgba(236, 72, 153, 0.32), 0 0 0 2px rgba(244, 114, 182, 0.4);
    overflow: hidden;
    background: #FFFDFE;
  }}

  .qr-image {{
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }}

  /* Pie del QR estilo blanco y rosa */
  .qr-footer {{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }}

  .qr-banner-line {{
    display: flex;
    align-items: center;
    gap: 16px;
  }}

  .line-ornament {{
    width: 55px;
    height: 2px;
    background: linear-gradient(to right, transparent, #EC4899);
  }}
  .line-ornament.right {{
    background: linear-gradient(to left, transparent, #EC4899);
  }}

  .qr-badge-pill {{
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 32px;
    border-radius: 999px;
    background: linear-gradient(135deg, #FFFFFF 0%, #FDF2F8 60%, #FCE7F3 100%);
    border: 1.5px solid #F472B6;
    box-shadow: 0 4px 14px rgba(236, 72, 153, 0.18);
  }}

  .qr-badge-pill svg {{
    width: 24px;
    height: 24px;
    color: #EC4899;
  }}

  .qr-badge-pill span {{
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #DB2777;
  }}

  .qr-handle-text {{
    font-family: 'Outfit', sans-serif;
    font-size: 32px;
    font-weight: 800;
    color: #46253A;
    letter-spacing: 0.04em;
  }}
</style>
</head>
<body>
  <div class="card-bg"></div>
  <div class="rose-border-outer"></div>
  <div class="rose-border-inner"></div>
  
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
        <div class="brand-header-row">
          <img class="brand-logo-img" src="data:image/png;base64,{logo_b64}" alt="Logotipo Oficial GoldBlack Lash" />
          <div class="brand-title-wrap">
            <h1 class="brand-title">GOLDBLACK <span class="rose-accent">LASH</span></h1>
            <div class="brand-tagline-pills">
              <span class="brand-subtitle">Estudio de Pestañas</span>
              <span class="brand-dots">✦</span>
              <span class="brand-confidence">Beauty & Confidence</span>
            </div>
          </div>
        </div>
        <div class="rose-divider"></div>
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
            <span class="contact-value">+34 662 02 34 35</span>
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

      <!-- Pastilla de Distinción Inferior -->
      <div class="brand-bottom-badge">
        <div class="bottom-badge-pill">
          <span class="pill-star">✦</span>
          <span>Belleza de autor · Citas personalizadas</span>
          <span class="pill-star">✦</span>
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

# HTML template for BACK (Reverso) — Con el LOGOTIPO OFICIAL REAL DEL SITIO WEB
back_html = f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Nunito:wght@400;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    width: {WIDTH}px;
    height: {HEIGHT}px;
    overflow: hidden;
    background: #FFF8FA;
    font-family: 'Outfit', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #46253A;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }}

  /* Fondo Blanco y Rosa Aurora */
  .card-bg {{
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 246, 250, 0.7) 45%, rgba(253, 235, 243, 0.9) 100%),
      radial-gradient(circle at 50% 30%, rgba(236, 72, 153, 0.16) 0%, transparent 60%),
      radial-gradient(circle at 20% 80%, rgba(192, 132, 252, 0.14) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(251, 146, 60, 0.12) 0%, transparent 50%),
      linear-gradient(135deg, #FFFFFF 0%, #FFF5F9 50%, #FCE8F2 100%);
  }}

  .rose-border-outer {{
    position: absolute;
    inset: 42px;
    border: 3.5px solid transparent;
    border-image: linear-gradient(135deg, #E9A81C 0%, #F472B6 28%, #EC4899 50%, #F472B6 72%, #E9A81C 100%) 1;
    pointer-events: none;
  }}

  .rose-border-inner {{
    position: absolute;
    inset: 54px;
    border: 1.2px solid rgba(236, 72, 153, 0.3);
    pointer-events: none;
  }}

  .corner-accent {{
    position: absolute;
    width: 28px;
    height: 28px;
    border: 2.5px solid #F472B6;
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
    background: #EC4899;
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
    gap: 18px;
    max-width: 1600px;
    padding: 60px 40px;
  }}

  /* Contenedor joya para el logotipo oficial del sitio web */
  .logo-official-box {{
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
  }}

  .logo-official-halo {{
    position: absolute;
    width: 600px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.22) 0%, rgba(233, 168, 28, 0.12) 45%, transparent 70%);
    filter: blur(20px);
    pointer-events: none;
  }}

  .logo-official-img {{
    position: relative;
    width: 580px;
    height: 450px;
    object-fit: contain;
    filter: drop-shadow(0 16px 36px rgba(70, 37, 58, 0.28));
  }}

  .lash-subname {{
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 58px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #46253A;
    margin-top: -10px;
  }}

  .lash-subname .rose-italic {{
    background: linear-gradient(135deg, #EC4899 0%, #FB7185 50%, #E9A81C 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-style: italic;
    font-weight: 600;
  }}

  .slogan {{
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 46px;
    font-style: italic;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: #9A7585;
  }}

  .reverso-divider {{
    width: 480px;
    height: 2px;
    background: linear-gradient(to right, transparent, #EC4899 30%, #E9A81C 50%, #EC4899 70%, transparent);
    margin: 6px 0;
  }}

  .badge-studio {{
    display: inline-block;
    padding: 12px 44px;
    border-radius: 999px;
    background: linear-gradient(135deg, #FFFFFF 0%, #FDF2F8 60%, #FCE7F3 100%);
    border: 1.5px solid #F472B6;
    box-shadow: 0 4px 16px rgba(236, 72, 153, 0.18);
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #DB2777;
  }}

  .footer-reverso {{
    margin-top: 10px;
    font-size: 20px;
    font-weight: 600;
    color: #9A7585;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }}
</style>
</head>
<body>
  <div class="card-bg"></div>
  <div class="rose-border-outer"></div>
  <div class="rose-border-inner"></div>

  <div class="corner-accent corner-tl"></div>
  <div class="corner-accent corner-tr"></div>
  <div class="corner-accent corner-bl"></div>
  <div class="corner-accent corner-br"></div>

  <div class="corner-dot dot-tl"></div>
  <div class="corner-dot dot-tr"></div>
  <div class="corner-dot dot-bl"></div>
  <div class="corner-dot dot-br"></div>

  <div class="card-center">
    <!-- Logotipo Oficial Real del Sitio Web -->
    <div class="logo-official-box">
      <div class="logo-official-halo"></div>
      <img class="logo-official-img" src="data:image/png;base64,{logo_b64}" alt="Logotipo Oficial GoldBlack Lash" />
    </div>

    <div class="lash-subname">
      <span class="rose-italic">Lash Studio</span>
    </div>

    <p class="slogan">“Un pequeño momento para ti · Una nueva forma de mirar”</p>
    
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

print('Rendering Anverso with Chrome headless (Blanco y Rosa)...')
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

print('Rendering Reverso with Chrome headless (Logotipo Oficial)...')
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

print('White & Pink Card generation finished successfully!')
