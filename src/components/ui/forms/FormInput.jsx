import PropTypes from 'prop-types';
import React from 'react';

import styles from './FormInput.module.css';

/**
 * @component FormInput
 * @category forms
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { FormInput } from './FormInput';
 *
 * function Example() {
 *   return (
 *     <FormInput>
 *       [Add example usage]
 *     </FormInput>
 *   );
 * }
 * ```
 */

// Convert the existing component content

const FormInput = ({
  label,
  id,
  error,
  type = 'text',
  className = '',
  required = false,
  helperText,
  ...props
}) => {
  const baseInputClasses =
    'block w-full px-4 py-2 mt-1 text-gray-900 placeholder-gray-400 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
  const errorInputClasses =
    'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500';
  const successInputClasses =
    'border-green-300 text-green-900 placeholder-green-300 focus:ring-green-500 focus:border-green-500';

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className='block text-sm font-medium text-gray-700'>
          {label}
          {required && <span className='ml-1 text-red-500'>*</span>}
        </label>
      )}
      <div className='mt-1'>
        <input
          type={type}
          id={id}
          className={`${baseInputClasses} ${error ? errorInputClasses : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
      </div>
      {helperText && !error && (
        <p className='mt-2 text-sm text-gray-500' id={`${id}-description`}>
          {helperText}
        </p>
      )}
      {error && (
        <p className='mt-2 text-sm text-red-600' id={`${id}-error`} role='alert'>
          {error}
        </p>
      )}
    </div>
  );
};

FormInput.propTypes = {
  // Add prop types
};

FormInput.defaultProps = {
  // Add default props
};

export default FormInput;
