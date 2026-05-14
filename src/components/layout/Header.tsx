import React, { useState, useEffect } from 'react'
import { getProgress } from '@/lib/storage'
import { getDebtLevel } from '@/types/game'
import type { UserProgress } from '@/types/progress'
import styles from './Header.module.css'

export function Header() {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setProgress(getProgress())
    const handler = () => setProgress(getProgress())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const debt = progress?.knowledgeDebt ?? 100
  const debtLevel = getDebtLevel(debt)
  const xp = progress?.totalXP ?? 0

  const navLinks = [
    { href: '/map', label: 'Map' },
    { href: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/map" className={styles.logo} aria-label="DocCraft home">
          <span className={styles.logoIcon}>📚</span>
          DocCraft
        </a>

        <nav
          className={[styles.nav, menuOpen ? styles.navOpen : ''].filter(Boolean).join(' ')}
          aria-label="Main navigation"
        >
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.right}>
          {progress && (
            <div className={styles.stats}>
              <div className={styles.debtCompact} title={`Knowledge Debt: ${debt}% (${debtLevel.label})`}>
                <span className={styles.debtLabel}>Debt</span>
                <div className={styles.debtBarWrap}>
                  <div
                    className={styles.debtBarFill}
                    style={{ width: `${debt}%`, backgroundColor: debtLevel.color }}
                  />
                </div>
                <span className={styles.debtValue}>{debt}%</span>
              </div>
              <div className={styles.xp}>⚡ {xp.toLocaleString()} XP</div>
            </div>
          )}

          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={[styles.hLine, menuOpen ? styles.hTop : ''].filter(Boolean).join(' ')} />
            <span className={[styles.hLine, menuOpen ? styles.hMid : ''].filter(Boolean).join(' ')} />
            <span className={[styles.hLine, menuOpen ? styles.hBot : ''].filter(Boolean).join(' ')} />
          </button>
        </div>
      </div>
    </header>
  )
}
