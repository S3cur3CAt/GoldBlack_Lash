export type SeasonalEffectType =
  | 'none'
  | 'auto'
  | 'snow'
  | 'sakura'
  | 'leaves'
  | 'rose_petals'
  | 'new_year'
  | 'halloween'

export type ConcreteSeasonalEffect = Exclude<SeasonalEffectType, 'auto'>

export interface SeasonalScheduleItem {
  effect: ConcreteSeasonalEffect
  name: string
  icon: string
  period: string
  description: string
}

export const SEASONAL_SCHEDULE: SeasonalScheduleItem[] = [
  {
    effect: 'halloween',
    name: 'Halloween & Noche de Brujas',
    icon: '🎃',
    period: '20 de octubre — 2 de noviembre',
    description: 'Murciélagos 3D, niebla mística y calabazas talladas en las tarjetas.',
  },
  {
    effect: 'new_year',
    name: 'Fin de Año & Fuegos Artificiales',
    icon: '🎆',
    period: '28 de diciembre — 2 de enero',
    description: 'Espectáculo de fuegos artificiales realistas y destellos de celebración.',
  },
  {
    effect: 'snow',
    name: 'Navidad & Invierno',
    icon: '❄️',
    period: '1 de diciembre — 6 de enero',
    description: 'Nieve suave, gorro de Papá Noel en tarjetas y ambiente navideño.',
  },
  {
    effect: 'rose_petals',
    name: 'San Valentín & Romance',
    icon: '🌹',
    period: '7 de febrero — 16 de febrero',
    description: 'Pétalos de rosa roja aterciopelada y detalles románticos.',
  },
  {
    effect: 'sakura',
    name: 'Primavera & Sakura',
    icon: '🌸',
    period: '20 de marzo — 31 de mayo',
    description: 'Pétalos de cerezo flotando con la brisa primaveral.',
  },
  {
    effect: 'leaves',
    name: 'Otoño Dorado',
    icon: '🍂',
    period: '15 de septiembre — 19 de octubre / 3 — 30 de noviembre',
    description: 'Hojas de arce en ámbar y oro con balanceo pendular.',
  },
]

export function resolveSeasonalEffect(
  effect?: SeasonalEffectType,
  currentDate: Date = new Date(),
): ConcreteSeasonalEffect {
  if (!effect || effect === 'none') {
    return 'none'
  }

  if (effect !== 'auto') {
    return effect
  }

  const month = currentDate.getMonth() + 1
  const day = currentDate.getDate()

  // 1. Fin de Año & Nochevieja: 28 de Diciembre al 2 de Enero
  if ((month === 12 && day >= 28) || (month === 1 && day <= 2)) {
    return 'new_year'
  }

  // 2. Navidad & Reyes: 1 de Diciembre al 6 de Enero
  if (month === 12 || (month === 1 && day <= 6)) {
    return 'snow'
  }

  // 3. San Valentín: 7 de Febrero al 16 de Febrero
  if (month === 2 && day >= 7 && day <= 16) {
    return 'rose_petals'
  }

  // 4. Primavera: 20 de Marzo al 31 de Mayo
  if ((month === 3 && day >= 20) || month === 4 || month === 5) {
    return 'sakura'
  }

  // 5. Halloween: 20 de Octubre al 2 de Noviembre
  if ((month === 10 && day >= 20) || (month === 11 && day <= 2)) {
    return 'halloween'
  }

  // 6. Otoño: 15 de Septiembre al 19 de Octubre, y 3 al 30 de Noviembre
  if (
    (month === 9 && day >= 15) ||
    (month === 10 && day < 20) ||
    (month === 11 && day >= 3)
  ) {
    return 'leaves'
  }

  // 7. Resto del año: sin partículas estacionales activas
  return 'none'
}

export function getCurrentSeasonalInfo(currentDate: Date = new Date()): {
  effect: ConcreteSeasonalEffect
  name: string
  icon: string
  dateRange: string
  description: string
} {
  const effect = resolveSeasonalEffect('auto', currentDate)
  if (effect === 'none') {
    return {
      effect: 'none',
      name: 'Sin festividad activa hoy',
      icon: '🌿',
      dateRange: 'Fuera de temporada festiva',
      description: 'Diseño limpio y minimalista hasta la próxima festividad del año.',
    }
  }
  const item = SEASONAL_SCHEDULE.find((s) => s.effect === effect)
  return {
    effect,
    name: item?.name || 'Festividad Estacional',
    icon: item?.icon || '✨',
    dateRange: item?.period || 'En temporada',
    description: item?.description || 'Efecto estacional activo',
  }
}

