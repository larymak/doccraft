import React, { useState } from 'react'
import { Providers } from '@/context/Providers'
import { useApp } from '@/context/AppContext'
import { initProgress } from '@/lib/storage'
import styles from './OnboardingFlow.module.css'

const CAREERS = [
  { emoji: '✍️', title: 'Technical Writer', desc: 'Creates product docs, API guides, and user manuals.' },
  { emoji: '⚙️', title: 'Docs Engineer', desc: 'Builds docs-as-code pipelines and tooling.' },
  { emoji: '📢', title: 'Developer Advocate', desc: 'Tutorials and education for developer communities.' },
  { emoji: '🗺️', title: 'Knowledge Manager', desc: 'Governs org-wide knowledge systems and ownership.' },
  { emoji: '🎯', title: 'Content Strategist', desc: 'Plans information architecture and content standards.' },
  { emoji: '🔧', title: 'Any Engineer', desc: 'Engineers who document well advance faster.' },
]

const SKILLS = [
  { emoji: '📄', text: '8 document types and when to use each' },
  { emoji: '🏗️', text: 'Templates, naming conventions, folder structure' },
  { emoji: '🏷️', text: 'Metadata, search, and findability' },
  { emoji: '⚙️', text: 'Docs-as-code with Git and Markdown' },
  { emoji: '📋', text: 'Ownership models and governance' },
  { emoji: '📜', text: 'Decision records and institutional memory' },
]

function OnboardingInner() {
  const { setOnboarded } = useApp()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const totalSteps = 5

  const nameValid = name.trim().length >= 2
  const nameError = nameTouched && !nameValid ? 'Name must be at least 2 characters.' : null

  function handleStart() {
    const progress = initProgress(name.trim())
    setOnboarded(progress)
    window.location.href = '/map'
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>

        <div className={styles.dots} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={[
                styles.dot,
                i + 1 === step ? styles.active : '',
                i + 1 < step ? styles.done : '',
              ].filter(Boolean).join(' ')}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* ── Step 1: What is documentation? ── */}
        {step === 1 && (
          <div className={styles.card} key="step1">
            <div className={styles.illustration}>📚</div>
            <p className={styles.eyebrow}>Before we start</p>
            <h1 className={styles.heading}>What is documentation?</h1>
            <p className={styles.subheading}>
              Documentation is how organizations capture what they know — so that knowledge
              survives people leaving, teams scaling, and time passing.
            </p>
            <div className={styles.factBox}>
              <div className={styles.fact}>
                <span className={styles.factNum}>6–8 hrs</span>
                <span className={styles.factDesc}>lost per engineer per week searching for information that should already be documented</span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factNum}>40%</span>
                <span className={styles.factDesc}>of new-hire ramp time goes to asking questions that good documentation would answer</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.continueBtn} onClick={() => setStep(2)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Careers ── */}
        {step === 2 && (
          <div className={styles.card} key="step2">
            <div className={styles.illustration}>🚀</div>
            <p className={styles.eyebrow}>Career paths</p>
            <h1 className={styles.heading}>Where this takes you</h1>
            <p className={styles.subheading}>
              Documentation skills are in demand across multiple growing careers —
              and every engineering role benefits from them.
            </p>
            <div className={styles.careerGrid}>
              {CAREERS.map(c => (
                <div key={c.title} className={styles.careerChip}>
                  <span className={styles.careerEmoji}>{c.emoji}</span>
                  <div>
                    <strong>{c.title}</strong>
                    <span>{c.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>← Back</button>
              <button type="button" className={styles.continueBtn} onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: What you'll learn ── */}
        {step === 3 && (
          <div className={styles.card} key="step3">
            <div className={styles.illustration}>🎯</div>
            <p className={styles.eyebrow}>The curriculum</p>
            <h1 className={styles.heading}>What you'll learn</h1>
            <p className={styles.subheading}>
              10 units, 37 missions, one fictional company. You start as a new documentation
              specialist at Northstar Apps and work your way from Beginner to Pro.
            </p>
            <div className={styles.skillGrid}>
              {SKILLS.map(s => (
                <div key={s.text} className={styles.skillChip}>
                  <span>{s.emoji}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.backBtn} onClick={() => setStep(2)}>← Back</button>
              <button type="button" className={styles.continueBtn} onClick={() => setStep(4)}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 4: Name ── */}
        {step === 4 && (
          <div className={styles.card} key="step4">
            <div className={styles.illustration}>✍️</div>
            <p className={styles.logo}>DocCraft</p>
            <p className={styles.logoSub}>Ready to start your first mission?</p>
            <h1 className={styles.heading}>What's your name?</h1>
            <p className={styles.subheading}>
              Your manager Jordan will greet you by name on day one.
            </p>
            <label htmlFor="learner-name" className={styles.inputLabel}>Your name</label>
            <input
              id="learner-name"
              type="text"
              className={styles.input}
              value={name}
              placeholder="e.g. Alex, Jordan, Sam…"
              onChange={e => setName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              onKeyDown={e => { if (e.key === 'Enter' && nameValid) setStep(5) }}
              autoFocus
              autoComplete="given-name"
            />
            {nameError && <p className={styles.inputError}>{nameError}</p>}
            <div className={styles.actions}>
              <button type="button" className={styles.backBtn} onClick={() => setStep(3)}>← Back</button>
              <button
                type="button"
                className={styles.continueBtn}
                disabled={!nameValid}
                onClick={() => { setNameTouched(true); if (nameValid) setStep(5) }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Ready ── */}
        {step === 5 && (
          <div className={styles.card} key="step5">
            <div className={styles.illustration}>🌱</div>
            <p className={styles.readyHeading}>You're ready, {name}!</p>
            <p className={styles.readyText}>
              Your first mission is set on your first day at Northstar Apps.
              Jordan will walk you through what knowledge debt is — and why the team needs your help.
            </p>
            <div className={styles.readyMeta}>
              <span>🌱 Starting at Beginner</span>
              <span>·</span>
              <span>⏱ ~10 min first mission</span>
              <span>·</span>
              <span>📍 Unit 1, Mission 1</span>
            </div>
            <button type="button" className={styles.startBtn} onClick={handleStart}>
              Start Unit 1 →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export function OnboardingFlow() {
  return (
    <Providers>
      <OnboardingInner />
    </Providers>
  )
}
