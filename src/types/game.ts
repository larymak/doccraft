export type DebtLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal'

export type UnitStatus = 'locked' | 'available' | 'in-progress' | 'completed'

export type MissionStatus = 'locked' | 'available' | 'in-progress' | 'completed'

export interface DebtThreshold {
  level: DebtLevel
  min: number
  max: number
  label: string
  color: string
  bgColor: string
}

export const DEBT_THRESHOLDS: DebtThreshold[] = [
  { level: 'minimal', min: 0, max: 20, label: 'Minimal', color: '#00471b', bgColor: 'rgba(0,71,27,0.15)' },
  { level: 'low', min: 21, max: 40, label: 'Low', color: '#2a7a4b', bgColor: 'rgba(42,122,75,0.15)' },
  { level: 'medium', min: 41, max: 60, label: 'Moderate', color: '#d97706', bgColor: 'rgba(217,119,6,0.15)' },
  { level: 'high', min: 61, max: 80, label: 'High', color: '#b45309', bgColor: 'rgba(180,83,9,0.15)' },
  { level: 'critical', min: 81, max: 100, label: 'Critical', color: '#a60000', bgColor: 'rgba(166,0,0,0.15)' },
]

export function getDebtLevel(debt: number): DebtThreshold {
  return DEBT_THRESHOLDS.find(t => debt >= t.min && debt <= t.max) ?? DEBT_THRESHOLDS[4]
}

export const STARTING_DEBT = 100

export const XP_LEVELS = [
  { level: 1, minXP: 0, label: 'Apprentice' },
  { level: 2, minXP: 200, label: 'Contributor' },
  { level: 3, minXP: 500, label: 'Maintainer' },
  { level: 4, minXP: 1000, label: 'Steward' },
  { level: 5, minXP: 2000, label: 'Architect' },
  { level: 6, minXP: 3500, label: 'Knowledge Lead' },
]

export function getXPLevel(totalXP: number) {
  let current = XP_LEVELS[0]
  for (const lvl of XP_LEVELS) {
    if (totalXP >= lvl.minXP) current = lvl
  }
  return current
}
