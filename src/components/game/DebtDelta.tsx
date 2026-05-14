import React, { useEffect } from 'react'
import styles from './DebtDelta.module.css'

interface DebtDeltaProps {
  amount: number
  onComplete: () => void
}

export function DebtDelta({ amount, onComplete }: DebtDeltaProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className={styles.wrapper} aria-live="polite">
      <span className={styles.badge}>
        −{amount} debt
      </span>
    </div>
  )
}
