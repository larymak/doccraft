import React, { useEffect, useRef } from 'react'
import { Providers } from '@/context/Providers'
import { useApp } from '@/context/AppContext'
import { useGame } from '@/context/GameContext'
import { DebtMeter } from '@/components/game/DebtMeter'
import { UnitCard } from '@/components/game/UnitCard'
import { getUnitCompletion, getUnitStatus, isUnitUnlocked } from '@/lib/progression'
import type { Unit, Mission, Tier } from '@/types/content'
import styles from './MapPage.module.css'

interface MapPageProps {
  units: Unit[]
  missions: Mission[]
}

const TIERS: { id: Tier; label: string; emoji: string; unlockHint: string }[] = [
  { id: 'beginner',     label: 'Beginner',     emoji: '🌱', unlockHint: '' },
  { id: 'intermediate', label: 'Intermediate', emoji: '🔧', unlockHint: 'Complete both Beginner units to unlock' },
  { id: 'advanced',     label: 'Advanced',     emoji: '⚡', unlockHint: 'Complete Unit 5 to unlock' },
  { id: 'pro',          label: 'Pro',          emoji: '🏆', unlockHint: 'Complete Unit 8 to unlock' },
]

function MapInner({ units, missions }: MapPageProps) {
  const { userProgress, isLoading, isOnboarded } = useApp()
  const { knowledgeDebt } = useGame()
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoading && !isOnboarded) {
      window.location.href = '/onboarding'
    }
  }, [isLoading, isOnboarded])

  useEffect(() => {
    if (!userProgress) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add(styles.visible); observer.unobserve(e.target) }
      }),
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' },
    )
    pageRef.current?.querySelectorAll(`.${styles.tierReveal}`).forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [userProgress])

  if (isLoading) {
    return (
      <div className={styles.spinner}>
        <div className={styles.spinnerRing} aria-label="Loading..." />
      </div>
    )
  }

  if (!userProgress) return null

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Mission Map</h1>
          <p className={styles.subtitle}>
            Progress through four tiers — from Beginner to Pro.
          </p>
        </div>
        <div className={styles.debtCompact}>
          <DebtMeter debt={knowledgeDebt} compact />
        </div>
      </div>

      <div className={styles.tiers}>
        {TIERS.map(tier => {
          const tierUnits = units.filter(u => u.tier === tier.id)
          if (tierUnits.length === 0) return null

          const tierUnlocked = tierUnits.some(u =>
            isUnitUnlocked(u.id, userProgress, units),
          )

          return (
            <div key={tier.id} className={[styles.tier, styles.tierReveal, !tierUnlocked ? styles.tierLocked : ''].filter(Boolean).join(' ')}>
              <div className={styles.tierHeader}>
                <div className={styles.tierLabel}>
                  <span className={styles.tierEmoji}>{tier.emoji}</span>
                  <span className={styles.tierName}>{tier.label}</span>
                  <span className={styles.tierCount}>{tierUnits.length} units</span>
                </div>
                {!tierUnlocked && tier.unlockHint && (
                  <span className={styles.tierLockHint}>🔒 {tier.unlockHint}</span>
                )}
              </div>

              <div className={styles.unitRow}>
                {tierUnits.map(unit => {
                  const unitMissions = missions.filter(m => m.unitId === unit.id)
                  const status = getUnitStatus(unit.id, userProgress, units, missions)
                  const completionPct = getUnitCompletion(unit.id, userProgress, missions)
                  const unitProgress = userProgress.unitProgress[unit.id]

                  return (
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      unitProgress={unitProgress}
                      status={status}
                      missions={unitMissions}
                      userProgress={userProgress}
                      allUnits={units}
                      completionPct={completionPct}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MapPage(props: MapPageProps) {
  return (
    <Providers>
      <MapInner {...props} />
    </Providers>
  )
}
