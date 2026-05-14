import React, { createContext, useContext, useEffect, useState } from 'react'
import type { UserProgress } from '@/types/progress'
import { getProgress } from '@/lib/storage'

interface AppContextValue {
  userProgress: UserProgress | null
  isOnboarded: boolean
  isLoading: boolean
  setOnboarded: (progress: UserProgress) => void
  refreshProgress: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  function loadProgress() {
    const stored = getProgress()
    setUserProgress(stored)
  }

  useEffect(() => {
    loadProgress()
    setIsLoading(false)
  }, [])

  function setOnboarded(progress: UserProgress) {
    setUserProgress(progress)
  }

  function refreshProgress() {
    loadProgress()
  }

  const value: AppContextValue = {
    userProgress,
    isOnboarded: userProgress !== null,
    isLoading,
    setOnboarded,
    refreshProgress,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used inside <AppProvider>')
  }
  return ctx
}
