import React, { useEffect, useRef } from 'react'
import { resolveSeasonalEffect, type SeasonalEffectType } from '../utils/seasonalCalendar'

export type { SeasonalEffectType }

interface SeasonalPreviewCanvasProps {
  effect?: SeasonalEffectType
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

interface FireworkRocket {
  x: number
  y: number
  vx: number
  vy: number
  targetY: number
  color: string
  trail: { x: number; y: number; alpha: number }[]
  palette: string[]
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
  history: { x: number; y: number }[]
}

export const SeasonalPreviewCanvas: React.FC<SeasonalPreviewCanvasProps> = ({
  effect = 'none',
  className = '',
}) => {
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
    let rockets: FireworkRocket[] = []
    let sparks: FireworkSpark[] = []
    let lastRocketTime = 0

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

    const fireworkPalettes = [
      // Imperial Gold & Champagne
      ['#ffffff', '#fef08a', '#facc15', '#eab308', '#d4af37', '#ca8a04'],
      // Electric Ice Blue & Silver
      ['#ffffff', '#e0f2fe', '#7dd3fc', '#38bdf8', '#0284c7'],
      // Ruby & Rose Gold
      ['#ffffff', '#ffe4e6', '#fb7185', '#f43f5e', '#e11d48', '#d4af37'],
      // Emerald & Gold Luxury
      ['#ffffff', '#bbf7d0', '#4ade80', '#22c55e', '#facc15', '#d4af37'],
      // Royal Amethyst & Diamond
      ['#ffffff', '#f3e8ff', '#d8b4fe', '#c084fc', '#a855f7', '#fef08a'],
    ]

    const halloweenColors = [
      { fill: '#f97316', alt: '#ea580c' },
      { fill: '#fbbf24', alt: '#d97706' },
      { fill: '#c084fc', alt: '#9333ea' },
      { fill: '#2e2a3b', alt: '#1a1824' },
    ]

    function initSize() {
      if (!canvas || !canvas.parentElement) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.parentElement.getBoundingClientRect()
      width = rect.width || 400
      height = rect.height || 160

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function createParticle(initialScatter = false): Particle {
      const pY = initialScatter ? Math.random() * height : -20 - Math.random() * 30
      const layer = Math.random() < 0.4 ? 0 : Math.random() < 0.75 ? 1 : 2

      if (activeEffect === 'snow') {
        const size =
          layer === 0
            ? 1.2 + Math.random() * 1.0
            : layer === 1
            ? 2.0 + Math.random() * 1.4
            : 3.2 + Math.random() * 1.8
        const speedMult = layer === 0 ? 0.6 : layer === 1 ? 1.0 : 1.3
        return {
          x: Math.random() * width,
          y: pY,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (0.7 + Math.random() * 0.9) * speedMult,
          size,
          layer,
          alpha: (0.35 + Math.random() * 0.5) * (layer === 0 ? 0.6 : layer === 1 ? 0.85 : 1),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.015 + Math.random() * 0.02,
          swingAmp: 0.8 + Math.random() * 1.2,
          swingSpeed: 0.01 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: '#ffffff',
        }
      }

      if (activeEffect === 'leaves') {
        const c = leafColors[Math.floor(Math.random() * leafColors.length)]
        const size = 9 + Math.random() * 9
        return {
          x: Math.random() * width,
          y: pY,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 1.0 + Math.random() * 1.1,
          size,
          layer,
          alpha: 0.75 + Math.random() * 0.25,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.025 + Math.random() * 0.03,
          swingAmp: 1.5 + Math.random() * 1.8,
          swingSpeed: 0.015 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: c.fill,
          colorAlt: c.alt,
          shapeType: Math.floor(Math.random() * 2),
        }
      }

      if (activeEffect === 'sakura') {
        const c = sakuraColors[Math.floor(Math.random() * sakuraColors.length)]
        const size = 7 + Math.random() * 7
        return {
          x: Math.random() * width,
          y: pY,
          vx: 0.3 + Math.random() * 0.6,
          vy: 0.7 + Math.random() * 0.9,
          size,
          layer,
          alpha: 0.65 + Math.random() * 0.25,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.025,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          swingAmp: 1.2 + Math.random() * 1.5,
          swingSpeed: 0.02 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: c.fill,
          colorAlt: c.alt,
        }
      }

      if (activeEffect === 'rose_petals') {
        const c = roseColors[Math.floor(Math.random() * roseColors.length)]
        const size = 8 + Math.random() * 8
        return {
          x: Math.random() * width,
          y: pY,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 0.8 + Math.random() * 1.0,
          size,
          layer,
          alpha: 0.7 + Math.random() * 0.25,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.025,
          swingAmp: 1.4 + Math.random() * 1.6,
          swingSpeed: 0.012 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: c.fill,
          colorAlt: c.alt,
        }
      }

      if (activeEffect === 'new_year') {
        const c = goldColors[Math.floor(Math.random() * goldColors.length)]
        const size = 1.5 + Math.random() * 3.0
        const floatUp = Math.random() < 0.4
        return {
          x: Math.random() * width,
          y: initialScatter ? Math.random() * height : floatUp ? height + 10 : -10,
          vx: (Math.random() - 0.5) * 0.4,
          vy: floatUp ? -(0.3 + Math.random() * 0.4) : 0.3 + Math.random() * 0.5,
          size,
          layer,
          alpha: 0.25 + Math.random() * 0.55,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.03 + Math.random() * 0.04,
          swingAmp: 0.6 + Math.random() * 1.0,
          swingSpeed: 0.015 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: c.fill,
          colorAlt: c.alt,
          shapeType: Math.random() < 0.35 ? 1 : 0,
        }
      }

      if (activeEffect === 'halloween') {
        const isBat = Math.random() < 0.28
        const c = halloweenColors[Math.floor(Math.random() * halloweenColors.length)]
        if (isBat) {
          const size = 9 + Math.random() * 7
          return {
            x: Math.random() * width,
            y: initialScatter ? Math.random() * height : -20,
            vx: 0.6 + Math.random() * 1.0,
            vy: 0.3 + Math.random() * 0.5,
            size,
            layer,
            alpha: 0.75 + Math.random() * 0.25,
            rotation: (Math.random() - 0.5) * 0.2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.08 + Math.random() * 0.04,
            swingAmp: 2.0 + Math.random() * 2.0,
            swingSpeed: 0.03 + Math.random() * 0.03,
            phase: Math.random() * Math.PI * 2,
            color: '#1a1824',
            shapeType: 1,
          }
        }
        const size = 3.5 + Math.random() * 5.0
        return {
          x: Math.random() * width,
          y: pY,
          vx: (Math.random() - 0.5) * 0.6,
          vy: 0.6 + Math.random() * 0.8,
          size,
          layer,
          alpha: 0.55 + Math.random() * 0.35,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.025 + Math.random() * 0.03,
          swingAmp: 1.0 + Math.random() * 1.5,
          swingSpeed: 0.02 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: c.fill,
          colorAlt: c.alt,
          shapeType: 0,
        }
      }

      // Default fallback
      return {
        x: Math.random() * width,
        y: pY,
        vx: 0,
        vy: 1,
        size: 2,
        layer: 1,
        alpha: 0.5,
        rotation: 0,
        rotationSpeed: 0,
        wobble: 0,
        wobbleSpeed: 0,
        swingAmp: 0,
        swingSpeed: 0,
        phase: 0,
        color: '#ffffff',
      }
    }

    function spawnRocket() {
      if (width <= 0 || height <= 0) return
      const palette = fireworkPalettes[Math.floor(Math.random() * fireworkPalettes.length)]
      const startX = width * 0.15 + Math.random() * (width * 0.7)
      // Burst apex inside preview container
      const targetY = height * 0.18 + Math.random() * (height * 0.42)
      const flightDistance = height - targetY
      const speed = Math.sqrt(flightDistance * 0.55) + Math.random() * 1.0

      rockets.push({
        x: startX,
        y: height + 5,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -speed,
        targetY,
        color: palette[1] || '#fef08a',
        trail: [],
        palette,
      })
    }

    function detonateRocket(rocket: FireworkRocket) {
      const sparkCount = 38 + Math.floor(Math.random() * 26)
      const baseSpeed = 2.2 + Math.random() * 2.2

      for (let s = 0; s < sparkCount; s++) {
        const angle = (s / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35
        const speed = baseSpeed * (0.45 + Math.random() * 0.7)
        const sparkColor = rocket.palette[Math.floor(Math.random() * rocket.palette.length)]

        sparks.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: sparkColor,
          decay: 0.015 + Math.random() * 0.018,
          gravity: 0.045 + Math.random() * 0.02,
          friction: 0.965,
          history: [{ x: rocket.x, y: rocket.y }],
        })
      }
    }

    function initParticles() {
      if (activeEffect === 'new_year') {
        particles = []
        for (let i = 0; i < 14; i++) {
          particles.push(createParticle(true))
        }
        spawnRocket()
        return
      }

      particles = []
      const count = 28
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

    window.addEventListener('resize', handleResize)

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
      ctx.restore()
    }

    function drawSakura(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      const scaleX = Math.cos(p.wobble)
      ctx.scale(scaleX, 1)

      const r = p.size
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha

      ctx.beginPath()
      ctx.moveTo(0, r)
      ctx.bezierCurveTo(r * 0.8, r * 0.4, r * 0.9, -r * 0.6, 0, -r)
      ctx.bezierCurveTo(-r * 0.9, -r * 0.6, -r * 0.8, r * 0.4, 0, r)
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

      const r = p.size
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha

      ctx.beginPath()
      ctx.moveTo(0, -r)
      ctx.bezierCurveTo(r * 1.2, -r * 0.3, r * 0.8, r * 0.9, 0, r)
      ctx.bezierCurveTo(-r * 0.8, r * 0.9, -r * 1.2, -r * 0.3, 0, -r)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    function drawGoldDust(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)
      const shimmer = 0.65 + Math.sin(p.wobble) * 0.35
      const alpha = p.alpha * shimmer
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha))

      if (p.shapeType === 1) {
        ctx.rotate(p.rotation)
        const rad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2)
        rad.addColorStop(0, '#ffffff')
        rad.addColorStop(0.3, '#fef08a')
        rad.addColorStop(0.7, '#d4af37')
        rad.addColorStop(1, 'rgba(212, 175, 55, 0)')
        ctx.fillStyle = rad

        const arm = p.size * 2.2
        const thin = p.size * 0.4
        ctx.beginPath()
        ctx.moveTo(0, -arm)
        ctx.lineTo(thin, 0)
        ctx.lineTo(0, arm)
        ctx.lineTo(-thin, 0)
        ctx.closePath()
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(-arm, 0)
        ctx.lineTo(0, thin)
        ctx.lineTo(arm, 0)
        ctx.lineTo(0, -thin)
        ctx.closePath()
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
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1)
      lastTime = currentTime

      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      // FIREWORKS ENGINE (for new_year)
      if (activeEffect === 'new_year') {
        // Spawn rockets at steady intervals (every 1.1s to 1.8s)
        if (currentTime - lastRocketTime > 1100 + Math.random() * 700) {
          spawnRocket()
          lastRocketTime = currentTime
        }

        // 1. Update and draw ascending rockets
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i]
          r.trail.push({ x: r.x, y: r.y, alpha: 1 })
          if (r.trail.length > 8) r.trail.shift()

          // Draw trail
          for (let t = 0; t < r.trail.length; t++) {
            const tp = r.trail[t]
            ctx.fillStyle = r.color
            ctx.globalAlpha = (t / r.trail.length) * 0.7
            ctx.beginPath()
            ctx.arc(tp.x, tp.y, 1.2, 0, Math.PI * 2)
            ctx.fill()
          }

          // Rocket head
          ctx.fillStyle = '#ffffff'
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(r.x, r.y, 1.8, 0, Math.PI * 2)
          ctx.fill()

          r.vy += 0.08
          r.x += r.vx
          r.y += r.vy

          if (r.y <= r.targetY || r.vy >= -0.5) {
            detonateRocket(r)
            rockets.splice(i, 1)
          }
        }

        // 2. Update and draw burst sparks with luminous streaks
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i]
          s.history.push({ x: s.x, y: s.y })
          if (s.history.length > 4) s.history.shift()

          if (s.history.length > 1) {
            ctx.strokeStyle = s.color
            ctx.lineWidth = 1.6
            ctx.globalAlpha = Math.max(0, s.alpha)
            ctx.beginPath()
            ctx.moveTo(s.history[0].x, s.history[0].y)
            for (let h = 1; h < s.history.length; h++) {
              ctx.lineTo(s.history[h].x, s.history[h].y)
            }
            ctx.stroke()
          }

          ctx.fillStyle = '#ffffff'
          ctx.globalAlpha = Math.max(0, s.alpha)
          ctx.beginPath()
          ctx.arc(s.x, s.y, 1.0, 0, Math.PI * 2)
          ctx.fill()

          s.vx *= s.friction
          s.vy *= s.friction
          s.vy += s.gravity
          s.x += s.vx
          s.y += s.vy
          s.alpha -= s.decay

          if (s.alpha <= 0 || s.y > height + 10) {
            sparks.splice(i, 1)
          }
        }

        // 3. Ambient stardust
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          p.phase += p.swingSpeed
          p.y += p.vy
          p.x += Math.sin(p.phase) * 0.4
          drawGoldDust(p)
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

        if (p.y > height + 30) {
          particles[i] = createParticle(false)
        } else if (p.y < -30 && p.vy < 0) {
          particles[i] = createParticle(false)
          particles[i].y = height + 15
        }

        if (p.x < -30) p.x = width + 20
        else if (p.x > width + 30) p.x = -20
      }
    }

    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [activeEffect])

  if (!activeEffect || activeEffect === 'none') {
    return (
      <div className={`absolute inset-0 w-full h-full grid place-items-center text-gray-500 text-xs pointer-events-none ${className}`}>
        <span>Efecto desactivado (pantalla limpia)</span>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  )
}
