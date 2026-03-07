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
  is_stopover: false,
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
    arrival_time: null,
    travel_days: 0,
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
  },
  activities: []
};

describe('DestinationCard', () => {
  it('displays city name', () => {
    render(
      <DestinationCard
        activityCount={0}
        destination={mockDestination}
        destinations={[mockDestination]}
        expanded={false}
        isMenuOpen={false}
        index={0}
        locale="es"
        onDelete={noop}
        onEdit={noop}
        onOpenSchedule={noop}
        onToggle={noop}
        setOpenMenuId={noop}
        startDate={null}
      />
    );

    expect(screen.getByText('Madrid')).toBeInTheDocument();
  });

  it('displays duration', () => {
    render(
      <DestinationCard
        activityCount={0}
        destination={mockDestination}
        destinations={[mockDestination]}
        expanded={false}
        isMenuOpen={false}
        index={0}
        locale="es"
        onDelete={noop}
        onEdit={noop}
        onOpenSchedule={noop}
        onToggle={noop}
        setOpenMenuId={noop}
        startDate={null}
      />
    );

    expect(screen.getByText(/5 días/i)).toBeInTheDocument();
  });

  it('shows transport preview when transport exists', () => {
    render(
      <DestinationCard
        activityCount={0}
        destination={mockDestination}
        destinations={[mockDestination]}
        expanded={false}
        isMenuOpen={false}
        index={0}
        locale="es"
        onDelete={noop}
        onEdit={noop}
        onOpenSchedule={noop}
        onToggle={noop}
        setOpenMenuId={noop}
        startDate={null}
      />
    );

    expect(screen.getByText('Iberia')).toBeInTheDocument();
  });
});
