import React from 'react'
import styles from './Badge.module.css'

export type BadgeVariant = 'default' | 'success' | 'danger' | 'info' | 'status'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', size = 'md', children, className = '' }: BadgeProps) {
  const cls = [styles.badge, styles[`badge--${variant}`], styles[`badge--${size}`], className]
    .filter(Boolean)
    .join(' ')

  return <span className={cls}>{children}</span>
}
