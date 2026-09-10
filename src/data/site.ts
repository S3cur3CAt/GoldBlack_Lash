/**
 * Datos del negocio y contenido del sitio.
 *
 * Este archivo es el único sitio que hay que tocar para actualizar textos,
 * precios y datos de contacto: las páginas leen todo desde aquí.
 * Los valores marcados con `TODO` son provisionales.
 */

export const business = {
  name: 'GoldBlack Lash',
  tagline: 'Estudio de extensiones de pestañas',
  claim: 'Belleza de autor, hecha a medida',
  // TODO: sustituir por el número real (formato internacional, sin + ni espacios).
  whatsapp: '34000000000',
  // TODO: sustituir por el teléfono real tal y como quieres que se muestre.
  phoneDisplay: '+34 000 000 000',
  email: 'hola@goldblacklash.com',
  address: 'Calle Numa, Montequinto',
  city: 'Dos Hermanas (Sevilla)',
  postalCode: '41089',
  // TODO: sustituir por la URL real del perfil.
  instagram: 'https://instagram.com/goldblack_lash',
  instagramHandle: '@goldblack_lash',
  // Ubicación real de la tienda (37.3415415, -5.9386880).
  mapsUrl: 'https://maps.app.goo.gl/pTmcZcRxHETf7QJq7?g_st=iw',
  mapsEmbed:
    'https://maps.google.com/maps?q=37.3415415,-5.9386880&z=17&output=embed',
  hours: [
    { days: 'Lunes a viernes', time: '10:00 – 20:00' },
    { days: 'Sábado', time: '10:00 – 15:00' },
    { days: 'Domingo', time: 'Cerrado' },
  ],
} as const

/** Enlace de WhatsApp con mensaje prerellenado para pedir cita. */
export function whatsappLink(
  message = '¡Hola! Me gustaría pedir cita en GoldBlack Lash 🖤✨',
) {
  return `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`
}

export type Service = {
  id: string
  name: string
  description: string
  duration: string
  price: string
  /** Se resalta en la tarjeta de precios. */
  featured?: boolean
  includes: Array<string>
}

export type ServiceCategory = {
  id: string
  name: string
  blurb: string
  services: Array<Service>
}

export const serviceCategories: Array<ServiceCategory> = [
  {
    id: 'extensiones',
    name: 'Extensiones de pestañas',
    blurb:
      'Técnicas pelo a pelo sobre tu pestaña natural. Elegimos juntas el efecto según la forma de tu ojo.',
    services: [
      {
        id: 'clasicas',
        name: 'Clásicas',
        description:
          'Una extensión por pestaña natural. El resultado más natural y discreto, ideal para el día a día.',
        duration: '1 h 30 min',
        price: '45 €',
        includes: [
          'Efecto natural pelo a pelo',
          'Diseño según la forma del ojo',
          'Sellado y baño de vitaminas',
        ],
      },
      {
        id: 'volumen-ruso',
        name: 'Volumen ruso',
        description:
          'Abanicos de 3 a 5 pestañas ultrafinas por pestaña natural. Densidad y negro intenso sin peso.',
        duration: '2 h',
        price: '60 €',
        featured: true,
        includes: [
          'Abanicos hechos a mano',
          'Densidad media-alta',
          'Ideal para pestaña escasa',
        ],
      },
      {
        id: 'volumen-mega',
        name: 'Mega volumen',
        description:
          'Abanicos de 6 a 10 pestañas. Máxima densidad y efecto wow para ocasiones especiales.',
        duration: '2 h 30 min',
        price: '75 €',
        includes: [
          'Máxima densidad',
          'Efecto alfombra o volumen extremo',
          'Relleno de 2 semanas incluido',
        ],
      },
      {
        id: 'hibridas',
        name: 'Híbridas',
        description:
          'Mezcla de clásicas y volumen en un mismo ojo. Lo mejor de los dos mundos, con textura y movimiento.',
        duration: '2 h',
        price: '55 €',
        includes: [
          'Textura desenfadada',
          'Punto de densidad a elección',
          'Acabado con brillo',
        ],
      },
      {
        id: 'efecto-lifting',
        name: 'Efecto lifting / L',
        description:
          'Longitudes escalonadas que abren la mirada y levantan la cola del ojo de forma visual.',
        duration: '2 h',
        price: '65 €',
        includes: [
          'Mapa de longitudes escalonado',
          'Apertura y elevación visual',
          'Perfecto para ojos caídos',
        ],
      },
    ],
  },
  {
    id: 'mantenimiento',
    name: 'Mantenimiento',
    blurb:
      'El relleno mantiene el diseño intacto. Recomendado cada 2 o 3 semanas según tu ciclo de crecimiento.',
    services: [
      {
        id: 'relleno-2-semanas',
        name: 'Relleno (hasta 3 semanas)',
        description:
          'Reposición de las pestañas crecidas o caídas para devolver el volumen original.',
        duration: '1 h',
        price: '35 €',
        includes: ['Reposición pelo a pelo', 'Limpieza profunda', 'Revisión del diseño'],
      },
      {
        id: 'relleno-4-semanas',
        name: 'Relleno (4 a 5 semanas)',
        description:
          'Para ciclos más largos o cuando ya se ha perdido bastante densidad.',
        duration: '1 h 30 min',
        price: '45 €',
        includes: ['Reposición completa', 'Retirada de pestañas crecidas', 'Reajuste del mapa'],
      },
    ],
  },
  {
    id: 'extras',
    name: 'Tratamientos y extras',
    blurb: 'Servicios sueltos para cuidar tu pestaña natural o dar el paso a otro estilo.',
    services: [
      {
        id: 'lifting',
        name: 'Lifting de pestañas',
        description:
          'Curvatura y elevación de tu propia pestaña con nutrición y tinte opcional. Sin extensiones.',
        duration: '1 h',
        price: '40 €',
        includes: ['Curvatura permanente', 'Nutrición con keratina', 'Tinte incluido'],
      },
      {
        id: 'tinte',
        name: 'Tinte y nutrición',
        description:
          'Color más profundo y tratamiento fortalecedor para pestañas naturales o poco pigmentadas.',
        duration: '40 min',
        price: '20 €',
        includes: ['Tinte hipoalergénico', 'Baño de keratina', 'Efecto de mirada descansada'],
      },
      {
        id: 'retirada',
        name: 'Retirada de extensiones',
        description:
          'Desmontaje con crema disolvente profesional, sin tirones ni daño a la pestaña natural.',
        duration: '30 min',
        price: '15 €',
        includes: ['Crema disolvente suave', 'Limpieza final', 'Diagnóstico de la pestaña'],
      },
    ],
  },
]

export const whyUs = [
  {
    title: 'Técnica y certificación',
    body: 'Formación continua en técnicas rusas y adhesivos de grado médico. Cada set se monta sobre pestaña sana.',
    icon: '✦',
  },
  {
    title: 'Diseño personalizado',
    body: 'Estudiamos la forma de tu ojo y tu día a día antes de elegir curvatura, longitud y grosor.',
    icon: '◈',
  },
  {
    title: 'Producto de primera',
    body: 'Extensiones de seda y adhesivos de baja emanación, aptos para piel sensible y ojos con lentes.',
    icon: '❖',
  },
  {
    title: 'Higiene impecable',
    body: 'Material estéril y desechable por clienta, herramientas desinfectadas entre cada servicio.',
    icon: '✧',
  },
] as const

export const faqs = [
  {
    q: '¿Cuánto duran las extensiones?',
    a: 'Con el relleno cada 2 o 3 semanas, el diseño se mantiene indefinidamente. La pestaña natural crece y se cae de forma continua, por eso el mantenimiento es la clave para que siempre se vea perfecto.',
  },
  {
    q: '¿Duele o molesta el procedimiento?',
    a: 'No. Es un servicio de ojos cerrados: se colocan parches de gel y muchas clientas se duermen durante la sesión. Si notas cualquier molestia, se retira y se ajusta en el momento.',
  },
  {
    q: '¿Puedo llevar maquillaje o usar máscara?',
    a: 'Maquillaje de ojos, sí, con cuidado. Máscara no: el aceite de la máscara degrada el adhesivo y acorta la vida del set. El tinte y el lifting ya dan el color y la curvatura que necesitas.',
  },
  {
    q: '¿Qué pasa si tengo las pestañas muy cortas?',
    a: 'Se puede trabajar igual. En esos casos el volumen ruso es la mejor opción porque aporta densidad sin cargar, y las longitudes se ajustan a lo que aguanta tu pestaña natural.',
  },
  {
    q: '¿Cómo cuido el set en casa?',
    a: 'Cepillado en seco por la mañana, limpieza suave con espuma específica 2 o 3 veces por semana, y evitar el vapor directo, el agua salada y el rímel. Te doy una guía de cuidados al salir del estudio.',
  },
] as const

/** Casos de estudio de la galería. Las imágenes se sirven desde Neon (`/api/images/*`). */
export type GalleryPiece = {
  id: string
  title: string
  technique: string
  detail: string
  image: string
}

export const galleryPieces: Array<GalleryPiece> = [
  { id: 'pieza-01', title: 'Efecto 4D', technique: 'Volumen 4D', detail: 'Abanicos 4D hechos a mano', image: '/api/images/pieza-01' },
  { id: 'pieza-02', title: 'Efecto 5D', technique: 'Volumen 5D', detail: 'Abanicos 5D hechos a mano', image: '/api/images/pieza-02' },
  { id: 'pieza-03', title: 'Efecto 6D', technique: 'Volumen 6D', detail: 'Abanicos 6D hechos a mano', image: '/api/images/pieza-03' },
  { id: 'pieza-04', title: 'Fibras tecnológicas', technique: 'Fibras tecnológicas 3D', detail: 'Efecto 3D de alta definición', image: '/api/images/pieza-04' },
  { id: 'pieza-05', title: 'Volumen ruso', technique: 'Volumen ruso', detail: 'Densidad y negro intenso', image: '/api/images/pieza-05' },
]
