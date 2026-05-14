import React, { useEffect, useRef } from 'react'
import { Providers } from '@/context/Providers'
import { useApp } from '@/context/AppContext'
import { getMissionStatus, getUnitStatus } from '@/lib/progression'
import type { Unit, Mission, ContentBlock } from '@/types/content'
import styles from './UnitIntroPage.module.css'

const TIER_META: Record<string, { emoji: string; label: string; color: string }> = {
  beginner:     { emoji: '🌱', label: 'Beginner',     color: '#34d399' },
  intermediate: { emoji: '🔧', label: 'Intermediate', color: '#60a5fa' },
  advanced:     { emoji: '⚡', label: 'Advanced',     color: '#a78bfa' },
  pro:          { emoji: '🏆', label: 'Pro',          color: '#f1be32' },
}

const BLOCK_ICONS: Record<string, string> = {
  tip: '💡', warning: '⚠️', info: 'ℹ️', success: '✅',
}

function ContentBlockCard({ block }: { block: ContentBlock }) {
  if (block.type === 'text') {
    return (
      <div className={styles.blockText}>
        <p>{block.content}</p>
      </div>
    )
  }
  if (block.type === 'callout') {
    const icon = BLOCK_ICONS[block.variant ?? 'info'] ?? 'ℹ️'
    return (
      <div className={[styles.blockCallout, styles[`callout_${block.variant ?? 'info'}`]].join(' ')}>
        <span className={styles.calloutIcon}>{icon}</span>
        <p>{block.content}</p>
      </div>
    )
  }
  if (block.type === 'example') {
    return (
      <div className={styles.blockExample}>
        {block.label && <p className={styles.exampleLabel}>{block.label}</p>}
        <pre className={styles.exampleCode}>{block.content}</pre>
      </div>
    )
  }
  return null
}

interface UnitIntroPageProps {
  unit: Unit
  missions: Mission[]
  allUnits: Unit[]
  allMissions: Mission[]
}

function UnitIntroInner({ unit, missions, allUnits, allMissions }: UnitIntroPageProps) {
  const { userProgress, isLoading, isOnboarded } = useApp()
  const revealRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoading && !isOnboarded) {
      window.location.href = '/onboarding'
    }
  }, [isLoading, isOnboarded])

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add(styles.visible); observer.unobserve(e.target) }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' },
    )
    revealRef.current?.querySelectorAll(`.${styles.reveal}`).forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  if (isLoading) {
    return (
      <div className={styles.spinner}>
        <div className={styles.spinnerRing} aria-label="Loading…" />
      </div>
    )
  }

  if (!userProgress) return null

  const unitStatus = getUnitStatus(unit.id, userProgress, allUnits, allMissions)
  const isLocked = unitStatus === 'locked'
  const tier = TIER_META[unit.tier ?? 'beginner']

  const sortedMissions = [...missions].sort((a, b) => a.order - b.order)
  const firstAvailable = sortedMissions.find(m => {
    const s = getMissionStatus(m.id, m.unitId, userProgress, allMissions, allUnits)
    return s === 'available' || s === 'in-progress'
  }) ?? sortedMissions[0]

  // All objectives from all missions in this unit
  const allObjectives = sortedMissions.flatMap(m => m.objectives).slice(0, 8)

  return (
    <div className={styles.page} ref={revealRef}>

      {/* ── Back link ── */}
      <a href="/map" className={styles.backLink}>← Mission Map</a>

      {/* ── Hero ── */}
      <div className={`${styles.hero} ${styles.reveal}`}>
        <div className={styles.tierBadge} style={{ background: `${tier.color}18`, color: tier.color, borderColor: `${tier.color}40` }}>
          <span>{tier.emoji}</span>
          <span>{tier.label}</span>
        </div>
        <div className={styles.unitNum}>Unit {unit.order}</div>
        <h1 className={styles.heroTitle}>{unit.title}</h1>
        <p className={styles.heroDesc}>{unit.description}</p>
        <div className={styles.heroMeta}>
          <span>🎯 {missions.length} missions</span>
          <span className={styles.metaDot}>·</span>
          <span>⚡ {unit.totalXP} XP</span>
          <span className={styles.metaDot}>·</span>
          <span>🏅 {unit.badge.label}</span>
        </div>
      </div>

      {/* ── Goal ── */}
      <div className={`${styles.goalCard} ${styles.reveal}`}>
        <div className={styles.goalIconWrap}>
          <span className={styles.goalIcon}>🎯</span>
        </div>
        <div>
          <p className={styles.goalLabel}>Unit Goal</p>
          <p className={styles.goalText}>{unit.goal}</p>
        </div>
      </div>

      {/* ── What you'll learn ── */}
      {allObjectives.length > 0 && (
        <div className={`${styles.section} ${styles.reveal}`}>
          <h2 className={styles.sectionTitle}>What you'll learn</h2>
          <div className={styles.objectivesGrid}>
            {allObjectives.map((obj, i) => (
              <div key={i} className={styles.objectiveChip}>
                <span className={styles.objectiveCheck}>✓</span>
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Content blocks ── */}
      {unit.contentBlocks && unit.contentBlocks.length > 0 && (
        <div className={`${styles.section} ${styles.reveal}`}>
          <h2 className={styles.sectionTitle}>Background reading</h2>
          <div className={styles.contentBlocks}>
            {unit.contentBlocks.map((block, i) => (
              <ContentBlockCard key={i} block={block} />
            ))}
          </div>
        </div>
      )}

      {/* ── Missions ── */}
      <div className={`${styles.section} ${styles.reveal}`}>
        <h2 className={styles.sectionTitle}>Missions in this unit</h2>
        <div className={styles.missionList}>
          {sortedMissions.map((m, i) => {
            const mStatus = getMissionStatus(m.id, m.unitId, userProgress, allMissions, allUnits)
            const isBoss = m.id === unit.bossMissionId
            const clickable = mStatus !== 'locked'

            const inner = (
              <div className={[
                styles.missionRow,
                mStatus === 'completed' ? styles.missionDone : '',
                mStatus === 'locked' ? styles.missionLocked : '',
                isBoss ? styles.missionBoss : '',
              ].filter(Boolean).join(' ')}>
                <div className={[
                  styles.missionBullet,
                  mStatus === 'completed' ? styles.bulletDone : mStatus === 'locked' ? styles.bulletLock : styles.bulletPlay,
                ].join(' ')}>
                  {mStatus === 'completed' ? '✓' : mStatus === 'locked' ? '🔒' : i + 1}
                </div>
                <div className={styles.missionInfo}>
                  <div className={styles.missionTitleRow}>
                    <span className={styles.missionTitle}>{m.title}</span>
                    {isBoss && <span className={styles.bossBadge}>Boss</span>}
                  </div>
                  <div className={styles.missionMeta}>
                    ~{m.estimatedMinutes} min · {m.assessments.length} tasks
                  </div>
                </div>
                {mStatus === 'in-progress' && <span className={styles.inProgressTag}>In Progress</span>}
                {clickable && <span className={styles.missionArrow}>→</span>}
              </div>
            )

            return clickable
              ? <a key={m.id} href={`/mission/${m.slug}`} className={styles.missionLink}>{inner}</a>
              : <div key={m.id}>{inner}</div>
          })}
        </div>
      </div>

      {/* ── CTA ── */}
      {!isLocked && firstAvailable && (
        <div className={`${styles.ctaWrap} ${styles.reveal}`}>
          <a href={`/mission/${firstAvailable.slug}`} className={styles.ctaBtn}>
            {unitStatus === 'completed' ? 'Review Unit →' : unitStatus === 'in-progress' ? 'Continue Unit →' : 'Start Unit →'}
          </a>
          <a href="/map" className={styles.ctaSecondary}>Back to Map</a>
        </div>
      )}

      {isLocked && (
        <div className={`${styles.lockedBanner} ${styles.reveal}`}>
          🔒 Complete the previous unit to unlock this one.
          <a href="/map" className={styles.ctaSecondary}>Back to Map</a>
        </div>
      )}

    </div>
  )
}

export function UnitIntroPage(props: UnitIntroPageProps) {
  return (
    <Providers>
      <UnitIntroInner {...props} />
    </Providers>
  )
}
