import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DestinationCard } from '../destination-card';
import type { DestinationWithRelations } from '@/types/database';

const noop = vi.fn();

const mockDestination: DestinationWithRelations = {
  destination_id: 1,
  trip_id: 1,
  city: 'Madrid',
  duration: 5,
  position: 0,
  notes: null,
  budget: null,
  created_at: '2026-02-03T00:00:00.000Z',
  updated_at: '2026-02-03T00:00:00.000Z',
  transport: {
    transport_id: 10,
    destination_id: 1,
    trip_id: null,
    transport_role: 'destination',
    transport_type: 'plane',
    leave_accommodation_time: null,
    terminal: null,
    company: 'Iberia',
    booking_number: null,
    booking_code: null,
    departure_time: null,
    created_at: '2026-02-03T00:00:00.000Z',
    updated_at: '2026-02-03T00:00:00.000Z'
  },
  accommodation: {
    accommodation_id: 20,
    destination_id: 1,
    check_in: null,
    check_out: null,
    name: 'Hotel Example',
    booking_link: null,
    booking_code: null,
    address: null,
    created_at: '2026-02-03T00:00:00.000Z',
    updated_at: '2026-02-03T00:00:00.000Z'
  }
};

describe('DestinationCard', () => {
  it('displays city name', () => {
    render(
      <DestinationCard
        destination={mockDestination}
        destinations={[mockDestination]}
        expanded={false}
        index={0}
        locale="es"
        onDelete={noop}
        onEdit={noop}
        onToggle={noop}
        openMenuId={null}
        setOpenMenuId={noop}
        startDate={null}
      />
    );

    expect(screen.getByText('Madrid')).toBeInTheDocument();
  });

  it('displays duration', () => {
    render(
      <DestinationCard
        destination={mockDestination}
        destinations={[mockDestination]}
        expanded={false}
        index={0}
        locale="es"
        onDelete={noop}
        onEdit={noop}
        onToggle={noop}
        openMenuId={null}
        setOpenMenuId={noop}
        startDate={null}
      />
    );

    expect(screen.getByText(/5 días/i)).toBeInTheDocument();
  });

  it('shows transport icon when transport exists', () => {
    render(
      <DestinationCard
        destination={mockDestination}
        destinations={[mockDestination]}
        expanded={false}
        index={0}
        locale="es"
        onDelete={noop}
        onEdit={noop}
        onToggle={noop}
        openMenuId={null}
        setOpenMenuId={noop}
        startDate={null}
      />
    );

    expect(screen.getByLabelText('transport-icon')).toBeInTheDocument();
  });
});
