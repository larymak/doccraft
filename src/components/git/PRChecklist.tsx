import React, { useState, useEffect } from 'react'
import styles from './PRChecklist.module.css'

interface PRChecklistProps {
  items: string[]
  onAllChecked: () => void
}

export function PRChecklist({ items, onAllChecked }: PRChecklistProps) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false))
  const allChecked = checked.every(Boolean)
  const checkedCount = checked.filter(Boolean).length
  const pct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0

  useEffect(() => {
    if (allChecked && items.length > 0) {
      onAllChecked()
    }
  }, [allChecked, items.length, onAllChecked])

  function toggle(idx: number) {
    setChecked(prev => {
      const next = [...prev]
      next[idx] = !next[idx]
      return next
    })
  }

  return (
    <div className={styles.checklist}>
      {items.map((item, idx) => (
        <label
          key={idx}
          className={[styles.item, checked[idx] ? styles.checked : ''].filter(Boolean).join(' ')}
        >
          <span className={styles.checkboxWrapper}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={checked[idx]}
              onChange={() => toggle(idx)}
            />
          </span>
          <span className={styles.itemText}>{item}</span>
        </label>
      ))}

      <div className={styles.progressRow}>
        <span>{checkedCount} / {items.length} checked</span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span>{pct}%</span>
      </div>

      {allChecked && items.length > 0 && (
        <div className={styles.readyBanner} role="status">
          <span className={styles.readyIcon}>&#10003;</span>
          <span className={styles.readyText}>Ready to merge</span>
        </div>
      )}
    </div>
  )
}
