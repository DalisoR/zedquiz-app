import PropTypes from 'prop-types';
import React from 'react';

import styles from './LoadingSpinner.module.css';

/**
 * @component LoadingSpinner
 * @category loaders
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { LoadingSpinner } from './LoadingSpinner';
 *
 * function Example() {
 *   return (
 *     <LoadingSpinner>
 *       [Add example usage]
 *     </LoadingSpinner>
 *   );
 * }
 * ```
 */

// Convert the existing component content

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

const colors = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white'
};

const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  fullScreen = false,
  text
}) => {
  const sizeClass = sizes[size] || sizes.md;
  const colorClass = colors[color] || colors.primary;

  const spinner = (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg
        className={`animate-spin ${sizeClass} ${colorClass}`}
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
      >
        <circle
          className='opacity-25'
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='4'
        ></circle>
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        ></path>
      </svg>
      {text && <span className='mt-2 text-sm text-gray-500'>{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50'>
        {spinner}
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.propTypes = {
  // Add prop types
};

LoadingSpinner.defaultProps = {
  // Add default props
};

export default LoadingSpinner;
