import React from 'react'
import styles from './Tooltip.module.css'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content: string
  position?: TooltipPosition
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, position = 'top', children, className = '' }: TooltipProps) {
  return (
    <span
      className={[styles.wrapper, className].filter(Boolean).join(' ')}
      data-tooltip={content}
      data-position={position}
    >
      {children}
      <span
        className={[styles.tip, styles[`tip--${position}`]].join(' ')}
        role="tooltip"
        aria-hidden="true"
      >
        {content}
      </span>
    </span>
  )
}
