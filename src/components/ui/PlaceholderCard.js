import React from 'react';

function PlaceholderCard({ title = 'Coming soon', description = 'This feature is under active development.', primaryLabel = 'Back to Home', onPrimary, secondaryLabel, onSecondary }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</div>
      {description && (
        <p style={{ color: '#6b7280', marginTop: 0, marginBottom: '1rem' }}>{description}</p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {onPrimary && (
          <button type="button" onClick={onPrimary} style={{ width: 'auto', background: '#1E8449' }}>
            {primaryLabel}
          </button>
        )}
        {onSecondary && (
          <button type="button" onClick={onSecondary} style={{ width: 'auto', background: '#6b7280' }}>
            {secondaryLabel || 'Learn more'}
          </button>
        )}
      </div>
    </div>
  );
}

export default PlaceholderCard;
