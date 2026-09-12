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
  phoneDisplay: '+34 604 18 76 76',
  phoneClean: '34604187676',
  siteUrl: 'https://goldblacklash.vercel.app',
  email: 'hola@goldblacklash.com',
  address: 'Calle Numa, Montequinto',
  city: 'Dos Hermanas (Sevilla)',
  postalCode: '41089',
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

export type Service = {
  id: string
  name: string
  badge?: string
  description: string
  duration: string
  price: string
  /** Se resalta en la tarjeta de precios. */
  featured?: boolean
  /** Foto opcional que se muestra en la tarjeta del servicio. */
  image?: string
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
        name: 'Volumen',
        badge: '3D, 4D, 5D y 6D',
        description:
          'Varias extensiones por pestaña natural. El resultado más natural y discreto, ideal para el día a día.',
        duration: '1 h 30 min',
        price: '27 €',
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
        price: '30 €',
        featured: true,
        includes: [
          'Abanicos hechos a mano',
          'Densidad media-alta',
          'Ideal para pestaña escasa',
        ],
      },
    ],
  },
  {
    id: 'extras',
    name: 'Tratamientos y extras',
    blurb: 'Servicios sueltos para cuidar tu pestaña natural o dar el paso a otro estilo.',
    services: [
      {
        id: 'retirada',
        name: 'Retirada de extensiones',
        description:
          'Retiramos tus extensiones con crema disolvente profesional, sin tirones ni daño a tu pestaña natural. Retirada 5 € si te las pusiste en GoldBlack y 10 € si vienen de otro centro.',
        duration: '30 min',
        price: '5–10 €',
        includes: ['Crema disolvente suave', 'Sin daño a la pestaña natural', 'Revisión incluida'],
      },
      {
        id: 'limpieza-facial',
        name: 'Limpieza facial profunda',
        description:
          'Una limpieza a fondo que deja la piel respirando: extrae los puntos negros y las impurezas, retira las células muertas e hidrata en profundidad. Sales con la piel limpia, suave y descansada desde la primera sesión.',
        duration: '1 h',
        price: '30 €',
        image: '/api/images/limpieza-facial',
        includes: ['Puntos negros e impurezas fuera', 'Hidratación profunda y luminosidad', 'Piel suave y descansada'],
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
    a: 'Duran de 3 semanas a 1 mes. La pestaña natural crece y se cae de forma continua, por eso el mantenimiento es la clave para que siempre se vea perfecto.',
  },
  {
    q: '¿Duele o molesta el procedimiento?',
    a: 'No. Es un servicio de ojos cerrados: se colocan parches de gel y muchas clientas se duermen durante la sesión. Si notas cualquier molestia, se retira y se ajusta en el momento.',
  },
  {
    q: '¿Qué pasa si tengo las pestañas muy cortas?',
    a: 'Se puede trabajar igual. Las longitudes se ajustan a lo que aguanta tu pestaña natural.',
  },
  {
    q: '¿Cómo cuido el set en casa?',
    a: 'Cepillado en seco por la mañana, limpieza suave con espuma específica 2 o 3 veces por semana, y evitar el vapor directo, el agua salada y el rímel. Te doy una guía de cuidados al salir del estudio.',
  },
] as const

export type GalleryPiece = {
  id: string
  title: string
  technique: string
  detail: string
  image: string
  /** Precio orientativo del diseño o servicio. */
  price?: string
  badge?: string
  featured?: boolean
  elements?: string[]
}

export const galleryPieces: Array<GalleryPiece> = [
  { id: 'pieza-04', title: 'Volumen 3D', technique: 'Volumen 3D', detail: 'Fibras Tecnológicas', image: '/api/images/pieza-04', price: '27 €' },
  { id: 'pieza-01', title: 'Volumen 4D', technique: 'Volumen 4D', detail: 'Fibras Tecnológicas', image: '/api/images/pieza-01', price: '27 €' },
  { id: 'pieza-02', title: 'Volumen 5D', technique: 'Volumen 5D', detail: 'Fibras Tecnológicas', image: '/api/images/pieza-02', price: '27 €' },
  { id: 'pieza-03', title: 'Volumen 6D', technique: 'Volumen 6D', detail: 'Fibras Tecnológicas', image: '/api/images/pieza-03', price: '27 €' },
  { id: 'pieza-05', title: 'Volumen ruso', technique: 'Volumen ruso', detail: 'Densidad y negro intenso', image: '/api/images/pieza-05', price: '30 €' },
]
