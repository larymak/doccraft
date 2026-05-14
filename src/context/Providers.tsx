import React from 'react'
import { AppProvider } from './AppContext'
import { GameProvider } from './GameContext'
import { MissionProvider } from './MissionContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <GameProvider>
        <MissionProvider>{children}</MissionProvider>
      </GameProvider>
    </AppProvider>
  )
}
