import React from 'react'
import type { Badge } from '@/types/content'
import styles from './BadgeDisplay.module.css'

const BADGE_ICONS: Record<string, string> = {
  'chaos-tamer': '🔍',
  'doc-classifier': '🗂️',
  'audience-advocate': '👥',
  'template-architect': '🏗️',
  'search-fixer': '🔎',
  'metadata-master': '🏷️',
  'markdown-maintainer': '⚙️',
  'governance-planner': '📋',
  'adr-historian': '📜',
  'knowledge-lead': '🏆',
}

interface BadgeDisplayProps {
  badge: Badge
  earned: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BadgeDisplay({ badge, earned, size = 'md', className }: BadgeDisplayProps) {
  const icon = BADGE_ICONS[badge.iconSlug] ?? '🎖️'

  return (
    <div
      className={[styles.badge, styles[size], earned ? styles.earned : styles.locked, className].filter(Boolean).join(' ')}
      title={earned ? badge.description : `Locked: ${badge.earnedCondition}`}
    >
      <div className={styles.icon} style={earned ? { backgroundColor: badge.color + '22', borderColor: badge.color } : {}}>
        {earned ? <span className={styles.emoji}>{icon}</span> : <span className={styles.lock}>🔒</span>}
      </div>
      <div className={styles.info}>
        <p className={styles.label}>{badge.label}</p>
        {size !== 'sm' && (
          <p className={styles.desc}>{earned ? badge.description : badge.earnedCondition}</p>
        )}
      </div>
    </div>
  )
}
