// apps/m-permits-inspections/__tests__/components/StepLocation.test.tsx
// Unit tests for StepLocation component

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StepLocation from '../../app/permits/new/page';

// Mock Google Places API
jest.mock('../../lib/api/google-places', () => ({
  googlePlacesService: {
    autocomplete: jest.fn(async (input: string) => {
      if (input.length < 3) return [];
      return [
        {
          place_id: '123',
          description: '123 Main St, Washington, DC 20001',
          structured_formatting: {
            main_text: '123 Main St',
            secondary_text: 'Washington, DC 20001',
          },
        },
      ];
    }),
    getPlaceDetails: jest.fn(async (placeId: string) => ({
      place_id: placeId,
      formatted_address: '123 Main St, Washington, DC 20001',
      address_components: [
        { long_name: 'Washington', short_name: 'DC', types: ['locality'] },
        { long_name: 'District of Columbia', short_name: 'DC', types: ['administrative_area_level_1'] },
      ],
      geometry: {
        location: { lat: 38.9072, lng: -77.0369 },
      },
    })),
  },
}));

describe('StepLocation', () => {
  const mockSetFormData = jest.fn();
  const mockFormData = {
    address: '',
    jurisdiction: null,
    permitTypes: [],
    documents: [],
    aiReview: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders address input field', () => {
    render(
      <StepLocation
        formData={mockFormData}
        setFormData={mockSetFormData}
        errors={{}}
      />
    );

    expect(screen.getByPlaceholderText(/enter project address/i)).toBeInTheDocument();
  });

  it('shows suggestions when typing', async () => {
    render(
      <StepLocation
        formData={mockFormData}
        setFormData={mockSetFormData}
        errors={{}}
      />
    );

    const input = screen.getByPlaceholderText(/enter project address/i);
    fireEvent.change(input, { target: { value: '123 Main' } });

    await waitFor(() => {
      expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    });
  });

  it('selects address when suggestion is clicked', async () => {
    render(
      <StepLocation
        formData={mockFormData}
        setFormData={mockSetFormData}
        errors={{}}
      />
    );

    const input = screen.getByPlaceholderText(/enter project address/i);
    fireEvent.change(input, { target: { value: '123 Main' } });

    await waitFor(() => {
      const suggestion = screen.getByText(/123 Main St/i);
      fireEvent.click(suggestion);
    });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        address: expect.stringContaining('123 Main St'),
        jurisdiction: expect.any(String),
      })
    );
  });

  it('displays jurisdiction info when selected', async () => {
    const formDataWithJurisdiction = {
      ...mockFormData,
      address: '123 Main St, Washington, DC 20001',
      jurisdiction: 'Washington, DC',
    };

    render(
      <StepLocation
        formData={formDataWithJurisdiction}
        setFormData={mockSetFormData}
        errors={{}}
      />
    );

    expect(screen.getByText(/jurisdiction detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Washington, DC/i)).toBeInTheDocument();
  });

  it('shows error message when address is required but empty', () => {
    render(
      <StepLocation
        formData={mockFormData}
        setFormData={mockSetFormData}
        errors={{ address: 'Address is required' }}
      />
    );

    expect(screen.getByText(/address is required/i)).toBeInTheDocument();
  });
});
