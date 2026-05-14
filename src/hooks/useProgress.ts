import { useApp } from '@/context/AppContext'
import {
  startMission as storageStartMission,
  completeMission as storageCompleteMission,
} from '@/lib/storage'

export function useProgress() {
  const { userProgress, isOnboarded, isLoading, refreshProgress } = useApp()

  function startMission(missionId: string, unitId: string) {
    storageStartMission(missionId, unitId)
    refreshProgress()
  }

  function completeMission(missionId: string, unitId: string, scenarioScore: number) {
    storageCompleteMission(missionId, unitId, scenarioScore)
    refreshProgress()
  }

  return {
    userProgress,
    isOnboarded,
    isLoading,
    refreshProgress,
    startMission,
    completeMission,
  }
}
