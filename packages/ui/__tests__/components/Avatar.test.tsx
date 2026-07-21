// packages/ui/__tests__/components/Avatar.test.tsx
// Unit tests for Avatar component

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Avatar } from '../../src/components/Avatar';

describe('Avatar', () => {
  it('renders with image', () => {
    render(<Avatar src="/test.jpg" alt="Test User" />);
    const img = screen.getByAltText('Test User');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.jpg');
  });

  it('renders with fallback text', () => {
    render(<Avatar fallback="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders with status indicator', () => {
    render(<Avatar fallback="User" status="online" />);
    const status = screen.getByLabelText('Status: online');
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass('bg-green-500');
  });

  it('handles different sizes', () => {
    const { rerender } = render(<Avatar size="sm" fallback="User" />);
    expect(screen.getByText('U')).toHaveClass('w-8');

    rerender(<Avatar size="lg" fallback="User" />);
    expect(screen.getByText('U')).toHaveClass('w-12');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Avatar fallback="User" onClick={handleClick} />);
    screen.getByText('U').click();
    expect(handleClick).toHaveBeenCalled();
  });

  it('is accessible with keyboard', () => {
    const handleClick = jest.fn();
    render(<Avatar fallback="User" onClick={handleClick} />);
    const avatar = screen.getByText('U');
    expect(avatar).toHaveAttribute('role', 'button');
    expect(avatar).toHaveAttribute('tabIndex', '0');
  });
});
