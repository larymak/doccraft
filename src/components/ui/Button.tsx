import React from 'react'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  href?: string
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  href,
  type = 'button',
  children,
  className = '',
  fullWidth = false,
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[`btn--${variant}`],
    styles[`btn--${size}`],
    fullWidth ? styles['btn--full'] : '',
    loading ? styles['btn--loading'] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const isDisabled = disabled || loading

  if (href && !isDisabled) {
    return (
      <a href={href} className={cls} onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}>
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        <span className={loading ? styles['btn__label--loading'] : ''}>{children}</span>
      </a>
    )
  }

  return (
    <button type={type} className={cls} disabled={isDisabled} onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={loading ? styles['btn__label--loading'] : ''}>{children}</span>
    </button>
  )
}
