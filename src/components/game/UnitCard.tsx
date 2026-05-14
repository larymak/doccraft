import React from 'react'
import type { Unit, Mission } from '@/types/content'
import type { UnitProgress } from '@/types/progress'
import type { UnitStatus } from '@/types/game'
import type { UserProgress } from '@/types/progress'
import { ProgressBar } from '@/components/ui/ProgressBar'
import styles from './UnitCard.module.css'

const BADGE_ICONS: Record<string, string> = {
  'chaos-tamer': '🔍', 'doc-classifier': '🗂️', 'audience-advocate': '👥',
  'template-architect': '🏗️', 'search-fixer': '🔎', 'metadata-master': '🏷️',
  'markdown-maintainer': '⚙️', 'governance-planner': '📋', 'adr-historian': '📜',
  'knowledge-lead': '🏆',
}

const TIER_COLOR: Record<string, string> = {
  beginner: '#34d399', intermediate: '#60a5fa', advanced: '#a78bfa', pro: '#f1be32',
}

interface UnitCardProps {
  unit: Unit
  unitProgress: UnitProgress | undefined
  status: UnitStatus
  missions: Mission[]
  userProgress: UserProgress
  allUnits: Unit[]
  completionPct: number
}

export function UnitCard({ unit, unitProgress, status, missions, completionPct }: UnitCardProps) {
  const isLocked = status === 'locked'
  const isCompleted = status === 'completed'
  const icon = BADGE_ICONS[unit.badge.iconSlug] ?? '📄'
  const tierColor = TIER_COLOR[unit.tier ?? 'beginner']

  const cardInner = (
    <div className={[
      styles.card,
      isLocked ? styles.locked : '',
      isCompleted ? styles.completed : '',
    ].filter(Boolean).join(' ')}>

      <div className={styles.header}>
        <div
          className={styles.unitNum}
          style={isCompleted ? { background: `${tierColor}20`, color: tierColor, borderColor: `${tierColor}40` } : undefined}
        >
          {isLocked ? '🔒' : isCompleted ? '✓' : unit.order}
        </div>

        <div className={styles.meta}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{unit.title}</h3>
            {isCompleted && unitProgress?.badgeEarned && (
              <span className={styles.badgePip} title={unit.badge.label} style={{ borderColor: unit.badge.color }}>
                {icon}
              </span>
            )}
          </div>
          <p className={styles.desc}>{unit.description.slice(0, 95)}…</p>
          <div className={styles.stats}>
            <span className={styles.stat}>{missions.length} missions</span>
            <span className={styles.stat}>⚡ {unit.totalXP} XP</span>
            {!isLocked && <span className={styles.stat}>{completionPct}% complete</span>}
          </div>
          {!isLocked && (
            <ProgressBar value={completionPct} color={isCompleted ? 'green' : 'gold'} size="sm" />
          )}
        </div>

        {!isLocked && <span className={styles.arrow} aria-hidden>→</span>}
      </div>
    </div>
  )

  if (isLocked) return cardInner

  return (
    <a href={`/unit/${unit.id}`} className={styles.link}>
      {cardInner}
    </a>
  )
}
