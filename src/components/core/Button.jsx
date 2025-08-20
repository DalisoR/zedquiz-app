import PropTypes from 'prop-types';
import React from 'react';

import styles from './Button.module.css';

/**
 * Primary button component used throughout the application
 * @component
 * @example
 * return (
 *   <Button
 *     variant="primary"
 *     onClick={() => console.log('clicked')}
 *   >
 *     Click Me
 *   </Button>
 * )
 */
export const Button = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  const buttonClasses = `${styles.button} ${styles[variant]} ${className}`;

  return (
    <button className={buttonClasses} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

Button.propTypes = {
  /** The content to be rendered inside the button */
  children: PropTypes.node.isRequired,
  /** The variant style to apply to the button */
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
  /** Function to call when button is clicked */
  onClick: PropTypes.func,
  /** Whether the button is disabled */
  disabled: PropTypes.bool,
  /** Additional CSS classes to apply */
  className: PropTypes.string
};

Button.defaultProps = {
  variant: 'primary',
  disabled: false,
  className: ''
};

export default Button;
