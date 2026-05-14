import React from 'react'
import styles from './ReviewerComments.module.css'

interface ReviewerCommentsProps {
  comments: string[]
}

export function ReviewerComments({ comments }: ReviewerCommentsProps) {
  if (!comments || comments.length === 0) {
    return <p className={styles.empty}>No reviewer comments yet.</p>
  }

  return (
    <div className={styles.commentList}>
      {comments.map((comment, idx) => (
        <div key={idx} className={styles.commentCard}>
          <div className={styles.commentHeader}>
            <div className={styles.avatar} aria-hidden="true">R</div>
            <div className={styles.reviewer}>
              <span className={styles.reviewerName}>Documentation Reviewer</span>
              <span className={styles.reviewerRole}>Technical Writing Team</span>
            </div>
          </div>
          <p className={styles.commentBody}>{comment}</p>
        </div>
      ))}
    </div>
  )
}
