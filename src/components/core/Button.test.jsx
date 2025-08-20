import { render, fireEvent } from '@testing-library/react';
import React from 'react';

import Button from './Button';

describe('Button', () => {
  test('renders with default props', () => {
    const { getByText } = render(<Button>Click Me</Button>);
    const button = getByText('Click Me');
    expect(button).toHaveClass('primary');
    expect(button).not.toBeDisabled();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    const { getByText } = render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies variant styles', () => {
    const { getByText } = render(<Button variant='danger'>Delete</Button>);
    expect(getByText('Delete')).toHaveClass('danger');
  });

  test('can be disabled', () => {
    const { getByText } = render(<Button disabled>Disabled</Button>);
    expect(getByText('Disabled')).toBeDisabled();
  });
});
