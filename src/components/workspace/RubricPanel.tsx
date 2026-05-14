import React from 'react'
import type { RubricItem } from '@/types/content'
import styles from './RubricPanel.module.css'

export interface RubricPanelProps {
  rubric: RubricItem[]
  results?: Array<{ id: string; passed: boolean }>
  className?: string
}

export function RubricPanel({ rubric, results, className }: RubricPanelProps) {
  if (!rubric?.length) return null

  const resultMap = new Map(results?.map(r => [r.id, r.passed]) ?? [])
  const totalWeight = rubric.reduce((sum, item) => sum + item.weight, 0)

  return (
    <div className={`${styles.panel} ${className ?? ''}`}>
      {rubric.map(item => {
        const hasResult = results !== undefined
        const passed = resultMap.get(item.id)

        let indicatorClass = styles['indicator--pending']
        let rowClass = `${styles.row} ${styles['row--pending']}`
        let indicatorContent = '–'

        if (hasResult) {
          if (passed) {
            indicatorClass = styles['indicator--pass']
            rowClass = `${styles.row} ${styles['row--pass']}`
            indicatorContent = '✓'
          } else {
            indicatorClass = styles['indicator--fail']
            rowClass = `${styles.row} ${styles['row--fail']}`
            indicatorContent = '✗'
          }
        }

        return (
          <div key={item.id} className={rowClass}>
            <div className={`${styles.indicator} ${indicatorClass}`}>
              {indicatorContent}
            </div>
            <div className={styles.meta}>
              <p className={styles.label}>{item.label}</p>
              {item.description && (
                <p className={styles.description}>{item.description}</p>
              )}
            </div>
            <span className={styles.weight}>×{item.weight}</span>
          </div>
        )
      })}
      <div className={styles.footer}>
        Total weight:&nbsp;<span className={styles.footerWeight}>{totalWeight}</span>
      </div>
    </div>
  )
}
