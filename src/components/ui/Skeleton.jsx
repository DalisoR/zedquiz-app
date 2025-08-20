import PropTypes from 'prop-types';
import React from 'react';

import styles from './Skeleton.module.css';

/**
 * @component Skeleton
 * @category ui
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { Skeleton } from './Skeleton';
 *
 * function Example() {
 *   return (
 *     <Skeleton>
 *       [Add example usage]
 *     </Skeleton>
 *   );
 * }
 * ```
 */

// Convert the existing component content
import './Skeleton.css';

export const Skeleton = ({ width = '100%', height = '1rem', className = '', style = {} }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        ...style
      }}
    />
  );
};

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array(lines)
        .fill(0)
        .map((_, i) => (
          <Skeleton
            key={i}
            height='1rem'
            style={{ marginBottom: i === lines - 1 ? '0' : '0.5rem' }}
          />
        ))}
    </div>
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`skeleton-card ${className}`}>
      <Skeleton height='120px' style={{ marginBottom: '1rem' }} />
      <SkeletonText lines={3} />
    </div>
  );
};
