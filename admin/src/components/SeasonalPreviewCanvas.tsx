import React, { useEffect, useRef } from 'react'

export type SeasonalEffectType =
  | 'none'
  | 'snow'
  | 'sakura'
  | 'leaves'
  | 'rose_petals'
  | 'gold_dust'
  | 'new_year'
  | 'halloween'

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

export const SeasonalPreviewCanvas: React.FC<SeasonalPreviewCanvasProps> = ({
  effect = 'none',
  className = '',
}) => {
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

    const newYearColors = [
      { fill: '#d4af37', alt: '#a16207' },
      { fill: '#f8fafc', alt: '#cbd5e1' },
      { fill: '#f59e0b', alt: '#b45309' },
      { fill: '#fb7185', alt: '#be123c' },
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
      width = rect.width || 300
      height = rect.height || 180

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx?.scale(dpr, dpr)
    }

    function createParticle(initialScatter = false): Particle {
      const pY = initialScatter ? Math.random() * height : -20 - Math.random() * 30
      const layer = Math.random() < 0.4 ? 0 : Math.random() < 0.75 ? 1 : 2

      if (effect === 'snow') {
        const size = layer === 0 ? 1.2 + Math.random() * 1.0 : layer === 1 ? 2.0 + Math.random() * 1.4 : 3.2 + Math.random() * 1.8
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

      if (effect === 'leaves') {
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

      if (effect === 'sakura') {
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

      if (effect === 'rose_petals') {
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

      if (effect === 'gold_dust') {
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

      if (effect === 'halloween') {
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
            wobbleSpeed: 0.12 + Math.random() * 0.08,
            swingAmp: 1.2 + Math.random() * 1.6,
            swingSpeed: 0.02 + Math.random() * 0.03,
            phase: Math.random() * Math.PI * 2,
            color: '#1a1824',
            colorAlt: '#2e2a3b',
            shapeType: 1,
          }
        } else {
          const size = 1.8 + Math.random() * 3.0
          return {
            x: Math.random() * width,
            y: pY,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 0.5 + Math.random() * 0.8,
            size,
            layer,
            alpha: 0.35 + Math.random() * 0.55,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.03,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.03 + Math.random() * 0.04,
            swingAmp: 0.8 + Math.random() * 1.2,
            swingSpeed: 0.015 + Math.random() * 0.02,
            phase: Math.random() * Math.PI * 2,
            color: c.fill,
            colorAlt: c.alt,
            shapeType: 0,
          }
        }
      }

      // new_year
      const c = newYearColors[Math.floor(Math.random() * newYearColors.length)]
      const size = 2.0 + Math.random() * 3.5
      return {
        x: Math.random() * width,
        y: pY,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0.7 + Math.random() * 1.1,
        size,
        layer,
        alpha: 0.4 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.04 + Math.random() * 0.05,
        swingAmp: 1.0 + Math.random() * 1.5,
        swingSpeed: 0.02 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2,
        color: c.fill,
        colorAlt: c.alt,
        shapeType: Math.random() < 0.4 ? 1 : 0,
      }
    }

    function initParticles() {
      const count = 30
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

    function drawGoldDust(p: Particle) {
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

      const globalWind = Math.sin(currentTime * 0.0006) * 0.5

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.phase += p.swingSpeed
        p.wobble += p.wobbleSpeed
        p.rotation += p.rotationSpeed

        const swing = Math.sin(p.phase) * p.swingAmp
        p.x += (p.vx + swing + globalWind) * (dt * 60)
        p.y += p.vy * (dt * 60)

        if (effect === 'snow') drawSnowflake(p)
        else if (effect === 'leaves') drawLeaf(p)
        else if (effect === 'sakura') drawSakura(p)
        else if (effect === 'rose_petals') drawRosePetal(p)
        else if (effect === 'gold_dust') drawGoldDust(p)
        else if (effect === 'new_year') drawNewYear(p)
        else if (effect === 'halloween') drawHalloween(p)

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
  }, [effect])

  if (!effect || effect === 'none') {
    return (
      <div className={`w-full h-full grid place-items-center text-gray-500 text-xs ${className}`}>
        <span>Efecto desactivado (pantalla limpia)</span>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  )
}
