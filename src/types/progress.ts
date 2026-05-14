export interface AssessmentAttempt {
  assessmentId: string
  completedAt: string
  score: number
  xpEarned: number
  attempts: number
  passed: boolean
  debtReduced: number
  submittedData?: unknown
}

export interface MissionProgress {
  missionId: string
  unitId: string
  startedAt: string
  completedAt?: string
  assessmentAttempts: AssessmentAttempt[]
  scenarioScore: number
  completed: boolean
  gitSimCompleted: boolean
}

export interface UnitProgress {
  unitId: string
  startedAt: string
  completedAt?: string
  missionProgress: Record<string, MissionProgress>
  bossMissionCompleted: boolean
  badgeEarned: boolean
}

export interface DocState {
  docId: string
  trustScore: number
  findabilityScore: number
  editHistory: Array<{ savedAt: string; snapshot: string }>
}

export interface UserProgress {
  userId: string
  profile: {
    name: string
    createdAt: string
  }
  knowledgeDebt: number
  totalXP: number
  currentUnitId: string
  currentMissionId: string
  unitProgress: Record<string, UnitProgress>
  earnedBadgeIds: string[]
  docStates: Record<string, DocState>
  lastActiveDate: string
  streakDays: number
}
