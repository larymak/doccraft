import React from 'react'
import styles from './ProgressBar.module.css'

export type ProgressBarColor = 'gold' | 'green' | 'blue' | 'red'
export type ProgressBarSize = 'sm' | 'md' | 'lg'

export interface ProgressBarProps {
  value: number
  color?: ProgressBarColor
  size?: ProgressBarSize
  label?: string
  showPercent?: boolean
  className?: string
}

export function ProgressBar({
  value,
  color = 'gold',
  size = 'md',
  label,
  showPercent = false,
  className = '',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {(label || showPercent) && (
        <div className={styles.meta}>
          {label && <span className={styles.label}>{label}</span>}
          {showPercent && <span className={styles.percent}>{clamped}%</span>}
        </div>
      )}
      <div
        className={[styles.track, styles[`track--${size}`]].join(' ')}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={[styles.fill, styles[`fill--${color}`]].join(' ')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
