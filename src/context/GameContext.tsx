import React, { createContext, useContext } from 'react'
import type { DebtThreshold } from '@/types/game'
import { getDebtLevel, getXPLevel } from '@/types/game'
import { reduceDebt as storageReduceDebt, addXP as storageAddXP, completeBossMission } from '@/lib/storage'
import { useApp } from './AppContext'

interface GameContextValue {
  knowledgeDebt: number
  debtLevel: DebtThreshold
  totalXP: number
  xpLevel: { level: number; label: string; minXP: number }
  earnedBadgeIds: string[]
  reduceDebt: (amount: number) => void
  addXP: (amount: number) => void
  awardBadge: (badgeId: string, unitId?: string) => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { userProgress, refreshProgress } = useApp()

  const knowledgeDebt = userProgress?.knowledgeDebt ?? 100
  const totalXP = userProgress?.totalXP ?? 0
  const earnedBadgeIds = userProgress?.earnedBadgeIds ?? []

  const debtLevel = getDebtLevel(knowledgeDebt)
  const xpLevel = getXPLevel(totalXP)

  function reduceDebt(amount: number) {
    storageReduceDebt(amount)
    refreshProgress()
  }

  function addXP(amount: number) {
    storageAddXP(amount)
    refreshProgress()
  }

  function awardBadge(badgeId: string, unitId?: string) {
    if (unitId) {
      completeBossMission(unitId, badgeId)
    }
    refreshProgress()
  }

  const value: GameContextValue = {
    knowledgeDebt,
    debtLevel,
    totalXP,
    xpLevel,
    earnedBadgeIds,
    reduceDebt,
    addXP,
    awardBadge,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame must be used inside <GameProvider>')
  }
  return ctx
}
