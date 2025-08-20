import PropTypes from 'prop-types';
import React from 'react';

/**
 * @component Navigation
 * @category ui
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { Navigation } from './Navigation';
 *
 * function Example() {
 *   return (
 *     <Navigation>
 *       [Add example usage]
 *     </Navigation>
 *   );
 * }
 * ```
 */

import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

export function TopNav({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const canGoBack =
    location.pathname !== '/' &&
    location.pathname !== '/dashboard' &&
    location.pathname !== '/teacher' &&
    location.pathname !== '/admin';

  const onBack = () => navigate(-1);
  const onHome = () => {
    if (profile?.role === 'super-admin') navigate('/admin');
    else if (profile?.role === 'teacher') navigate('/teacher');
    else navigate('/dashboard');
  };
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #eee'
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {canGoBack && (
          <button
            type='button'
            onClick={onBack}
            style={{
              width: 'auto',
              background: '#6b7280',
              padding: '0.5rem 0.75rem'
            }}
          >
            Back
          </button>
        )}
        <button
          type='button'
          onClick={onHome}
          style={{
            width: 'auto',
            background: '#1E8449',
            padding: '0.5rem 0.75rem'
          }}
        >
          Home
        </button>
      </div>
      {title ? <div style={{ fontWeight: 600 }}>{title}</div> : <span />}
      <span />
    </div>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher';
  const items = isTeacher
    ? [
        { key: '/teacher', label: 'Dashboard' },
        { key: '/teacher/bookings', label: 'Bookings' },
        { key: '/teacher/availability', label: 'Availability' },
        { key: '/teacher/earnings', label: 'Earnings' }
      ]
    : [
        { key: '/dashboard', label: 'Home' },
        { key: '/teachers', label: 'Teachers' },
        { key: '/leaderboard', label: 'Leaderboard' },
        { key: '/upgrade', label: 'Upgrade' }
      ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: '0.25rem',
        padding: '0.5rem',
        zIndex: 40
      }}
    >
      {items.map(item => (
        <button
          key={item.key}
          type='button'
          onClick={() => navigate(item.key)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: 8,
            background: '#f8fafc',
            color: '#111827',
            fontWeight: 600
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
