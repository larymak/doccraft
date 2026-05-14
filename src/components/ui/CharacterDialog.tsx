import React from 'react'
import styles from './CharacterDialog.module.css'

interface CharacterDialogProps {
  name: string
  role: string
  message: string
  avatarColor?: string
  className?: string
}

export function CharacterDialog({
  name,
  role,
  message,
  avatarColor = '#4a6fa5',
  className,
}: CharacterDialogProps) {
  return (
    <div className={[styles.dialog, className].filter(Boolean).join(' ')}>
      <div className={styles.avatarCol}>
        <div className={styles.avatar} style={{ background: avatarColor }}>
          <span className={styles.avatarInitial}>{name[0]}</span>
        </div>
        <span className={styles.avatarName}>{name}</span>
        <span className={styles.avatarRole}>{role}</span>
      </div>

      <div className={styles.bubble}>
        <p className={styles.bubbleText}>{message}</p>
      </div>
    </div>
  )
}
