import React from 'react';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';

function UsageLimitGuard({ 
  currentUser, 
  usageType, 
  children, 
  fallback, 
  showUpgrade = true,
  setPage 
}) {
  const { 
    canPerformAction, 
    getLimitMessage, 
    getUpgradeMessage, 
    checkLimit,
    loading 
  } = useSubscriptionLimits(currentUser);

  if (loading) {
    return (
      <div style={{ 
        padding: '1rem', 
        textAlign: 'center', 
        color: '#666' 
      }}>
        Checking subscription limits...
      </div>
    );
  }

  const hasAccess = canPerformAction(usageType);
  const limitInfo = checkLimit(usageType);
  const limitMessage = getLimitMessage(usageType);
  const upgradeMessage = getUpgradeMessage(usageType);

  if (hasAccess) {
    return children;
  }

  // Custom fallback component
  if (fallback) {
    return fallback;
  }

  // Default limit reached UI
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      border: '2px dashed #e5e7eb',
      borderRadius: '12px',
      background: '#f9fafb'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
      
      <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444' }}>
        Daily Limit Reached
      </h3>
      
      <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
        {limitMessage}
      </p>
      
      {upgradeMessage && showUpgrade && (
        <div style={{
          padding: '1rem',
          background: '#eff6ff',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <p style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>
            💡 {upgradeMessage}
          </p>
          
          {setPage && (
            <button
              onClick={() => setPage('subscriptions')}
              style={{
                width: 'auto',
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                fontSize: '0.875rem'
              }}
            >
              View Plans
            </button>
          )}
        </div>
      )}
      
      <div style={{ fontSize: '0.875rem', color: '#666' }}>
        Limits reset daily at midnight. Come back tomorrow or upgrade for unlimited access.
      </div>
    </div>
  );
}

// Usage Progress Bar Component
export function UsageProgressBar({ 
  currentUser, 
  usageType, 
  showLabel = true,
  showPercentage = true,
  height = '8px'
}) {
  const { checkLimit, loading } = useSubscriptionLimits(currentUser);

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: height,
        background: '#e5e7eb',
        borderRadius: '4px',
        animation: 'pulse 2s infinite'
      }} />
    );
  }

  const limitInfo = checkLimit(usageType);
  
  if (limitInfo.isUnlimited) {
    return showLabel ? (
      <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
        ✨ Unlimited
      </div>
    ) : null;
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 70) return '#f59e0b';
    return '#10b981';
  };

  const usageLabels = {
    quiz_taken: 'Quizzes',
    course_enrolled: 'Courses',
    video_watched: 'Videos',
    course_created: 'Courses Created',
    lesson_created: 'Lessons Created',
    quiz_created: 'Quizzes Created'
  };

  return (
    <div>
      {showLabel && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '0.25rem',
          fontSize: '0.875rem'
        }}>
          <span>{usageLabels[usageType] || usageType}</span>
          <span style={{ color: '#666' }}>
            {limitInfo.currentUsage} / {limitInfo.limit}
            {showPercentage && ` (${Math.round(limitInfo.usagePercentage)}%)`}
          </span>
        </div>
      )}
      
      <div style={{
        width: '100%',
        height: height,
        background: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${limitInfo.usagePercentage}%`,
          height: '100%',
          background: getProgressColor(limitInfo.usagePercentage),
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      
      {limitInfo.usagePercentage >= 90 && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: '#ef4444', 
          marginTop: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          ⚠️ Approaching limit
        </div>
      )}
    </div>
  );
}

// Usage Summary Widget
export function UsageSummaryWidget({ currentUser, setPage }) {
  const { subscription, usage, checkLimit, loading } = useSubscriptionLimits(currentUser);

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          Loading usage data...
        </div>
      </div>
    );
  }

  const planId = subscription?.plan_id || 'free';
  const usageTypes = ['quiz_taken', 'course_enrolled', 'video_watched'];
  
  if (planId === 'pro') {
    usageTypes.push('course_created');
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Today's Usage</h3>
        {setPage && (
          <button
            onClick={() => setPage('subscription-management')}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Manage
          </button>
        )}
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {usageTypes.map(usageType => (
          <UsageProgressBar
            key={usageType}
            currentUser={currentUser}
            usageType={usageType}
            showLabel={true}
            showPercentage={false}
          />
        ))}
      </div>
      
      {planId === 'free' && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#eff6ff',
          border: '1px solid #3b82f6',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '0.5rem' }}>
            🚀 Want unlimited access?
          </div>
          {setPage && (
            <button
              onClick={() => setPage('subscriptions')}
              style={{
                width: 'auto',
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                fontSize: '0.75rem'
              }}
            >
              Upgrade Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default UsageLimitGuard;