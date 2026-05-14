import React from 'react'
import styles from './Card.module.css'

export type CardVariant = 'default' | 'dark' | 'workspace' | 'mission'
export type CardPadding = 'sm' | 'md' | 'lg'

export interface CardProps {
  variant?: CardVariant
  padding?: CardPadding
  children: React.ReactNode
  className?: string
}

export function Card({ variant = 'dark', padding = 'md', children, className = '' }: CardProps) {
  const cls = [
    styles.card,
    styles[`card--${variant}`],
    styles[`card--pad-${padding}`],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={cls}>{children}</div>
}
