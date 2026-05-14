import React, { useEffect } from 'react'
import { Providers } from '@/context/Providers'
import { useApp } from '@/context/AppContext'
import { useGame } from '@/context/GameContext'
import { DebtMeter } from '@/components/game/DebtMeter'
import { BadgeDisplay } from '@/components/game/BadgeDisplay'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getUnitCompletion, getUnitStatus, isUnitUnlocked } from '@/lib/progression'
import type { Unit, Mission } from '@/types/content'
import styles from './DashboardPage.module.css'

interface DashboardPageProps {
  units: Unit[]
  missions: Mission[]
}

function DashboardInner({ units, missions }: DashboardPageProps) {
  const { userProgress, isLoading, isOnboarded } = useApp()
  const { knowledgeDebt, totalXP } = useGame()

  useEffect(() => {
    if (!isLoading && !isOnboarded) {
      window.location.href = '/onboarding'
    }
  }, [isLoading, isOnboarded])

  if (isLoading) {
    return (
      <div className={styles.spinner}>
        <div className={styles.spinnerRing} aria-label="Loading..." />
      </div>
    )
  }

  if (!userProgress) return null

  const name = userProgress.profile.name
  const streak = userProgress.streakDays
  const currentMissionId = userProgress.currentMissionId

  const completedMissionsCount = Object.values(userProgress.unitProgress).reduce(
    (sum, up) =>
      sum + Object.values(up.missionProgress).filter(mp => mp.completed).length,
    0,
  )

  const currentUnit = units.find(u => u.id === userProgress.currentUnitId)

  const earnedBadges = units
    .map(u => u.badge)
    .filter(b => userProgress.earnedBadgeIds.includes(b.id))

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div className={styles.welcome}>
          <h1 className={styles.welcomeTitle}>
            Welcome back, <span>{name}</span>
          </h1>
          <span className={styles.streakBadge}>
            &#128293; {streak} day{streak !== 1 ? 's' : ''} streak
          </span>
        </div>
      </div>

      <div className={styles.debtSection}>
        <h2 className={styles.sectionTitle}>Knowledge Debt</h2>
        <DebtMeter debt={knowledgeDebt} />
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total XP</span>
          <span className={styles.statValue}>{totalXP.toLocaleString()}</span>
          <span className={styles.statSub}>experience points</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Current Unit</span>
          <span className={styles.statValue}>{currentUnit?.order ?? '—'}</span>
          <span className={styles.statSub}>{currentUnit?.title ?? 'Not started'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Missions Done</span>
          <span className={styles.statValue}>{completedMissionsCount}</span>
          <span className={styles.statSub}>of {missions.length} total</span>
        </div>
      </div>

      <div className={styles.continueRow}>
        <a href={`/mission/${currentMissionId}`} className={styles.continueBtn}>
          Continue Learning &rarr;
        </a>
      </div>

      <div className={styles.grid2}>
        <div className={styles.badgesSection}>
          <h2 className={styles.sectionTitle}>Badges Earned</h2>
          {earnedBadges.length === 0 ? (
            <p className={styles.noBadges}>Complete boss missions to earn badges.</p>
          ) : (
            <div className={styles.badgeGrid}>
              {earnedBadges.map(badge => (
                <BadgeDisplay key={badge.id} badge={badge} earned size="sm" />
              ))}
            </div>
          )}
        </div>

        <div className={styles.unitsSection}>
          <h2 className={styles.sectionTitle}>Unit Progress</h2>
          <div className={styles.unitProgressList}>
            {units.map(unit => {
              const unlocked = isUnitUnlocked(unit.id, userProgress, units)
              const pct = unlocked
                ? getUnitCompletion(unit.id, userProgress, missions)
                : 0
              const status = getUnitStatus(unit.id, userProgress, units, missions)

              return (
                <div key={unit.id} className={styles.unitProgressItem}>
                  <div className={styles.unitProgressHeader}>
                    <span className={styles.unitProgressName}>
                      {unit.order}. {unit.title}
                    </span>
                    {unlocked ? (
                      <span className={styles.unitProgressPct}>{pct}%</span>
                    ) : (
                      <span className={styles.unitProgressLocked}>locked</span>
                    )}
                  </div>
                  {unlocked && (
                    <ProgressBar
                      value={pct}
                      color={status === 'completed' ? 'green' : 'gold'}
                      size="sm"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage(props: DashboardPageProps) {
  return (
    <Providers>
      <DashboardInner {...props} />
    </Providers>
  )
}
