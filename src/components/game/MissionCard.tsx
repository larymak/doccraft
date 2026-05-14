import React from 'react'
import type { Mission } from '@/types/content'
import type { MissionStatus } from '@/types/game'
import styles from './MissionCard.module.css'

interface MissionCardProps {
  mission: Mission
  status: MissionStatus
}

const STATUS_ICON: Record<MissionStatus, string> = {
  locked: '🔒',
  available: '▶',
  'in-progress': '⏳',
  completed: '✓',
}

export function MissionCard({ mission, status }: MissionCardProps) {
  const isClickable = status !== 'locked'
  const href = isClickable ? `/mission/${mission.slug}` : undefined

  const content = (
    <div className={[styles.card, styles[status.replace('-', '_') as keyof typeof styles]].join(' ')}>
      <span className={[styles.icon, status === 'completed' ? styles.iconDone : status === 'locked' ? styles.iconLock : styles.iconPlay].join(' ')}>
        {STATUS_ICON[status]}
      </span>
      <div className={styles.info}>
        <p className={styles.title}>{mission.title}</p>
        <p className={styles.meta}>~{mission.estimatedMinutes} min</p>
      </div>
      {status === 'in-progress' && <span className={styles.inProgressBadge}>In Progress</span>}
    </div>
  )

  if (href) {
    return <a href={href} className={styles.link}>{content}</a>
  }
  return content
}
