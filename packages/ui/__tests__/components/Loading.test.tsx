// packages/ui/__tests__/components/Loading.test.tsx
// Unit tests for Loading component

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Loading } from '../../src/components/Loading';

describe('Loading', () => {
  it('renders spinner variant by default', () => {
    render(<Loading />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('renders dots variant', () => {
    render(<Loading variant="dots" />);
    const dots = screen.getByLabelText('Loading');
    expect(dots).toBeInTheDocument();
  });

  it('renders pulse variant', () => {
    render(<Loading variant="pulse" />);
    const pulse = screen.getByLabelText('Loading');
    expect(pulse).toBeInTheDocument();
    expect(pulse).toHaveClass('animate-pulse');
  });

  it('displays loading text', () => {
    render(<Loading text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('handles different sizes', () => {
    const { rerender } = render(<Loading size="sm" />);
    expect(screen.getByLabelText('Loading')).toHaveClass('w-4');

    rerender(<Loading size="lg" />);
    expect(screen.getByLabelText('Loading')).toHaveClass('w-12');
  });

  it('renders full screen overlay', () => {
    render(<Loading fullScreen />);
    const overlay = screen.getByLabelText('Loading').closest('.fixed');
    expect(overlay).toHaveClass('inset-0');
  });

  it('is accessible', () => {
    render(<Loading />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
  });
});
