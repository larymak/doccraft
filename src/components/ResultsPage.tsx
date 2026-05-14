import React, { useEffect, useMemo, useState } from 'react'
import { Providers } from '@/context/Providers'
import { useApp } from '@/context/AppContext'
import { useGame } from '@/context/GameContext'
import { ScorePanel } from '@/components/game/ScorePanel'
import { BadgeDisplay } from '@/components/game/BadgeDisplay'
import { Confetti } from '@/components/ui/Confetti'
import { getProgress } from '@/lib/storage'
import { calculateScenarioScore } from '@/lib/progression'
import type { Mission, Unit } from '@/types/content'
import styles from './ResultsPage.module.css'

interface ResultsPageProps {
  missionId: string
  unitId: string
  unit: Unit
  mission: Mission
  allMissions: Mission[]
  allUnits: Unit[]
}

function ResultsInner({ missionId, unitId, unit, mission, allMissions, allUnits }: ResultsPageProps) {
  const { userProgress, isLoading, isOnboarded } = useApp()
  const { knowledgeDebt, earnedBadgeIds } = useGame()
  const [confettiActive, setConfettiActive] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setConfettiActive(false), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!isLoading && !isOnboarded) {
      window.location.href = '/onboarding'
    }
  }, [isLoading, isOnboarded])

  const missionProgress = useMemo(() => {
    const p = getProgress()
    return p?.unitProgress[unitId]?.missionProgress[missionId] ?? null
  }, [missionId, unitId])

  if (isLoading) {
    return (
      <div className={styles.spinner}>
        <div className={styles.spinnerRing} aria-label="Loading..." />
      </div>
    )
  }

  if (!userProgress) return null

  const attempts = missionProgress?.assessmentAttempts ?? []
  const scenarioScore = missionProgress?.scenarioScore ?? calculateScenarioScore(attempts)
  const totalDebtReduced = attempts.reduce((sum, a) => sum + a.debtReduced, 0)
  const totalXPEarned = attempts.reduce((sum, a) => sum + a.xpEarned, 0)

  // Compute trust/findability deltas from assessments
  const trustDelta = mission.assessments.reduce(
    (sum, a) => sum + (a.trustDelta ?? 0),
    0,
  )
  const findabilityDelta = mission.assessments.reduce(
    (sum, a) => sum + (a.findabilityDelta ?? 0),
    0,
  )

  // Badge: was unit boss mission just earned?
  const isBoss = mission.id === unit.bossMissionId
  const badgeJustEarned = isBoss && earnedBadgeIds.includes(unit.badge.id)

  // Feedback from passed assessment rubrics
  const feedback: string[] = []
  attempts.forEach(attempt => {
    const assessment = mission.assessments.find(a => a.id === attempt.assessmentId)
    if (assessment && attempt.passed) {
      feedback.push(`${assessment.title}: Completed successfully.`)
    } else if (assessment && !attempt.passed) {
      feedback.push(`${assessment.title}: Try again to improve your score.`)
    }
  })

  // "What you improved" — materials with trust/findability
  const improvedDocs = mission.materials.filter(
    d => d.trustScore < 80 || d.findabilityScore < 80,
  )

  // Next mission logic
  function getNextHref(): string {
    const unitMissions = allMissions
      .filter(m => m.unitId === unitId)
      .sort((a, b) => a.order - b.order)

    const idx = unitMissions.findIndex(m => m.id === missionId)
    const nextInUnit = unitMissions[idx + 1]
    if (nextInUnit) return `/mission/${nextInUnit.slug}`

    // Move to first mission of the next unit
    const currentUnitOrder = unit.order
    const nextUnit = allUnits
      .filter(u => u.order === currentUnitOrder + 1)[0]
    if (nextUnit) {
      const firstNextMission = allMissions
        .filter(m => m.unitId === nextUnit.id)
        .sort((a, b) => a.order - b.order)[0]
      if (firstNextMission) return `/mission/${firstNextMission.slug}`
    }

    return '/map'
  }

  return (
    <div className={styles.page}>
      <Confetti active={confettiActive} />
      <div className={styles.header}>
        <span className={styles.confetti}>&#127881;</span>
        <h1 className={styles.title}>Mission Complete!</h1>
        <p className={styles.missionName}>{mission.title}</p>
      </div>

      <div className={styles.scoreWrap}>
        <ScorePanel
          scenarioScore={scenarioScore}
          debtReduced={totalDebtReduced}
          xpEarned={totalXPEarned}
          trustDelta={trustDelta || undefined}
          findabilityDelta={findabilityDelta || undefined}
          badge={badgeJustEarned ? unit.badge : undefined}
        />
      </div>

      {badgeJustEarned && (
        <div className={styles.badgeUnlock}>
          <p className={styles.badgeUnlockTitle}>Badge Unlocked!</p>
          <BadgeDisplay badge={unit.badge} earned size="lg" />
        </div>
      )}

      {improvedDocs.length > 0 && (
        <div className={styles.improvedSection}>
          <h2 className={styles.sectionTitle}>Documents Improved</h2>
          <div className={styles.docImprovedList}>
            {improvedDocs.map(doc => (
              <div key={doc.id} className={styles.docImprovedCard}>
                <p className={styles.docName}>{doc.filename}</p>
                <div className={styles.deltaRow}>
                  <div className={styles.delta}>
                    Trust:{' '}
                    <span
                      className={[
                        styles.deltaVal,
                        trustDelta < 0 ? styles.negative : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {trustDelta >= 0 ? '+' : ''}
                      {trustDelta}
                    </span>
                  </div>
                  <div className={styles.delta}>
                    Findability:{' '}
                    <span
                      className={[
                        styles.deltaVal,
                        findabilityDelta < 0 ? styles.negative : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {findabilityDelta >= 0 ? '+' : ''}
                      {findabilityDelta}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback.length > 0 && (
        <div className={styles.feedbackSection}>
          <h2 className={styles.sectionTitle}>Written Feedback</h2>
          <div className={styles.feedbackList}>
            {feedback.map((f, idx) => (
              <div key={idx} className={styles.feedbackItem}>
                <span className={styles.feedbackIcon}>
                  {f.includes('successfully') ? '✓' : '○'}
                </span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <a href={getNextHref()} className={styles.primaryBtn}>
          Next Mission →
        </a>
        <a href="/map" className={styles.secondaryBtn}>
          Back to Map
        </a>
      </div>
    </div>
  )
}

export function ResultsPage(props: ResultsPageProps) {
  return (
    <Providers>
      <ResultsInner {...props} />
    </Providers>
  )
}
