import { useGame } from '@/context/GameContext'

export function useDebt() {
  const { knowledgeDebt, debtLevel, reduceDebt } = useGame()
  return { debt: knowledgeDebt, debtLevel, reduce: reduceDebt }
}
