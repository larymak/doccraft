import React, { createContext, useContext, useState } from 'react'
import type { AssessmentAttempt } from '@/types/progress'
import {
  recordAssessmentAttempt,
  completeMission as storageCompleteMission,
} from '@/lib/storage'
import { useApp } from './AppContext'

interface MissionContextValue {
  currentAssessmentIndex: number
  assessmentResults: AssessmentAttempt[]
  isComplete: boolean
  totalScenarioScore: number
  submitAssessment: (attempt: AssessmentAttempt) => void
  completeMissionFlow: (missionId: string, unitId: string) => void
  resetMission: () => void
}

const MissionContext = createContext<MissionContextValue | null>(null)

export function MissionProvider({ children }: { children: React.ReactNode }) {
  const { refreshProgress } = useApp()

  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0)
  const [assessmentResults, setAssessmentResults] = useState<AssessmentAttempt[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [totalScenarioScore, setTotalScenarioScore] = useState(0)

  // Active mission tracking
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null)
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null)

  function submitAssessment(attempt: AssessmentAttempt) {
    if (activeMissionId && activeUnitId) {
      recordAssessmentAttempt(activeMissionId, activeUnitId, attempt)
    }

    const updated = [...assessmentResults, attempt]
    setAssessmentResults(updated)
    setCurrentAssessmentIndex(prev => prev + 1)
    refreshProgress()
  }

  function completeMissionFlow(missionId: string, unitId: string) {
    setActiveMissionId(missionId)
    setActiveUnitId(unitId)

    // Calculate scenario score from results
    const passedAttempts = assessmentResults.filter(a => a.passed)
    const score =
      passedAttempts.length > 0
        ? Math.round(
            passedAttempts.reduce((sum, a) => sum + a.score, 0) / passedAttempts.length,
          )
        : 0

    setTotalScenarioScore(score)
    setIsComplete(true)

    storageCompleteMission(missionId, unitId, score)
    refreshProgress()
  }

  function resetMission() {
    setCurrentAssessmentIndex(0)
    setAssessmentResults([])
    setIsComplete(false)
    setTotalScenarioScore(0)
    setActiveMissionId(null)
    setActiveUnitId(null)
  }

  const value: MissionContextValue = {
    currentAssessmentIndex,
    assessmentResults,
    isComplete,
    totalScenarioScore,
    submitAssessment,
    completeMissionFlow,
    resetMission,
  }

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>
}

export function useMission(): MissionContextValue {
  const ctx = useContext(MissionContext)
  if (!ctx) {
    throw new Error('useMission must be used inside <MissionProvider>')
  }
  return ctx
}
