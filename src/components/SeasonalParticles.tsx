import { useEffect, useRef } from 'react'
import { resolveSeasonalEffect, type SeasonalEffectType } from '../utils/seasonalCalendar'

export type { SeasonalEffectType }

interface SeasonalParticlesProps {
  effect?: SeasonalEffectType
  containerMode?: boolean
  className?: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  layer: number
  alpha: number
  maxAlpha: number
  rotation: number
  rotationSpeed: number
  wobble: number
  wobbleSpeed: number
  swingAmp: number
  swingSpeed: number
  phase: number
  color: string
  colorAlt?: string
  shapeType?: number
}

// Fireworks structs
interface FireworkRocket {
  x: number
  y: number
  vx: number
  vy: number
  targetY: number
  color: string
  trail: Array<{ x: number; y: number; alpha: number }>
}

interface FireworkSpark {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  color: string
  decay: number
  gravity: number
  friction: number
  history: Array<{ x: number; y: number }>
}

export function SeasonalParticles({
  effect = 'none',
  containerMode = false,
  className = '',
}: SeasonalParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const activeEffect = resolveSeasonalEffect(effect)

  useEffect(() => {
    if (!activeEffect || activeEffect === 'none') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animId: number
    let width = 0
    let height = 0
    let dpr = 1
    let particles: Particle[] = []
    let isVisible = true

    // Fireworks state
    let rockets: FireworkRocket[] = []
    let sparks: FireworkSpark[] = []
    let fireworkTimer = 0
    const FIREWORK_INTERVAL = containerMode ? 55 : 65 // Frames between bursts

    const fireworkPalettes = [
      ['#ffd700', '#fef08a', '#ffffff', '#eab308'], // Imperial Gold
      ['#38bdf8', '#0284c7', '#ffffff', '#bae6fd'], // Electric Ice Blue
      ['#f43f5e', '#be123c', '#fda4af', '#ffffff'], // Ruby Rose
      ['#10b981', '#059669', '#6ee7b7', '#ffd700'], // Emerald & Gold
      ['#c084fc', '#7e22ce', '#f3e8ff', '#ffd700'], // Amethyst & Champagne
    ]

    const leafColors = [
      { fill: '#c2410c', alt: '#9a3412' },
      { fill: '#d97706', alt: '#b45309' },
      { fill: '#d4af37', alt: '#a16207' },
      { fill: '#b91c1c', alt: '#7f1d1d' },
      { fill: '#854d0e', alt: '#713f12' },
    ]

    const sakuraColors = [
      { fill: '#fbcfe8', alt: '#f472b6' },
      { fill: '#fdf2f8', alt: '#f9a8d4' },
      { fill: '#f472b6', alt: '#db2777' },
      { fill: '#fda4af', alt: '#fb7185' },
    ]

    const roseColors = [
      { fill: '#881337', alt: '#4c0519' },
      { fill: '#9f1239', alt: '#700922' },
      { fill: '#be123c', alt: '#831843' },
      { fill: '#fb7185', alt: '#9f1239' },
    ]

    const goldColors = [
      { fill: '#fef08a', alt: '#eab308' },
      { fill: '#d4af37', alt: '#ca8a04' },
      { fill: '#e5c158', alt: '#a16207' },
      { fill: '#ffffff', alt: '#fde047' },
    ]

    const halloweenColors = [
      { fill: '#f97316', alt: '#ea580c' },
      { fill: '#fbbf24', alt: '#d97706' },
      { fill: '#c084fc', alt: '#9333ea' },
      { fill: '#2e2a3b', alt: '#1a1824' },
    ]

    function initSize() {
      if (!canvas) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      if (containerMode && canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect()
        width = rect.width
        height = rect.height
      } else {
        width = window.innerWidth
        height = window.innerHeight
      }

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx?.scale(dpr, dpr)
    }

    function createParticle(initialScatter = false): Particle {
      const pY = initialScatter ? Math.random() * height : -30 - Math.random() * 50
      const layer = Math.random() < 0.4 ? 0 : Math.random() < 0.75 ? 1 : 2

      if (activeEffect === 'snow') {
        const size = layer === 0 ? 1.2 + Math.random() * 1.2 : layer === 1 ? 2.2 + Math.random() * 1.8 : 3.8 + Math.random() * 2.4
        const speedMult = layer === 0 ? 0.6 : layer === 1 ? 1.0 : 1.4
        return {
          x: Math.random() * width,
          y: pY,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (0.7 + Math.random() * 1.1) * speedMult,
          size,
          layer,
          alpha: (0.3 + Math.random() * 0.5) * (layer === 0 ? 0.6 : layer === 1 ? 0.85 : 1),
          maxAlpha: 0.85,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.015 + Math.random() * 0.02,
          swingAmp: 0.8 + Math.random() * 1.5,
          swingSpeed: 0.01 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: '#ffffff',
        }
      }

      if (activeEffect === 'leaves') {
        const c = leafColors[Math.floor(Math.random() * leafColors.length)]
        const size = 11 + Math.random() * 13
        return {
          x: Math.random() * width,
          y: pY,
          vx: (Math.random() - 0.5) * 0.6,
          vy: 1.1 + Math.random() * 1.3,
          size,
          layer,
          alpha: 0.75 + Math.random() * 0.25,
          maxAlpha: 0.95,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.025 + Math.random() * 0.035,
          swingAmp: 1.8 + Math.random() * 2.2,
          swingSpeed: 0.015 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: c.fill,
          colorAlt: c.alt,
          shapeType: Math.floor(Math.random() * 2),
        }
      }

      if (activeEffect === 'sakura') {
        const c = sakuraColors[Math.floor(Math.random() * sakuraColors.length)]
        const size = 8 + Math.random() * 8
        return {
          x: Math.random() * width,
          y: pY,
          vx: 0.3 + Math.random() * 0.7,
          vy: 0.8 + Math.random() * 1.0,
          size,
          layer,
          alpha: 0.65 + Math.random() * 0.25,
          maxAlpha: 0.85,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.025,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          swingAmp: 1.4 + Math.random() * 1.8,
          swingSpeed: 0.02 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: c.fill,
          colorAlt: c.alt,
        }
      }

      if (activeEffect === 'rose_petals') {
        const c = roseColors[Math.floor(Math.random() * roseColors.length)]
        const size = 10 + Math.random() * 10
        return {
          x: Math.random() * width,
          y: pY,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 0.9 + Math.random() * 1.1,
          size,
          layer,
          alpha: 0.7 + Math.random() * 0.25,
          maxAlpha: 0.9,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.025,
          swingAmp: 1.6 + Math.random() * 2.0,
          swingSpeed: 0.012 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: c.fill,
          colorAlt: c.alt,
        }
      }

      if (activeEffect === 'halloween') {
        const isBat = Math.random() < 0.28
        const c = halloweenColors[Math.floor(Math.random() * halloweenColors.length)]
        if (isBat) {
          const size = 10 + Math.random() * 8
          return {
            x: Math.random() * width,
            y: initialScatter ? Math.random() * height : -30,
            vx: 0.7 + Math.random() * 1.2,
            vy: 0.3 + Math.random() * 0.6,
            size,
            layer,
            alpha: 0.75 + Math.random() * 0.25,
            maxAlpha: 0.95,
            rotation: (Math.random() - 0.5) * 0.2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.12 + Math.random() * 0.08,
            swingAmp: 1.5 + Math.random() * 2.0,
            swingSpeed: 0.02 + Math.random() * 0.03,
            phase: Math.random() * Math.PI * 2,
            color: '#1a1824',
            colorAlt: '#2e2a3b',
            shapeType: 1,
          }
        } else {
          const size = 2.0 + Math.random() * 3.5
          return {
            x: Math.random() * width,
            y: pY,
            vx: (Math.random() - 0.5) * 0.6,
            vy: 0.6 + Math.random() * 0.9,
            size,
            layer,
            alpha: 0.35 + Math.random() * 0.55,
            maxAlpha: 0.9,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.03,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.03 + Math.random() * 0.04,
            swingAmp: 1.0 + Math.random() * 1.5,
            swingSpeed: 0.015 + Math.random() * 0.02,
            phase: Math.random() * Math.PI * 2,
            color: c.fill,
            colorAlt: c.alt,
            shapeType: 0,
          }
        }
      }

      // Default ambient gold stardust for new_year
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.4 + Math.random() * 0.6,
        size: 1.5 + Math.random() * 2.5,
        layer: 1,
        alpha: 0.3 + Math.random() * 0.4,
        maxAlpha: 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 0.02,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03,
        swingAmp: 0.8,
        swingSpeed: 0.02,
        phase: Math.random() * Math.PI * 2,
        color: '#ffd700',
        shapeType: 0,
      }
    }

    function spawnRocket() {
      const palette = fireworkPalettes[Math.floor(Math.random() * fireworkPalettes.length)]
      const mainColor = palette[0]
      const startX = width * (0.15 + Math.random() * 0.7)
      const targetY = height * (containerMode ? 0.15 + Math.random() * 0.3 : 0.12 + Math.random() * 0.35)
      const speed = containerMode ? 6.5 + Math.random() * 2.5 : 8.5 + Math.random() * 4.0

      rockets.push({
        x: startX,
        y: height + 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -speed,
        targetY,
        color: mainColor,
        trail: [],
      })
    }

    function detonateRocket(rocket: FireworkRocket) {
      const palette = fireworkPalettes[Math.floor(Math.random() * fireworkPalettes.length)]
      const sparkCount = containerMode ? 36 : 60 + Math.floor(Math.random() * 25)

      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = (containerMode ? 1.5 : 2.0) + Math.random() * (containerMode ? 3.5 : 5.5)
        const sparkColor = palette[Math.floor(Math.random() * palette.length)]

        sparks.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: sparkColor,
          decay: 0.012 + Math.random() * 0.014,
          gravity: 0.045 + Math.random() * 0.025,
          friction: 0.965,
          history: [{ x: rocket.x, y: rocket.y }],
        })
      }
    }

    function initParticles() {
      if (activeEffect === 'new_year') {
        // In new year mode, spawn ambient sparkles and immediate first firework!
        particles = []
        for (let i = 0; i < (containerMode ? 15 : 25); i++) {
          particles.push(createParticle(true))
        }
        spawnRocket()
        return
      }

      let count = 45
      if (containerMode) {
        count = 25
      } else if (width < 640) {
        count = activeEffect === 'snow' ? 38 : 22
      } else if (width < 1200) {
        count = activeEffect === 'snow' ? 65 : 35
      } else {
        count = activeEffect === 'snow' ? 85 : 45
      }

      particles = []
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(true))
      }
    }

    initSize()
    initParticles()

    const handleResize = () => {
      initSize()
      initParticles()
    }

    const handleVisibilityChange = () => {
      isVisible = !document.hidden
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    function drawSnowflake(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)

      if (p.layer === 2) {
        const rad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.5)
        rad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`)
        rad.addColorStop(0.4, `rgba(240, 246, 255, ${p.alpha * 0.8})`)
        rad.addColorStop(1, 'rgba(230, 240, 255, 0)')
        ctx.fillStyle = rad
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillStyle = `rgba(245, 248, 255, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    function drawLeaf(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)

      const scaleX = Math.cos(p.wobble)
      ctx.scale(scaleX, 1)

      const length = p.size * 1.6
      const widthL = p.size * 0.9

      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha
      ctx.beginPath()
      ctx.moveTo(0, -length / 2)
      ctx.bezierCurveTo(widthL / 2, -length / 4, widthL / 2, length / 4, 0, length / 2)
      ctx.bezierCurveTo(-widthL / 2, length / 4, -widthL / 2, -length / 4, 0, -length / 2)
      ctx.closePath()
      ctx.fill()

      if (Math.abs(scaleX) > 0.35 && p.colorAlt) {
        ctx.strokeStyle = p.colorAlt
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(0, -length / 2 + 2)
        ctx.lineTo(0, length / 2 - 1)
        ctx.stroke()
      }
      ctx.restore()
    }

    function drawSakura(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)

      const scaleX = Math.cos(p.wobble)
      const scaleY = 0.7 + Math.sin(p.wobble * 0.8) * 0.3
      ctx.scale(scaleX, scaleY)

      const s = p.size
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha

      ctx.beginPath()
      ctx.moveTo(0, s * 0.7)
      ctx.bezierCurveTo(-s * 0.7, s * 0.3, -s * 0.8, -s * 0.4, -s * 0.3, -s * 0.8)
      ctx.quadraticCurveTo(0, -s * 0.5, s * 0.3, -s * 0.8)
      ctx.bezierCurveTo(s * 0.8, -s * 0.4, s * 0.7, s * 0.3, 0, s * 0.7)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    function drawRosePetal(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)

      const scaleX = Math.cos(p.wobble)
      ctx.scale(scaleX, 1)

      const s = p.size
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha

      ctx.beginPath()
      ctx.moveTo(0, s * 0.8)
      ctx.bezierCurveTo(-s * 0.9, s * 0.4, -s * 0.9, -s * 0.6, 0, -s * 0.8)
      ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.9, s * 0.4, 0, s * 0.8)
      ctx.closePath()
      ctx.fill()

      if (Math.abs(scaleX) > 0.4 && p.colorAlt) {
        ctx.strokeStyle = p.colorAlt
        ctx.lineWidth = 0.7
        ctx.beginPath()
        ctx.arc(0, 0, s * 0.45, -Math.PI * 0.3, Math.PI * 0.3)
        ctx.stroke()
      }
      ctx.restore()
    }

    function drawCelebrationSparkle(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)

      const twinkle = 0.6 + Math.sin(p.wobble) * 0.4
      const alpha = Math.min(1, p.alpha * twinkle)

      if (p.shapeType === 1) {
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.globalAlpha = alpha

        const arm = p.size * 2.2
        const thin = p.size * 0.4
        ctx.beginPath()
        ctx.moveTo(0, -arm)
        ctx.quadraticCurveTo(0, 0, arm, 0)
        ctx.quadraticCurveTo(0, 0, 0, arm)
        ctx.quadraticCurveTo(0, 0, -arm, 0)
        ctx.quadraticCurveTo(0, 0, 0, -arm)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(0, 0, thin, 0, Math.PI * 2)
        ctx.fill()
      } else {
        const rad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2)
        rad.addColorStop(0, `rgba(254, 240, 138, ${alpha})`)
        rad.addColorStop(0.4, `rgba(212, 175, 55, ${alpha * 0.7})`)
        rad.addColorStop(1, 'rgba(212, 175, 55, 0)')
        ctx.fillStyle = rad
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    function drawHalloween(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)

      if (p.shapeType === 1) {
        ctx.rotate(p.rotation)
        const flap = Math.sin(p.wobble)
        const s = p.size
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha

        ctx.beginPath()
        ctx.ellipse(0, 0, s * 0.22, s * 0.42, 0, 0, Math.PI * 2)
        ctx.moveTo(-s * 0.16, -s * 0.35)
        ctx.lineTo(-s * 0.25, -s * 0.58)
        ctx.lineTo(-s * 0.08, -s * 0.38)
        ctx.moveTo(s * 0.16, -s * 0.35)
        ctx.lineTo(s * 0.25, -s * 0.58)
        ctx.lineTo(s * 0.08, -s * 0.38)
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(-s * 0.12, 0)
        ctx.quadraticCurveTo(-s * 0.65, -s * 0.75 * flap, -s * 1.25, -s * 0.3 * flap)
        ctx.quadraticCurveTo(-s * 0.85, s * 0.2, -s * 0.6, s * 0.1)
        ctx.quadraticCurveTo(-s * 0.35, s * 0.25, -s * 0.12, 0)
        ctx.moveTo(s * 0.12, 0)
        ctx.quadraticCurveTo(s * 0.65, -s * 0.75 * flap, s * 1.25, -s * 0.3 * flap)
        ctx.quadraticCurveTo(s * 0.85, s * 0.2, s * 0.6, s * 0.1)
        ctx.quadraticCurveTo(s * 0.35, s * 0.25, s * 0.12, 0)
        ctx.fill()
      } else {
        const rad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2)
        rad.addColorStop(0, p.color)
        rad.addColorStop(0.4, p.colorAlt || p.color)
        rad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = rad
        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    let lastTime = performance.now()

    function animate(currentTime: number) {
      animId = requestAnimationFrame(animate)

      if (!isVisible) {
        lastTime = currentTime
        return
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1)
      lastTime = currentTime

      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      // FIREWORKS MODE (Fin de Año)
      if (activeEffect === 'new_year') {
        fireworkTimer++
        if (fireworkTimer >= FIREWORK_INTERVAL) {
          fireworkTimer = 0
          spawnRocket()
          // 25% chance of tandem rocket for double fireworks burst!
          if (Math.random() < 0.25) {
            setTimeout(() => spawnRocket(), 180)
          }
        }

        // 1. Update and draw ascending rockets
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i]
          r.trail.push({ x: r.x, y: r.y, alpha: 1 })
          if (r.trail.length > 7) r.trail.shift()

          // Draw sparkling rocket trail
          for (let t = 0; t < r.trail.length; t++) {
            const pt = r.trail[t]
            ctx.fillStyle = r.color
            ctx.globalAlpha = (t / r.trail.length) * 0.6
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2)
            ctx.fill()
          }

          // Draw rocket tip
          ctx.fillStyle = '#ffffff'
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2)
          ctx.fill()

          r.x += r.vx
          r.y += r.vy

          // Check if reached apex / burst height
          if (r.y <= r.targetY || r.vy >= -0.5) {
            detonateRocket(r)
            rockets.splice(i, 1)
          }
        }

        // 2. Update and draw burst sparks with luminous light trails
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i]

          s.history.push({ x: s.x, y: s.y })
          if (s.history.length > 4) s.history.shift()

          // Draw spark trail line
          if (s.history.length > 1) {
            ctx.strokeStyle = s.color
            ctx.lineWidth = 1.8
            ctx.globalAlpha = Math.max(0, s.alpha)
            ctx.beginPath()
            ctx.moveTo(s.history[0].x, s.history[0].y)
            for (let h = 1; h < s.history.length; h++) {
              ctx.lineTo(s.history[h].x, s.history[h].y)
            }
            ctx.stroke()
          }

          // Spark head
          ctx.fillStyle = '#ffffff'
          ctx.globalAlpha = Math.max(0, s.alpha)
          ctx.beginPath()
          ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2)
          ctx.fill()

          // Physics: drag & gravity
          s.vx *= s.friction
          s.vy *= s.friction
          s.vy += s.gravity
          s.x += s.vx
          s.y += s.vy
          s.alpha -= s.decay

          if (s.alpha <= 0 || s.y > height + 20) {
            sparks.splice(i, 1)
          }
        }

        // 3. Gentle ambient celebratory stardust
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          p.phase += p.swingSpeed
          p.y += p.vy
          p.x += Math.sin(p.phase) * 0.4
          drawCelebrationSparkle(p)
          if (p.y > height + 10) {
            particles[i] = createParticle(false)
          }
        }
        return
      }

      // STANDARD SEASONAL PARTICLES (Snow, Leaves, Sakura, Rose, Gold Dust, Halloween)
      const globalWind = Math.sin(currentTime * 0.0006) * 0.5

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        p.phase += p.swingSpeed
        p.wobble += p.wobbleSpeed
        p.rotation += p.rotationSpeed

        const swing = Math.sin(p.phase) * p.swingAmp
        p.x += (p.vx + swing + globalWind) * (dt * 60)
        p.y += p.vy * (dt * 60)

        if (activeEffect === 'snow') drawSnowflake(p)
        else if (activeEffect === 'leaves') drawLeaf(p)
        else if (activeEffect === 'sakura') drawSakura(p)
        else if (activeEffect === 'rose_petals') drawRosePetal(p)
        else if (activeEffect === 'halloween') drawHalloween(p)

        if (p.y > height + 40) {
          particles[i] = createParticle(false)
        } else if (p.y < -50 && p.vy < 0) {
          particles[i] = createParticle(false)
          particles[i].y = height + 20
        }

        if (p.x < -40) {
          p.x = width + 30
        } else if (p.x > width + 40) {
          p.x = -30
        }
      }
    }

    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeEffect, containerMode])

  if (!activeEffect || activeEffect === 'none') {
    return null
  }

  if (containerMode) {
    return (
      <canvas
        ref={canvasRef}
        className={`w-full h-full pointer-events-none ${className}`}
        aria-hidden="true"
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-35 ${className}`}
      aria-hidden="true"
    />
  )
}
