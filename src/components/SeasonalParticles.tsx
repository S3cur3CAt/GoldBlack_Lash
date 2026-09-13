import { useEffect, useRef } from 'react'

export type SeasonalEffectType =
  | 'none'
  | 'snow'
  | 'sakura'
  | 'leaves'
  | 'rose_petals'
  | 'gold_dust'
  | 'new_year'
  | 'halloween'

interface SeasonalParticlesProps {
  effect?: SeasonalEffectType
  containerMode?: boolean // If true, sizes to container instead of fixed full viewport (useful for admin preview)
  className?: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  layer: number // 0: far, 1: mid, 2: near
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

export function SeasonalParticles({
  effect = 'none',
  containerMode = false,
  className = '',
}: SeasonalParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!effect || effect === 'none') return

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

    // Palettes
    const leafColors = [
      { fill: '#c2410c', alt: '#9a3412' }, // Terracotta rust
      { fill: '#d97706', alt: '#b45309' }, // Warm amber
      { fill: '#d4af37', alt: '#a16207' }, // Golden ochre
      { fill: '#b91c1c', alt: '#7f1d1d' }, // Crimson maple
      { fill: '#854d0e', alt: '#713f12' }, // Chestnut
    ]

    const sakuraColors = [
      { fill: '#fbcfe8', alt: '#f472b6' }, // Soft blossom pink
      { fill: '#fdf2f8', alt: '#f9a8d4' }, // Pure petal white-pink
      { fill: '#f472b6', alt: '#db2777' }, // Rosy magenta
      { fill: '#fda4af', alt: '#fb7185' }, // Blush coral
    ]

    const roseColors = [
      { fill: '#881337', alt: '#4c0519' }, // Deep velvet wine
      { fill: '#9f1239', alt: '#700922' }, // Rich ruby
      { fill: '#be123c', alt: '#831843' }, // Crimson rose
      { fill: '#fb7185', alt: '#9f1239' }, // Soft petal highlight
    ]

    const goldColors = [
      { fill: '#fef08a', alt: '#eab308' }, // Light 24k gold
      { fill: '#d4af37', alt: '#ca8a04' }, // Classic GoldBlack gold
      { fill: '#e5c158', alt: '#a16207' }, // Champagne sparkle
      { fill: '#ffffff', alt: '#fde047' }, // Pure light specular
    ]

    const newYearColors = [
      { fill: '#d4af37', alt: '#a16207' }, // Gold
      { fill: '#f8fafc', alt: '#cbd5e1' }, // Diamond white
      { fill: '#f59e0b', alt: '#b45309' }, // Amber champagne
      { fill: '#fb7185', alt: '#be123c' }, // Celebration rose
    ]

    const halloweenColors = [
      { fill: '#f97316', alt: '#ea580c' }, // Jack-o'-lantern orange
      { fill: '#fbbf24', alt: '#d97706' }, // Warm amber glow
      { fill: '#c084fc', alt: '#9333ea' }, // Spooky mystic purple
      { fill: '#2e2a3b', alt: '#1a1824' }, // Shadow bat
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
      const layer = Math.random() < 0.4 ? 0 : Math.random() < 0.75 ? 1 : 2 // 0: far, 1: mid, 2: near

      if (effect === 'snow') {
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

      if (effect === 'leaves') {
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
          wobbleSpeed: 0.025 + Math.random() * 0.035, // 3D tumble
          swingAmp: 1.8 + Math.random() * 2.2,
          swingSpeed: 0.015 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: c.fill,
          colorAlt: c.alt,
          shapeType: Math.floor(Math.random() * 2),
        }
      }

      if (effect === 'sakura') {
        const c = sakuraColors[Math.floor(Math.random() * sakuraColors.length)]
        const size = 8 + Math.random() * 8
        return {
          x: Math.random() * width,
          y: pY,
          vx: 0.3 + Math.random() * 0.7, // gentle breeze to the right
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

      if (effect === 'rose_petals') {
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

      if (effect === 'gold_dust') {
        const c = goldColors[Math.floor(Math.random() * goldColors.length)]
        const size = 1.5 + Math.random() * 3.5
        // gold dust floats both upward and downward gently
        const floatUp = Math.random() < 0.4
        return {
          x: Math.random() * width,
          y: initialScatter ? Math.random() * height : floatUp ? height + 20 : -20,
          vx: (Math.random() - 0.5) * 0.5,
          vy: floatUp ? -(0.3 + Math.random() * 0.5) : 0.4 + Math.random() * 0.6,
          size,
          layer,
          alpha: 0.2 + Math.random() * 0.6,
          maxAlpha: 0.9,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.03 + Math.random() * 0.04, // shimmer twinkle
          swingAmp: 0.8 + Math.random() * 1.2,
          swingSpeed: 0.015 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: c.fill,
          colorAlt: c.alt,
          shapeType: Math.random() < 0.35 ? 1 : 0, // 1: 4-point sparkle star, 0: soft glowing orb
        }
      }

      // halloween
      if (effect === 'halloween') {
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
            wobbleSpeed: 0.12 + Math.random() * 0.08, // wing flap frequency
            swingAmp: 1.5 + Math.random() * 2.0,
            swingSpeed: 0.02 + Math.random() * 0.03,
            phase: Math.random() * Math.PI * 2,
            color: '#1a1824',
            colorAlt: '#2e2a3b',
            shapeType: 1, // 1: flying bat
          }
        } else {
          // Glowing jack-o'-lantern ember / spirit particle
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
            shapeType: 0, // 0: glowing ember
          }
        }
      }

      // new_year default fallback
      const c = newYearColors[Math.floor(Math.random() * newYearColors.length)]
      const size = 2.5 + Math.random() * 4.5
      return {
        x: Math.random() * width,
        y: pY,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.8 + Math.random() * 1.3,
        size,
        layer,
        alpha: 0.4 + Math.random() * 0.5,
        maxAlpha: 0.95,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.04 + Math.random() * 0.05,
        swingAmp: 1.2 + Math.random() * 1.8,
        swingSpeed: 0.02 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2,
        color: c.fill,
        colorAlt: c.alt,
        shapeType: Math.random() < 0.4 ? 1 : 0, // 1: diamond star, 0: shimmering ribbon/confetti
      }
    }

    function initParticles() {
      // Density according to screen width and container mode
      let count = 45
      if (containerMode) {
        count = 25
      } else if (width < 640) {
        count = effect === 'snow' ? 38 : effect === 'gold_dust' ? 32 : 22
      } else if (width < 1200) {
        count = effect === 'snow' ? 65 : effect === 'gold_dust' ? 55 : 35
      } else {
        count = effect === 'snow' ? 85 : effect === 'gold_dust' ? 70 : 45
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

    // Render shapes
    function drawSnowflake(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)

      if (p.layer === 2) {
        // Foreground soft radial glow
        const rad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.5)
        rad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`)
        rad.addColorStop(0.4, `rgba(240, 246, 255, ${p.alpha * 0.8})`)
        rad.addColorStop(1, 'rgba(230, 240, 255, 0)')
        ctx.fillStyle = rad
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Crisp mid/far flake with subtle crystalline soft edge
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

      // 3D tumble scaling via cosine
      const scaleX = Math.cos(p.wobble)
      ctx.scale(scaleX, 1)

      const length = p.size * 1.6
      const widthL = p.size * 0.9

      // Organic curved leaf path
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha

      ctx.beginPath()
      ctx.moveTo(0, -length / 2) // leaf tip
      ctx.bezierCurveTo(widthL / 2, -length / 4, widthL / 2, length / 4, 0, length / 2) // right curve
      ctx.bezierCurveTo(-widthL / 2, length / 4, -widthL / 2, -length / 4, 0, -length / 2) // left curve
      ctx.closePath()
      ctx.fill()

      // Central stem / vein for realism
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

      // 3D pitch/roll tumbling
      const scaleX = Math.cos(p.wobble)
      const scaleY = 0.7 + Math.sin(p.wobble * 0.8) * 0.3
      ctx.scale(scaleX, scaleY)

      const s = p.size
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha

      // Heart-notched delicate sakura petal
      ctx.beginPath()
      ctx.moveTo(0, s * 0.7) // bottom petal base
      ctx.bezierCurveTo(-s * 0.7, s * 0.3, -s * 0.8, -s * 0.4, -s * 0.3, -s * 0.8)
      ctx.quadraticCurveTo(0, -s * 0.5, s * 0.3, -s * 0.8) // petal notch tip
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

      // Velvet rounded rose petal
      ctx.beginPath()
      ctx.moveTo(0, s * 0.8)
      ctx.bezierCurveTo(-s * 0.9, s * 0.4, -s * 0.9, -s * 0.6, 0, -s * 0.8)
      ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.9, s * 0.4, 0, s * 0.8)
      ctx.closePath()
      ctx.fill()

      // Subtle velvet gradient contour highlight
      if (Math.abs(scaleX) > 0.4 && p.colorAlt) {
        ctx.strokeStyle = p.colorAlt
        ctx.lineWidth = 0.7
        ctx.beginPath()
        ctx.arc(0, 0, s * 0.45, -Math.PI * 0.3, Math.PI * 0.3)
        ctx.stroke()
      }

      ctx.restore()
    }

    function drawGoldDust(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)

      const twinkle = 0.6 + Math.sin(p.wobble) * 0.4
      const alpha = Math.min(1, p.alpha * twinkle)

      if (p.shapeType === 1) {
        // 4-point sparkle star
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

        // Center jewel spark
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(0, 0, thin, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Soft glowing gold stardust orb
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

    function drawNewYear(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)

      const scaleX = Math.cos(p.wobble)
      ctx.scale(scaleX, 1)

      const alpha = p.alpha * (0.7 + Math.sin(p.wobble * 1.5) * 0.3)
      ctx.globalAlpha = Math.max(0.2, Math.min(1, alpha))

      if (p.shapeType === 1) {
        // Diamond celebration sparkle
        const r = p.size * 1.5
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.moveTo(0, -r)
        ctx.lineTo(r * 0.7, 0)
        ctx.lineTo(0, r)
        ctx.lineTo(-r * 0.7, 0)
        ctx.closePath()
        ctx.fill()
      } else {
        // Shimmering confetti ribbon
        const w = p.size * 1.4
        const h = p.size * 0.7
        ctx.fillStyle = p.color
        ctx.fillRect(-w / 2, -h / 2, w, h)
      }

      ctx.restore()
    }

    function drawHalloween(p: Particle) {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)

      if (p.shapeType === 1) {
        // Flying bat with animated wings
        ctx.rotate(p.rotation)
        const flap = Math.sin(p.wobble) // wing flapping factor
        const s = p.size
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha

        // Bat body & ears
        ctx.beginPath()
        ctx.ellipse(0, 0, s * 0.22, s * 0.42, 0, 0, Math.PI * 2)
        ctx.moveTo(-s * 0.16, -s * 0.35)
        ctx.lineTo(-s * 0.25, -s * 0.58)
        ctx.lineTo(-s * 0.08, -s * 0.38)
        ctx.moveTo(s * 0.16, -s * 0.35)
        ctx.lineTo(s * 0.25, -s * 0.58)
        ctx.lineTo(s * 0.08, -s * 0.38)
        ctx.fill()

        // Wings
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
        // Glowing jack-o'-lantern ember / spirit particle
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

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1) // clamp delta
      lastTime = currentTime

      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      // Time-dependent wind variation
      const globalWind = Math.sin(currentTime * 0.0006) * 0.5

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Advance oscillation
        p.phase += p.swingSpeed
        p.wobble += p.wobbleSpeed
        p.rotation += p.rotationSpeed

        // Compute physics
        const swing = Math.sin(p.phase) * p.swingAmp
        p.x += (p.vx + swing + globalWind) * (dt * 60)
        p.y += p.vy * (dt * 60)

        // Draw particle based on active mode
        if (effect === 'snow') drawSnowflake(p)
        else if (effect === 'leaves') drawLeaf(p)
        else if (effect === 'sakura') drawSakura(p)
        else if (effect === 'rose_petals') drawRosePetal(p)
        else if (effect === 'gold_dust') drawGoldDust(p)
        else if (effect === 'new_year') drawNewYear(p)
        else if (effect === 'halloween') drawHalloween(p)

        // Wrap around boundaries
        if (p.y > height + 40) {
          particles[i] = createParticle(false)
        } else if (p.y < -50 && p.vy < 0) {
          // Floating upward particles in gold dust
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
  }, [effect, containerMode])

  if (!effect || effect === 'none') {
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
