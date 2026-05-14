/**
 * scoring.ts
 *
 * Higher-level scoring functions used by assessment components.
 * These operate on already-loaded data (attempts and assessments passed as
 * props or from context) and contain no async logic.
 */

import type { AssessmentAttempt } from '@/types/progress'
import type { Assessment } from '@/types/content'

// =====================================================================
// calculateScenarioScore
// =====================================================================

/**
 * Given a list of assessment attempts for a mission, calculate the overall
 * scenario score as a weighted average by xpEarned.
 *
 * Only passed attempts are included. Falls back to a simple average if all
 * xpEarned values are zero. Returns 0 when there are no passed attempts.
 */
export function calculateScenarioScore(attempts: AssessmentAttempt[]): number {
  const passed = attempts.filter(a => a.passed)
  if (passed.length === 0) return 0

  const totalWeight = passed.reduce((sum, a) => sum + a.xpEarned, 0)

  if (totalWeight === 0) {
    // Fallback: simple average of passed attempt scores
    const avg = passed.reduce((sum, a) => sum + a.score, 0) / passed.length
    return Math.round(avg)
  }

  const weightedSum = passed.reduce((sum, a) => sum + a.score * a.xpEarned, 0)
  return Math.round(weightedSum / totalWeight)
}

// =====================================================================
// isMissionPassed
// =====================================================================

/**
 * Determine whether a mission is "passed".
 *
 * A mission is considered passed when every required assessment has a
 * corresponding attempt that either:
 *   - has `passed === true`, OR
 *   - has a score >= that assessment's `masteryThreshold`
 *
 * Assessments with no matching attempt are treated as not passed.
 * An empty assessments array means the mission is trivially passed.
 */
export function isMissionPassed(
  attempts: AssessmentAttempt[],
  assessments: Assessment[],
): boolean {
  if (assessments.length === 0) return true

  // Build a quick lookup: assessmentId → best attempt
  const attemptByAssessment = new Map<string, AssessmentAttempt>()
  for (const attempt of attempts) {
    const existing = attemptByAssessment.get(attempt.assessmentId)
    // Keep the attempt with the highest score for each assessment
    if (!existing || attempt.score > existing.score) {
      attemptByAssessment.set(attempt.assessmentId, attempt)
    }
  }

  return assessments.every(assessment => {
    const best = attemptByAssessment.get(assessment.id)
    if (!best) return false
    return best.passed || best.score >= assessment.masteryThreshold
  })
}

// =====================================================================
// getTotalXPFromAttempts
// =====================================================================

/**
 * Sum the XP earned across all provided attempts.
 * Returns 0 for an empty list.
 */
export function getTotalXPFromAttempts(attempts: AssessmentAttempt[]): number {
  if (attempts.length === 0) return 0
  return attempts.reduce((sum, a) => sum + a.xpEarned, 0)
}

// =====================================================================
// getTotalDebtReduced
// =====================================================================

/**
 * Sum the debt reduced across all provided attempts.
 * Returns 0 for an empty list.
 */
export function getTotalDebtReduced(attempts: AssessmentAttempt[]): number {
  if (attempts.length === 0) return 0
  return attempts.reduce((sum, a) => sum + a.debtReduced, 0)
}
