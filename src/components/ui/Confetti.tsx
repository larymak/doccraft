import React, { useMemo } from 'react'
import styles from './Confetti.module.css'

const COLORS = [
  '#f1be32', '#ffd700',
  '#00471b', '#2ecc71',
  '#4a90d9', '#5dade2',
  '#e74c3c', '#e91e63',
  '#9b59b6', '#f39c12',
]

interface Particle {
  id: number
  x: number
  color: string
  size: number
  delay: number
  duration: number
  rotation: number
  drift: number
  isSquare: boolean
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 7 + Math.random() * 9,
    delay: Math.random() * 0.8,
    duration: 1.4 + Math.random() * 1.0,
    rotation: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540),
    drift: (Math.random() - 0.5) * 120,
    isSquare: Math.random() > 0.55,
  }))
}

interface ConfettiProps {
  active: boolean
  count?: number
}

export function Confetti({ active, count = 70 }: ConfettiProps) {
  const particles = useMemo(() => makeParticles(count), [count])

  if (!active) return null

  return (
    <div className={styles.wrapper} aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isSquare ? '2px' : '50%',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--rotation': `${p.rotation}deg`,
            '--drift': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
