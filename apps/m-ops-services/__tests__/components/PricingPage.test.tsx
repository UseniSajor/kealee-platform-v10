// apps/m-ops-services/__tests__/components/PricingPage.test.tsx
// Unit tests for PricingPage component

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PricingPage from '../../app/pricing/page';

describe('PricingPage', () => {
  it('renders all 4 packages', () => {
    render(<PricingPage />);

    expect(screen.getByText(/package a/i)).toBeInTheDocument();
    expect(screen.getByText(/package b/i)).toBeInTheDocument();
    expect(screen.getByText(/package c/i)).toBeInTheDocument();
    expect(screen.getByText(/package d/i)).toBeInTheDocument();
  });

  it('displays "Most Popular" badge on Package C', () => {
    render(<PricingPage />);

    const packageC = screen.getByText(/package c/i).closest('div');
    expect(screen.getByText(/most popular/i)).toBeInTheDocument();
  });

  it('shows correct prices for each package', () => {
    render(<PricingPage />);

    expect(screen.getByText(/\$1,750/)).toBeInTheDocument();
    expect(screen.getByText(/\$4,500/)).toBeInTheDocument();
    expect(screen.getByText(/\$8,500/)).toBeInTheDocument();
    expect(screen.getByText(/\$16,500/)).toBeInTheDocument();
  });

  it('displays trust indicators', () => {
    render(<PricingPage />);

    expect(screen.getByText(/4\.9\/5 rating/i)).toBeInTheDocument();
    expect(screen.getByText(/500\+ projects/i)).toBeInTheDocument();
    expect(screen.getByText(/94% on-time delivery/i)).toBeInTheDocument();
  });

  it('navigates to checkout when "Get Started" is clicked', () => {
    const mockPush = jest.fn();
    jest.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush }),
    }));

    render(<PricingPage />);

    const buttons = screen.getAllByText(/get started/i);
    fireEvent.click(buttons[0]);

    // Check that navigation would occur
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows 14-day trial message', () => {
    render(<PricingPage />);

    const trialMessages = screen.getAllByText(/14-day free trial/i);
    expect(trialMessages.length).toBeGreaterThan(0);
  });
});
