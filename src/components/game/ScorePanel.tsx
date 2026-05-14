import React, { useEffect, useState } from 'react'
import type { Badge } from '@/types/content'
import { BadgeDisplay } from './BadgeDisplay'
import styles from './ScorePanel.module.css'

function useCountUp(target: number, duration = 1400, delay = 400): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame: number
    const startAt = Date.now() + delay
    const tick = () => {
      const now = Date.now()
      if (now < startAt) { frame = requestAnimationFrame(tick); return }
      const t = Math.min((now - startAt) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, delay])
  return value
}

interface MetricProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  positive?: boolean
  delay?: number
}

function Metric({ label, value, prefix = '', suffix = '', positive = true, delay = 0 }: MetricProps) {
  const isPositive = positive ? value > 0 : value < 0
  return (
    <div
      className={styles.metric}
      style={{ '--metric-delay': `${delay}ms` } as React.CSSProperties}
    >
      <span className={styles.metricLabel}>{label}</span>
      <span className={[styles.metricValue, isPositive ? styles.positive : styles.neutral].join(' ')}>
        {prefix}{value > 0 ? `+${value}` : value}{suffix}
      </span>
    </div>
  )
}

interface ScorePanelProps {
  scenarioScore: number
  debtReduced: number
  xpEarned: number
  trustDelta?: number
  findabilityDelta?: number
  badge?: Badge
  className?: string
}

export function ScorePanel({ scenarioScore, debtReduced, xpEarned, trustDelta, findabilityDelta, badge, className }: ScorePanelProps) {
  const displayScore = useCountUp(scenarioScore)
  const [popped, setPopped] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setPopped(true), 1400 + 400 + 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={[styles.panel, className].filter(Boolean).join(' ')}>
      <div className={styles.score}>
        <div className={[styles.scoreCircle, popped ? styles.scoreCirclePop : ''].filter(Boolean).join(' ')}>
          <span className={styles.scoreNumber}>{displayScore}</span>
          <span className={styles.scoreMax}>/100</span>
        </div>
        <p className={styles.scoreLabel}>Scenario Score</p>
      </div>

      <div className={styles.metrics}>
        <Metric label="Knowledge Debt" value={-debtReduced} suffix="%" positive={false} delay={200} />
        <Metric label="XP Earned" value={xpEarned} prefix="⚡ " delay={350} />
        {trustDelta !== undefined && trustDelta !== 0 && (
          <Metric label="Trust Score" value={trustDelta} suffix=" pts" delay={500} />
        )}
        {findabilityDelta !== undefined && findabilityDelta !== 0 && (
          <Metric label="Findability" value={findabilityDelta} suffix=" pts" delay={650} />
        )}
      </div>

      {badge && (
        <div className={styles.badgeWrap}>
          <p className={styles.badgeTitle}>🎉 Badge Unlocked!</p>
          <BadgeDisplay badge={badge} earned size="md" />
        </div>
      )}
    </div>
  )
}
