import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import styles from './Modal.module.css';

/**
 * @component Modal
 * @category modals
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { Modal } from './Modal';
 *
 * function Example() {
 *   return (
 *     <Modal>
 *       [Add example usage]
 *     </Modal>
 *   );
 * }
 * ```
 */

// Convert the existing component content

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  footer,
  className = ''
}) => {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent scroll on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='fixed inset-0 z-50 overflow-y-auto'>
        <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
          <div
            className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full ${sizeClass} ${className}`}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className='bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center'>
                {title && <h3 className='text-lg font-medium text-gray-900'>{title}</h3>}
                {showClose && (
                  <button
                    type='button'
                    className='rounded-md bg-gray-50 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    onClick={onClose}
                  >
                    <span className='sr-only'>Close</span>
                    <svg
                      className='h-6 w-6'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='1.5'
                      stroke='currentColor'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className='bg-white px-4 py-5 sm:p-6'>{children}</div>

            {/* Footer */}
            {footer && (
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2'>
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

Modal.propTypes = {
  // Add prop types
};

Modal.defaultProps = {
  // Add default props
};

export default Modal;
