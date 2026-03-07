import { memo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  ChevronDown,
  DollarSign,
  Edit2,
  Hotel,
  MoreVertical,
  Plane,
  StickyNote,
  Trash2,
  Train,
  Bus
} from 'lucide-react';
import { formatDate, getDestinationDates } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Accommodation, CityImage, DestinationWithRelations, Transport, TransportType } from '@/types/database';

type DestinationCardProps = {
  destination: DestinationWithRelations;
  destinations: DestinationWithRelations[];
  index: number;
  locale: string;
  startDate: string | null;
  travelDays?: number;
  activityCount: number;
  expanded: boolean;
  isMenuOpen: boolean;
  cityImage?: CityImage | null;
  onToggle: (destinationId: number) => void;
  onOpenSchedule: (destinationId: number) => void;
  onEdit: (destinationId: number) => void;
  onDelete: (destinationId: number) => void;
  setOpenMenuId: (destinationId: number | null) => void;
};

type LabelValue = {
  label: string;
  value: string;
};

function getTransportIconByType(transportType: TransportType | null | undefined) {
  if (transportType === 'train') {
    return Train;
  }

  if (transportType === 'bus') {
    return Bus;
  }

  return Plane;
}

function hasTransportContent(transport: Transport | null): boolean {
  if (!transport) {
    return false;
  }

  return Boolean(
    transport.transport_type !== 'plane' ||
      transport.leave_accommodation_time ||
      transport.terminal ||
      transport.company ||
      transport.booking_number ||
      transport.booking_code ||
      transport.departure_time
  );
}

function hasAccommodationContent(accommodation: Accommodation | null): boolean {
  if (!accommodation) {
    return false;
  }

  return Boolean(
    accommodation.check_in ||
      accommodation.check_out ||
      accommodation.name ||
      accommodation.booking_link ||
      accommodation.booking_code ||
      accommodation.address
  );
}

function getTransportLabel(type: TransportType, tTransport: (key: 'plane' | 'train' | 'bus') => string): string {
  return tTransport(type);
}

function getTransportDetails(transport: Transport | null, tTransport: (key: string) => string): LabelValue[] {
  if (!transport || !hasTransportContent(transport)) {
    return [];
  }

  const details: LabelValue[] = [];

  if (transport.transport_type && transport.transport_type !== 'plane') {
    details.push({
      label: tTransport('type'),
      value: getTransportLabel(transport.transport_type, tTransport as (key: 'plane' | 'train' | 'bus') => string)
    });
  }

  if (transport.leave_accommodation_time) {
    details.push({
      label: tTransport('leaveTime'),
      value: transport.leave_accommodation_time
    });
  }

  if (transport.terminal) {
    details.push({
      label: tTransport('terminal'),
      value: transport.terminal
    });
  }

  if (transport.company) {
    details.push({
      label: tTransport('company'),
      value: transport.company
    });
  }

  const reservation = [transport.booking_number, transport.booking_code].filter(Boolean).join(' / ');
  if (reservation) {
    details.push({
      label: tTransport('reservation'),
      value: reservation
    });
  }

  if (transport.departure_time) {
    details.push({
      label: tTransport('departureTime'),
      value: transport.departure_time
    });
  }

  return details;
}

function getAccommodationDetails(accommodation: Accommodation | null, tAccommodation: (key: string) => string): LabelValue[] {
  if (!accommodation || !hasAccommodationContent(accommodation)) {
    return [];
  }

  const details: LabelValue[] = [];

  if (accommodation.check_in || accommodation.check_out) {
    details.push({
      label: tAccommodation('schedule'),
      value: `${tAccommodation('checkIn')}: ${accommodation.check_in ?? '-'} | ${tAccommodation('checkOut')}: ${
        accommodation.check_out ?? '-'
      }`
    });
  }

  if (accommodation.name) {
    details.push({
      label: tAccommodation('name'),
      value: accommodation.name
    });
  }

  const booking = accommodation.booking_code ?? accommodation.booking_link;
  if (booking) {
    details.push({
      label: tAccommodation('booking'),
      value: booking
    });
  }

  if (accommodation.address) {
    details.push({
      label: tAccommodation('address'),
      value: accommodation.address
    });
  }

  return details;
}

export const DestinationCard = memo(function DestinationCard({
  destination,
  destinations,
  index,
  locale,
  startDate,
  travelDays = 0,
  activityCount,
  expanded,
  isMenuOpen,
  cityImage,
  onToggle,
  onOpenSchedule,
  onEdit,
  onDelete,
  setOpenMenuId
}: DestinationCardProps) {
  const tAccommodation = useTranslations('accommodation');
  const tActivities = useTranslations('activities');
  const tCommon = useTranslations('common');
  const tDestinations = useTranslations('destinations');
  const tTransport = useTranslations('transport');
  const tTrips = useTranslations('trips');
  const localeTag = locale === 'en' ? 'en-US' : 'es-ES';
  const { start, end } = getDestinationDates(startDate, destinations, index, travelDays);
  const dateRange = start && end ? `${formatDate(start, localeTag)} - ${formatDate(end, localeTag)}` : null;
  const cardId = destination.destination_id;
  const menuId = `destination-actions-${cardId}`;
  const fallbackName = tDestinations('newCity');
  const actionsLabel = tCommon('actions');

  const hasTransport = hasTransportContent(destination.transport);
  const hasAccommodation = !destination.is_stopover && hasAccommodationContent(destination.accommodation);
  const hasActivities = activityCount > 0;
  const canOpenSchedule = !destination.is_stopover && destination.duration > 0;
  const TransportIcon = getTransportIconByType(destination.transport?.transport_type);

  const transportDetails = getTransportDetails(destination.transport, tTransport);
  const accommodationDetails = destination.is_stopover
    ? []
    : getAccommodationDetails(destination.accommodation, tAccommodation);
  const transportPreview = transportDetails.slice(0, 2);
  const accommodationPreview = accommodationDetails.slice(0, 2);
  const hasMoreContent =
    transportDetails.length > 2 ||
    accommodationDetails.length > 2 ||
    Boolean(destination.notes) ||
    destination.budget !== null;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border shadow-card transition-all duration-base ease-standard hover:shadow-floating',
        destination.is_stopover ? 'border-border-strong bg-elevated' : 'border-border bg-surface'
      )}
    >
      {cityImage ? (
        <div className="relative h-20 sm:h-24 lg:h-32">
          <Image
            alt=""
            className="object-cover [object-position:center_50%] lg:[object-position:center_40%]"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            src={`${cityImage.raw_url}&w=800&q=80&fit=crop`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/5" />
          <p className="absolute bottom-1 right-1.5 text-[9px] text-white/60">
            <span className="font-medium">{cityImage.photographer_name}</span> / Unsplash
          </p>
        </div>
      ) : (
        <div className="relative h-20 overflow-hidden sm:h-24 lg:h-32">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-route to-brand-accent opacity-90" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px), radial-gradient(circle at 50% 80%, white 1px, transparent 1px)', backgroundSize: '60px 60px, 80px 80px, 40px 40px' }} />
        </div>
      )}
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-title-md font-semibold text-foreground-primary sm:text-title-lg">
                {destination.city || fallbackName}
              </h3>
              {hasTransport ? <TransportIcon aria-hidden="true" className="h-4 w-4 text-route" /> : null}
              {hasAccommodation ? <Hotel aria-hidden="true" className="h-4 w-4 text-brand-accent" /> : null}
              {hasActivities ? <CalendarDays aria-hidden="true" className="h-4 w-4 text-brand-primary" /> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-body-sm text-foreground-secondary">
              <span
                className={cn(
                  'inline-flex rounded-pill px-2.5 py-1 text-label-md font-semibold',
                  destination.is_stopover
                    ? 'bg-brand-accent-soft text-brand-primary'
                    : 'bg-brand-accent-soft text-brand-primary'
                )}
              >
                {destination.is_stopover
                  ? tDestinations('stopover')
                  : tTrips('days', { count: destination.duration })}
              </span>

              {dateRange ? (
                <span className="inline-flex rounded-pill bg-subtle px-2.5 py-1 text-label-md text-foreground-secondary">
                  {dateRange}
                </span>
              ) : null}
            </div>
          </div>

          <div className="destination-action-menu flex items-center gap-1">
            {canOpenSchedule ? (
              <button
                aria-label={`${tActivities('schedule')} (${tActivities('activitiesCount', { count: activityCount })})`}
                className="inline-flex items-center gap-1 rounded-md p-2 text-foreground-muted transition-colors duration-fast ease-standard hover:bg-subtle hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas touch:p-3"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenSchedule(cardId);
                }}
                type="button"
              >
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                {hasActivities ? (
                  <Badge className="h-5 min-w-5 px-1.5 text-[11px]" variant="secondary">
                    {activityCount}
                  </Badge>
                ) : null}
              </button>
            ) : null}

            <div className="relative">
              <button
                aria-label={actionsLabel}
                aria-controls={isMenuOpen ? menuId : undefined}
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                className="rounded-md p-2 text-foreground-muted transition-colors duration-fast ease-standard hover:bg-subtle hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas touch:p-3"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenuId(isMenuOpen ? null : cardId);
                }}
                type="button"
              >
                <MoreVertical aria-hidden="true" className="h-4 w-4" />
              </button>

              {isMenuOpen ? (
                <div
                  className="absolute right-0 top-full z-10 mt-1 min-w-[10rem] animate-fade-in rounded-lg border border-border bg-elevated py-1 shadow-floating"
                  id={menuId}
                  role="menu"
                >
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm font-medium text-foreground-secondary transition-colors duration-fast ease-standard hover:bg-subtle hover:text-foreground-primary"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId(null);
                      onEdit(cardId);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <Edit2 aria-hidden="true" className="h-4 w-4" />
                    {tCommon('edit')}
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm font-medium text-danger transition-colors duration-fast ease-standard hover:bg-danger/10"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId(null);
                      onDelete(cardId);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    {tCommon('delete')}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className={cn(
          'grid transition-[grid-template-rows] duration-base ease-standard',
          !expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}>
          <div className="overflow-hidden [min-height:0]">
            <div className="space-y-1.5 text-body-sm text-foreground-secondary">
              {transportPreview.length > 0 ? (
                <p className="flex items-center gap-2">
                  <TransportIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-route" />
                  <span>{transportPreview.map((field) => field.value).join(' · ')}</span>
                </p>
              ) : null}

              {accommodationPreview.length > 0 && !destination.is_stopover ? (
                <p className="flex items-center gap-2">
                  <Hotel aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-brand-accent" />
                  <span>{accommodationPreview.map((field) => field.value).join(' · ')}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {hasMoreContent ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-md text-body-sm font-semibold text-brand-primary transition-colors duration-fast ease-standard hover:text-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            onClick={() => onToggle(cardId)}
            type="button"
          >
            {expanded
              ? tCommon('hideDetails')
              : tCommon('showDetails')}
            <ChevronDown aria-hidden="true" className={cn('h-4 w-4 transition-transform duration-base ease-standard', expanded && 'rotate-180')} />
          </button>
        ) : null}

        <div className={cn(
          'grid transition-[grid-template-rows] duration-slow ease-emphasized',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}>
          <div className="overflow-hidden [min-height:0]">
            <div className={cn('space-y-3', expanded && 'animate-content-reveal')}>
              {transportDetails.length > 0 ? (
                <div className="border-t border-border pt-3">
                  <h4 className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-brand-primary">
                    <TransportIcon aria-hidden="true" className="h-4 w-4" />
                    {tTransport('title')}
                  </h4>
                  <div className="space-y-1 text-body-sm text-foreground-secondary">
                    {transportDetails.map((field) => (
                      <p key={`expanded-transport-${field.label}`}>
                        <span className="text-foreground-muted">{field.label}:</span> {field.value}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              {accommodationDetails.length > 0 && !destination.is_stopover ? (
                <div className="border-t border-border pt-3">
                  <h4 className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-brand-accent">
                    <Hotel aria-hidden="true" className="h-4 w-4" />
                    {tAccommodation('title')}
                  </h4>
                  <div className="space-y-1 text-body-sm text-foreground-secondary">
                    {accommodationDetails.map((field) => (
                      <p key={`expanded-accommodation-${field.label}`}>
                        <span className="text-foreground-muted">{field.label}:</span> {field.value}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              {destination.notes ? (
                <div className="border-t border-border pt-3">
                  <h4 className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-warning">
                    <StickyNote aria-hidden="true" className="h-4 w-4" />
                    {tDestinations('notes')}
                  </h4>
                  <p className="text-body-sm text-foreground-secondary">{destination.notes}</p>
                </div>
              ) : null}

              {destination.budget !== null ? (
                <div className="border-t border-border pt-3">
                  <h4 className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-success">
                    <DollarSign aria-hidden="true" className="h-4 w-4" />
                    {tDestinations('budget')}
                  </h4>
                  <p className="text-body-sm text-foreground-secondary">${destination.budget}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
