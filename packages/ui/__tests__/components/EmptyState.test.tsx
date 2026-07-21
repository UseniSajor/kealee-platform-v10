// packages/ui/__tests__/components/EmptyState.test.tsx
// Unit tests for EmptyState component

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmptyState } from '../../src/components/EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(
      <EmptyState
        title="No items"
        description="Get started by creating your first item"
      />
    );
    expect(screen.getByText('Get started by creating your first item')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<EmptyState title="Empty" icon={<span data-testid="icon">📁</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders primary action button', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        title="Empty"
        action={{ label: 'Create Item', onClick: handleClick }}
      />
    );
    const button = screen.getByText('Create Item');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it('renders secondary action button', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        title="Empty"
        secondaryAction={{ label: 'Learn More', onClick: handleClick }}
      />
    );
    const button = screen.getByText('Learn More');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it('renders both actions', () => {
    render(
      <EmptyState
        title="Empty"
        action={{ label: 'Primary', onClick: () => {} }}
        secondaryAction={{ label: 'Secondary', onClick: () => {} }}
      />
    );
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
  });
});
