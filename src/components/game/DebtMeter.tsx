import React from 'react'
import { getDebtLevel } from '@/types/game'
import styles from './DebtMeter.module.css'

interface DebtMeterProps {
  debt: number
  compact?: boolean
  className?: string
}

export function DebtMeter({ debt, compact = false, className }: DebtMeterProps) {
  const level = getDebtLevel(debt)
  const segments = [
    { min: 0, max: 20, color: 'var(--debt-minimal)' },
    { min: 21, max: 40, color: 'var(--debt-low)' },
    { min: 41, max: 60, color: 'var(--debt-medium)' },
    { min: 61, max: 80, color: 'var(--debt-high)' },
    { min: 81, max: 100, color: 'var(--debt-critical)' },
  ]

  if (compact) {
    return (
      <div className={[styles.compact, className].filter(Boolean).join(' ')}>
        <div className={styles.compactBar}>
          <div
            className={styles.compactFill}
            style={{ width: `${debt}%`, backgroundColor: level.color }}
          />
        </div>
        <span className={styles.compactLabel} style={{ color: level.color }}>
          {debt}%
        </span>
      </div>
    )
  }

  return (
    <div className={[styles.meter, className].filter(Boolean).join(' ')}>
      <div className={styles.header}>
        <span className={styles.title}>Knowledge Debt</span>
        <span className={styles.levelLabel} style={{ color: level.color }}>
          {level.label}
        </span>
      </div>

      <div className={styles.segmentedBar} role="meter" aria-valuenow={debt} aria-valuemin={0} aria-valuemax={100} aria-label={`Knowledge debt: ${debt}%`}>
        {segments.map(seg => {
          const filled = Math.max(0, Math.min(100, debt) - seg.min)
          const segRange = seg.max - seg.min
          const fillPct = Math.min(filled / segRange, 1) * 100
          return (
            <div key={seg.min} className={styles.segment}>
              <div
                className={styles.segmentFill}
                style={{ width: `${fillPct}%`, backgroundColor: seg.color }}
              />
            </div>
          )
        })}
      </div>

      <div className={styles.footer}>
        <span className={styles.value}>{debt}%</span>
        <span className={styles.hint}>Reduce debt by completing missions</span>
      </div>
    </div>
  )
}
