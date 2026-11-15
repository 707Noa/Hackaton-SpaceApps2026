import React, { useEffect } from 'react';

export default function ActionFeedback({ feedback, onDismiss }) {
  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => onDismiss(feedback.id), 6500);
    return () => window.clearTimeout(timer);
  }, [feedback, onDismiss]);

  if (!feedback) return null;

  return (
    <aside
      className={`action-feedback action-feedback-${feedback.status}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="action-feedback-header">
        <strong>{feedback.status === 'success' ? '✅ ORDEN COMPLETADA' : '⚠️ REVISA ESTA ORDEN'}</strong>
        <button
          type="button"
          className="action-feedback-close"
          aria-label="Cerrar resultado de la acción"
          onClick={() => onDismiss(feedback.id)}
        >
          ×
        </button>
      </div>
      <p className="action-feedback-message">{feedback.message}</p>
      {feedback.changes.length > 0 ? (
        <div className="action-feedback-changes">
          {feedback.changes.map((change) => (
            <span
              key={change.label}
              className={
                (change.id === 'co2' || change.id === 'dust' || change.id === 'radiationDose')
                ? (change.delta < 0 ? 'feedback-change-positive' : 'feedback-change-negative')
                : (change.delta > 0 ? 'feedback-change-positive' : 'feedback-change-negative')
              }
            >
              {change.icon} {change.label} <strong>{change.delta > 0 ? '+' : ''}{change.delta}%</strong>
            </span>
          ))}
        </div>
      ) : feedback.status === 'success' ? (
        <span className="action-feedback-no-change">Los recursos se mantienen estables.</span>
      ) : null}
    </aside>
  );
}
