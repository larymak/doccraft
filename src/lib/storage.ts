import type { UserProgress, MissionProgress, UnitProgress, AssessmentAttempt } from '@/types/progress'

const STORAGE_KEY = 'doccraft_progress'

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

// =====================
// Core CRUD
// =====================

export function getProgress(): UserProgress | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserProgress
  } catch {
    return null
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage may be full or unavailable — fail silently
  }
}

export function clearProgress(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// =====================
// Initialization
// =====================

export function initProgress(name: string): UserProgress {
  const now = new Date().toISOString()
  const progress: UserProgress = {
    userId: generateId(),
    profile: {
      name,
      createdAt: now,
    },
    knowledgeDebt: 100,
    totalXP: 0,
    currentUnitId: 'unit-01',
    currentMissionId: 'u01-m01',
    unitProgress: {},
    earnedBadgeIds: [],
    docStates: {},
    lastActiveDate: now.slice(0, 10),
    streakDays: 1,
  }
  saveProgress(progress)
  return progress
}

// =====================
// Mission lifecycle
// =====================

export function startMission(missionId: string, unitId: string): void {
  const progress = getProgress()
  if (!progress) return

  // Ensure unit progress exists
  if (!progress.unitProgress[unitId]) {
    progress.unitProgress[unitId] = {
      unitId,
      startedAt: new Date().toISOString(),
      missionProgress: {},
      bossMissionCompleted: false,
      badgeEarned: false,
    }
  }

  // Only create if not already started
  if (!progress.unitProgress[unitId].missionProgress[missionId]) {
    progress.unitProgress[unitId].missionProgress[missionId] = {
      missionId,
      unitId,
      startedAt: new Date().toISOString(),
      assessmentAttempts: [],
      scenarioScore: 0,
      completed: false,
      gitSimCompleted: false,
    }
  }

  progress.currentUnitId = unitId
  progress.currentMissionId = missionId
  saveProgress(progress)
}

export function recordAssessmentAttempt(
  missionId: string,
  unitId: string,
  attempt: AssessmentAttempt,
): void {
  const progress = getProgress()
  if (!progress) return

  const unit = progress.unitProgress[unitId]
  if (!unit) return

  const mission = unit.missionProgress[missionId]
  if (!mission) return

  mission.assessmentAttempts.push(attempt)
  saveProgress(progress)
}

export function completeMission(
  missionId: string,
  unitId: string,
  scenarioScore: number,
): void {
  const progress = getProgress()
  if (!progress) return

  const unit = progress.unitProgress[unitId]
  if (!unit) return

  const mission = unit.missionProgress[missionId]
  if (!mission) return

  mission.scenarioScore = scenarioScore
  mission.completed = true
  mission.completedAt = new Date().toISOString()
  saveProgress(progress)
}

export function setGitSimComplete(missionId: string, unitId: string): void {
  const progress = getProgress()
  if (!progress) return

  const unit = progress.unitProgress[unitId]
  if (!unit) return

  const mission = unit.missionProgress[missionId]
  if (!mission) return

  mission.gitSimCompleted = true
  saveProgress(progress)
}

export function completeBossMission(unitId: string, badgeId: string): void {
  const progress = getProgress()
  if (!progress) return

  const unit = progress.unitProgress[unitId]
  if (!unit) return

  unit.bossMissionCompleted = true
  unit.completedAt = new Date().toISOString()

  if (!progress.earnedBadgeIds.includes(badgeId)) {
    progress.earnedBadgeIds.push(badgeId)
    unit.badgeEarned = true
  }

  saveProgress(progress)
}

// =====================
// Debt & XP
// =====================

export function reduceDebt(amount: number): void {
  const progress = getProgress()
  if (!progress) return
  progress.knowledgeDebt = Math.max(0, progress.knowledgeDebt - amount)
  saveProgress(progress)
}

export function addXP(amount: number): void {
  const progress = getProgress()
  if (!progress) return
  progress.totalXP += amount
  saveProgress(progress)
}

// =====================
// Doc state
// =====================

export function updateDocState(
  docId: string,
  trustDelta: number,
  findabilityDelta: number,
): void {
  const progress = getProgress()
  if (!progress) return

  const existing = progress.docStates[docId]
  if (existing) {
    existing.trustScore = Math.min(100, Math.max(0, existing.trustScore + trustDelta))
    existing.findabilityScore = Math.min(
      100,
      Math.max(0, existing.findabilityScore + findabilityDelta),
    )
  } else {
    progress.docStates[docId] = {
      docId,
      trustScore: Math.min(100, Math.max(0, 50 + trustDelta)),
      findabilityScore: Math.min(100, Math.max(0, 50 + findabilityDelta)),
      editHistory: [],
    }
  }

  saveProgress(progress)
}

// =====================
// Streak
// =====================

export function updateStreak(): number {
  const progress = getProgress()
  if (!progress) return 0

  const today = new Date().toISOString().slice(0, 10)
  const last = progress.lastActiveDate

  if (last === today) {
    // Already counted today
    return progress.streakDays
  }

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

  if (last === yesterday) {
    progress.streakDays += 1
  } else {
    // Streak broken
    progress.streakDays = 1
  }

  progress.lastActiveDate = today
  saveProgress(progress)
  return progress.streakDays
}
