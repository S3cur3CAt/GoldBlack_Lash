# GoldBlack Lash — sitio web

Sitio del estudio de extensiones de pestañas **GoldBlack Lash**. Construido con
[TanStack Start](https://tanstack.com/start) (React 19 + Vite) y
[Tailwind CSS v4](https://tailwindcss.com/), con estética negro y dorado.

## Arrancar

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Otros comandos:

```bash
pnpm build      # build de producción (cliente + servidor)
pnpm preview    # sirve el build
pnpm generate-routes   # regenera src/routeTree.gen.ts si tocas rutas a mano
```

## Pestañas del sitio

Cada pestaña es una ruta real con su propia URL, título y meta descripción, para
que se pueda compartir y posicionar en buscadores.

| Pestaña   | Ruta         | Archivo                  |
| --------- | ------------ | ------------------------ |
| Inicio    | `/`          | `src/routes/index.tsx`   |
| Servicios | `/servicios` | `src/routes/servicios.tsx` |
| Galería   | `/galeria`   | `src/routes/galeria.tsx` |
| Sobre mí  | `/sobre-mi`  | `src/routes/sobre-mi.tsx` |
| Contacto  | `/contacto`  | `src/routes/contacto.tsx` |

### Sub-pestañas

Además del menú principal hay dos juegos de sub-pestañas dentro de las páginas:

- **Servicios** — filtros por categoría (Extensiones / Mantenimiento / Extras).
  Actualizan la URL con `?categoria=<id>` y siguen el scroll con un
  `IntersectionObserver`, así que el enlace se puede compartir.
- **Galería** — filtros por técnica (Clásicas, Volumen ruso, Mega volumen,
  Híbridas, Lifting). Son estado local, sin ensuciar la URL.

El orden de las pestañas del menú se define una sola vez en `tabs`
(`src/components/Chrome.tsx`) y lo consumen tanto la cabecera como el pie.

## Dónde editar el contenido

**Todo el texto vive en `src/data/site.ts`.** No hace falta tocar componentes
para cambiar precios, servicios, horarios o datos de contacto:

- `business` — nombre, teléfono, WhatsApp, email, dirección, Instagram y horario.
- `serviceCategories` — servicios agrupados por categoría, con precio, duración,
  descripción e inclusiones. La marca `featured: true` resalta una tarjeta.
- `whyUs`, `faqs`, `galleryPieces` — bloques de ventajas, preguntas frecuentes y
  fichas de la galería.

> Los valores marcados `TODO` en ese archivo son **provisionales**: el número de
> WhatsApp, el teléfono, el email y la dirección son de ejemplo. Sustitúyelos
> antes de publicar.

### Botón de WhatsApp

Todos los CTA de reserva usan `whatsappLink(mensaje)`, que abre `wa.me` con el
texto ya escrito. Cada tarjeta de servicio manda su propio mensaje con el nombre
y el precio ya incluidos.

## Galería: cómo añadir tus fotos

Las fichas de `galleryPieces` se renderizan como plantillas con el logotipo de
fondo. Para poner fotos reales:

1. Crea `public/galeria/` y guarda las imágenes como `<id>.jpg`
   (por ejemplo `public/galeria/pieza-01.jpg`).
2. En `src/routes/galeria.tsx`, dentro de `GalleryTile`, sustituye el bloque del
   marcador de posición por:

   ```tsx
   <img src={`/galeria/${id}.jpg`} alt={title} className="aspect-[4/5] w-full object-cover" />
   ```

3. Pasa `id` como prop desde `Galeria` (ya está disponible en cada `piece`).

Recomendado: 1000 × 1250 px (4:5), JPG por debajo de 200 KB.

## Estructura

```
src/
├── components/
│   ├── Chrome.tsx      # cabecera con pestañas, menú móvil y pie
│   └── PageHero.tsx    # cabecera de página interior + separador de rombo
├── data/site.ts        # todo el contenido y los datos del negocio
├── routes/             # una pestaña por archivo (file-based routing)
├── router.tsx
└── styles.css          # tema de Tailwind: paleta dorada, tipografías, utilidades
```

### Sistema de diseño

En `src/styles.css`, bajo `@theme`, están los tokens de Tailwind v4:

- Colores: `ink`, `coal`, `graphite`, `slate`, `gold-50…700`, `cream`, `muted`.
- Tipografías: `font-display` (Cormorant Garamond, serif) y `font-body` (Jost).
- Utilidades propias: `text-gold-gradient`, `border-gold-gradient`,
  `ring-gold-glow` y `rule-gold`.

## Formulario de contacto

El formulario de `/contacto` no tiene backend: valida nombre y teléfono en el
cliente y compone el mensaje que abre en WhatsApp. No se guarda ningún dato.
Si más adelante quieres recibir las solicitudes por email, se sustituye
`handleSubmit` en `src/routes/contacto.tsx` por una server function de TanStack
Start (`createServerFn`).
