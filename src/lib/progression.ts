import type { Unit, Mission } from '@/types/content'
import type { UserProgress, AssessmentAttempt } from '@/types/progress'
import type { UnitStatus, MissionStatus } from '@/types/game'

// =====================
// Unit helpers
// =====================

export function isUnitUnlocked(
  unitId: string,
  progress: UserProgress,
  units: Unit[],
): boolean {
  const unit = units.find(u => u.id === unitId)
  if (!unit) return false

  // No prerequisite = always unlocked (beginner tier)
  if (!unit.prerequisiteUnitId) return true

  // Prerequisite unit's boss mission must be completed
  return progress.unitProgress[unit.prerequisiteUnitId]?.bossMissionCompleted === true
}

export function getUnitCompletion(
  unitId: string,
  progress: UserProgress,
  missions: Mission[],
): number {
  const unitMissions = missions.filter(m => m.unitId === unitId)
  if (unitMissions.length === 0) return 0

  const unitProg = progress.unitProgress[unitId]
  if (!unitProg) return 0

  const completedCount = unitMissions.filter(
    m => unitProg.missionProgress[m.id]?.completed === true,
  ).length

  return Math.round((completedCount / unitMissions.length) * 100)
}

export function getUnitStatus(
  unitId: string,
  progress: UserProgress,
  units: Unit[],
  missions: Mission[],
): UnitStatus {
  if (!isUnitUnlocked(unitId, progress, units)) return 'locked'

  const unitProg = progress.unitProgress[unitId]
  if (!unitProg) return 'available'

  if (unitProg.bossMissionCompleted) return 'completed'

  const completion = getUnitCompletion(unitId, progress, missions)
  if (completion > 0) return 'in-progress'

  return 'available'
}

// =====================
// Mission helpers
// =====================

export function isMissionUnlocked(
  missionId: string,
  unitId: string,
  progress: UserProgress,
  missions: Mission[],
): boolean {
  const unitMissions = missions
    .filter(m => m.unitId === unitId)
    .sort((a, b) => a.order - b.order)

  const missionIndex = unitMissions.findIndex(m => m.id === missionId)
  if (missionIndex < 0) return false

  // First mission in the unit is always unlocked (unit-level access checked separately)
  if (missionIndex === 0) return true

  // Later missions require the previous mission to be completed
  const previousMission = unitMissions[missionIndex - 1]
  return progress.unitProgress[unitId]?.missionProgress[previousMission.id]?.completed === true
}

export function getMissionStatus(
  missionId: string,
  unitId: string,
  progress: UserProgress,
  missions: Mission[],
  units: Unit[],
): MissionStatus {
  if (!isUnitUnlocked(unitId, progress, units)) return 'locked'

  if (!isMissionUnlocked(missionId, unitId, progress, missions)) return 'locked'

  const missionProg = progress.unitProgress[unitId]?.missionProgress[missionId]
  if (!missionProg) return 'available'
  if (missionProg.completed) return 'completed'
  return 'in-progress'
}

// =====================
// Scoring
// =====================

export function calculateScenarioScore(attempts: AssessmentAttempt[]): number {
  const passed = attempts.filter(a => a.passed)
  if (passed.length === 0) return 0

  const totalWeight = passed.reduce((sum, a) => sum + a.xpEarned, 0)
  if (totalWeight === 0) {
    // Fall back to simple average
    return Math.round(passed.reduce((sum, a) => sum + a.score, 0) / passed.length)
  }

  const weightedSum = passed.reduce((sum, a) => sum + a.score * a.xpEarned, 0)
  return Math.round(weightedSum / totalWeight)
}
