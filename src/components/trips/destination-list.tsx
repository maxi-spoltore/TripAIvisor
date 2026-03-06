'use client';

import { DragEvent, FormEvent, Fragment, useEffect, useState, useTransition } from 'react';
import { ArrowRightLeft, PlaneLanding, PlaneTakeoff, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  createDestinationAction,
  deleteDestinationAction,
  reorderDestinationsAction,
  saveDestinationDetailsAction
} from '@/app/actions/destinations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { DestinationWithRelations, TransportWithLegs } from '@/types/database';
import { DepartureCard } from './departure-card';
import { DestinationCard } from './destination-card';
import { DestinationModal, type DestinationModalSubmitInput } from './destination-modal';
import { ReturnCard } from './return-card';

type DestinationListProps = {
  locale: string;
  tripId: number;
  destinations: DestinationWithRelations[];
  startDate: string | null;
  departureCity?: string;
  departureTransport?: TransportWithLegs | null;
  travelDays?: number;
  returnCity?: string;
  returnDate?: string | null;
  returnTransport?: TransportWithLegs | null;
};

function sortByPosition(destinations: DestinationWithRelations[]): DestinationWithRelations[] {
  return [...destinations].sort((a, b) => a.position - b.position);
}

function withNormalizedPositions(destinations: DestinationWithRelations[]): DestinationWithRelations[] {
  return destinations.map((destination, index) => ({
    ...destination,
    position: index
  }));
}

export function DestinationList({
  locale,
  tripId,
  destinations,
  startDate,
  departureCity,
  departureTransport,
  travelDays,
  returnCity,
  returnDate,
  returnTransport
}: DestinationListProps) {
  const tCommon = useTranslations('common');
  const tDestinations = useTranslations('destinations');
  const [items, setItems] = useState<DestinationWithRelations[]>(() => sortByPosition(destinations));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingDestinationId, setEditingDestinationId] = useState<number | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [insertAtPosition, setInsertAtPosition] = useState<number | null>(null);
  const [newCity, setNewCity] = useState('');
  const [newDuration, setNewDuration] = useState('2');
  const [isStopover, setIsStopover] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(sortByPosition(destinations));
  }, [destinations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && !target.closest('.destination-action-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDragStart = (event: DragEvent, index: number) => {
    setDraggedIndex(index);
    setOpenMenuId(null);
    setInsertAtPosition(null);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: DragEvent, dropIndex: number) => {
    event.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    const previousItems = items;
    const reorderedItems = [...items];
    const [draggedItem] = reorderedItems.splice(draggedIndex, 1);
    reorderedItems.splice(dropIndex, 0, draggedItem);

    const normalizedItems = withNormalizedPositions(reorderedItems);
    setItems(normalizedItems);
    setDraggedIndex(null);
    setOpenMenuId(null);
    setInsertAtPosition(null);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await reorderDestinationsAction({
          locale,
          tripId,
          orderedIds: normalizedItems.map((destination) => destination.destination_id)
        });
      } catch {
        setItems(previousItems);
        setErrorMessage(locale === 'es' ? 'No se pudo reordenar los destinos.' : 'Could not reorder destinations.');
      }
    });
  };

  const handleAddDestination = (event: FormEvent<HTMLFormElement>, atPosition?: number) => {
    event.preventDefault();

    const trimmedCity = newCity.trim();
    if (!trimmedCity) {
      setErrorMessage(locale === 'es' ? 'La ciudad es obligatoria.' : 'City is required.');
      return;
    }

    const parsedDuration = Number(newDuration);
    const duration = Number.isFinite(parsedDuration) ? parsedDuration : isStopover ? 0 : 2;

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const createdDestination = await createDestinationAction({
          locale,
          tripId,
          city: trimmedCity,
          duration,
          position: atPosition,
          isStopover
        });

        setItems((previousItems) => {
          const nextItems = [...previousItems];
          const normalizedDestination = {
            ...createdDestination,
            transport: null,
            accommodation: null
          };

          if (typeof atPosition === 'number') {
            nextItems.splice(atPosition, 0, normalizedDestination);
            return withNormalizedPositions(nextItems);
          }

          return sortByPosition([...previousItems, normalizedDestination]);
        });
        setExpandedCards((previousCards) => ({
          ...previousCards,
          [createdDestination.destination_id]: false
        }));
        setInsertAtPosition(null);
        setNewCity('');
        setNewDuration('2');
        setIsStopover(false);
      } catch {
        setErrorMessage(locale === 'es' ? 'No se pudo agregar el destino.' : 'Could not add destination.');
      }
    });
  };

  const handleDeleteDestination = (destinationId: number) => {
    const previousItems = items;
    setErrorMessage(null);
    setItems((currentItems) =>
      withNormalizedPositions(currentItems.filter((item) => item.destination_id !== destinationId))
    );
    setExpandedCards((previousCards) => {
      const nextCards = { ...previousCards };
      delete nextCards[destinationId];
      return nextCards;
    });
    setOpenMenuId(null);
    if (editingDestinationId === destinationId) {
      setEditingDestinationId(null);
    }

    startTransition(async () => {
      try {
        await deleteDestinationAction({
          locale,
          tripId,
          destinationId
        });
      } catch {
        setItems(previousItems);
        setErrorMessage(locale === 'es' ? 'No se pudo eliminar el destino.' : 'Could not delete destination.');
      }
    });
  };

  const handleRequestDeleteDestination = (destinationId: number) => {
    setOpenMenuId(null);
    setPendingDeleteId(destinationId);
  };

  const handleConfirmDeleteDestination = () => {
    if (pendingDeleteId === null) {
      return;
    }

    const destinationId = pendingDeleteId;
    setPendingDeleteId(null);
    handleDeleteDestination(destinationId);
  };

  const handleToggleCard = (destinationId: number) => {
    setExpandedCards((previousCards) => ({
      ...previousCards,
      [destinationId]: !previousCards[destinationId]
    }));
  };

  const handleOpenModal = (destinationId: number) => {
    setOpenMenuId(null);
    setErrorMessage(null);
    setEditingDestinationId(destinationId);
  };

  const handleSaveDestinationDetails = (payload: DestinationModalSubmitInput) => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const updatedDestination = await saveDestinationDetailsAction({
          locale,
          tripId,
          destinationId: payload.destinationId,
          city: payload.city,
          duration: payload.duration,
          isStopover: payload.isStopover,
          notes: payload.notes,
          budget: payload.budget,
          transport: payload.transport,
          accommodation: payload.accommodation
        });

        setItems((previousItems) =>
          sortByPosition(
            previousItems.map((item) =>
              item.destination_id === updatedDestination.destination_id ? updatedDestination : item
            )
          )
        );
        setEditingDestinationId(null);
      } catch {
        setErrorMessage(locale === 'es' ? 'No se pudo guardar el destino.' : 'Could not save destination.');
      }
    });
  };

  const editingDestination =
    editingDestinationId === null ? null : items.find((item) => item.destination_id === editingDestinationId) ?? null;

  const addDestinationForm = (showTimelineNode: boolean, atPosition?: number) => (
    <form className="relative flex gap-3 sm:gap-4" onSubmit={(event) => handleAddDestination(event, atPosition)}>
      {showTimelineNode ? (
        <div className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-strong bg-canvas text-foreground-muted sm:h-10 sm:w-10">
          <Plus className="h-4 w-4" />
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-1 flex-col gap-3 rounded-xl border border-dashed border-border-strong bg-elevated p-3 transition-colors duration-base ease-standard focus-within:border-brand-primary sm:p-4',
          showTimelineNode ? '' : 'ml-0'
        )}
      >
        <div className="flex items-center gap-2">
          <input
            checked={isStopover}
            className="h-4 w-4 rounded border-border text-brand-primary"
            disabled={isPending}
            id={atPosition !== undefined ? `stopover-${atPosition}` : 'stopover-bottom'}
            onChange={(event) => {
              setIsStopover(event.target.checked);
              if (event.target.checked) {
                setNewDuration('0');
              } else {
                setNewDuration('2');
              }
            }}
            type="checkbox"
          />
          <label
            className="text-label-md text-foreground-secondary"
            htmlFor={atPosition !== undefined ? `stopover-${atPosition}` : 'stopover-bottom'}
          >
            {tDestinations('stopover')}
          </label>
        </div>

        <div className={cn('grid gap-3', !isStopover && 'sm:grid-cols-2')}>
          <div className="space-y-1">
            <label className="text-label-md text-foreground-secondary">{tDestinations('city')}</label>
            <Input
              disabled={isPending}
              onChange={(event) => setNewCity(event.target.value)}
              placeholder={locale === 'es' ? 'Nueva Ciudad' : 'New City'}
              value={newCity}
            />
          </div>

          {!isStopover ? (
            <div className="space-y-1">
              <label className="text-label-md text-foreground-secondary">{tDestinations('duration')}</label>
              <Input
                disabled={isPending}
                min={1}
                onChange={(event) => setNewDuration(event.target.value)}
                placeholder={locale === 'es' ? 'Días' : 'Days'}
                type="number"
                value={newDuration}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button className="sm:w-auto" disabled={isPending} type="submit">
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                {locale === 'es' ? 'Agregando...' : 'Adding...'}
              </>
            ) : (
              locale === 'es' ? 'Agregar' : 'Add'
            )}
          </Button>
          {typeof atPosition === 'number' ? (
            <Button
              className="sm:w-auto"
              disabled={isPending}
              onClick={() => {
                setInsertAtPosition(null);
                setIsStopover(false);
                setNewDuration('2');
              }}
              type="button"
              variant="outline"
            >
              {tCommon('cancel')}
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );

  return (
    <section className="space-y-4">
      {errorMessage ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-body-sm text-danger">{errorMessage}</p>
      ) : null}

      {items.length === 0 ? (
        <>
          <p className="rounded-lg border border-dashed border-border-strong bg-surface p-4 text-body-sm text-foreground-secondary">
            {locale === 'es' ? 'No hay destinos todavía.' : 'No destinations yet.'}
          </p>
          {addDestinationForm(false)}
        </>
      ) : (
        <div className="relative">
          <div className="absolute bottom-6 left-[1.05rem] top-6 w-px bg-border sm:left-5" />

          {departureCity ? (
            <div className="relative flex gap-3 pb-4 sm:gap-4">
              <div className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-white sm:h-10 sm:w-10">
                <PlaneTakeoff className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <DepartureCard
                  departureCity={departureCity}
                  departureTransport={departureTransport ?? null}
                  locale={locale}
                  nextDestinationCity={items[0]?.city ?? null}
                  startDate={startDate}
                  tripId={tripId}
                />
              </div>
            </div>
          ) : null}

          {items.map((destination, index) => (
            <Fragment key={destination.destination_id}>
              {insertAtPosition === index ? (
                <div className="pb-4">{addDestinationForm(true, index)}</div>
              ) : (
                <div className="group/insert relative flex h-7 items-center">
                  <button
                    className="relative z-10 ml-[0.65rem] flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border-strong bg-canvas text-foreground-muted opacity-0 transition-all duration-fast ease-standard group-hover/insert:opacity-100 hover:border-brand-primary hover:text-brand-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:ml-2"
                    disabled={isPending}
                    onClick={() => {
                      setInsertAtPosition(index);
                      setIsStopover(false);
                      setNewDuration('2');
                    }}
                    title={tDestinations('insertHere')}
                    type="button"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <span className="pointer-events-none absolute left-10 top-1/2 z-20 -translate-y-1/2 rounded-md bg-foreground-primary px-2 py-1 text-label-sm text-canvas opacity-0 transition-opacity duration-fast ease-standard group-hover/insert:opacity-100 group-focus-within/insert:opacity-100">
                    {tDestinations('insertHere')}
                  </span>
                </div>
              )}

              <div
                className={cn('relative flex gap-3 pb-4 sm:gap-4', draggedIndex === index ? 'opacity-60' : null)}
                draggable={!isPending}
                onDragOver={handleDragOver}
                onDragStart={(event) => handleDragStart(event, index)}
                onDrop={(event) => handleDrop(event, index)}
              >
                {destination.is_stopover ? (
                  <div className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-strong bg-elevated text-foreground-secondary sm:h-10 sm:w-10">
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-route/45 bg-canvas text-body-sm font-semibold text-brand-primary sm:h-10 sm:w-10">
                    {index + 1}
                  </div>
                )}
                <div className="flex-1">
                  <DestinationCard
                    destination={destination}
                    destinations={items}
                    expanded={Boolean(expandedCards[destination.destination_id])}
                    index={index}
                    locale={locale}
                    onDelete={() => handleRequestDeleteDestination(destination.destination_id)}
                    onEdit={() => handleOpenModal(destination.destination_id)}
                    onToggle={() => handleToggleCard(destination.destination_id)}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    startDate={startDate}
                    travelDays={travelDays ?? 0}
                  />
                </div>
              </div>
            </Fragment>
          ))}

          {returnCity ? (
            <div className="relative flex gap-3 pb-4 sm:gap-4">
              <div className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-white sm:h-10 sm:w-10">
                <PlaneLanding className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <ReturnCard
                  locale={locale}
                  previousDestinationCity={items[items.length - 1]?.city ?? null}
                  returnCity={returnCity}
                  returnDate={returnDate ?? null}
                  returnTransport={returnTransport ?? null}
                  tripId={tripId}
                />
              </div>
            </div>
          ) : null}

          {insertAtPosition === null ? addDestinationForm(true) : null}
        </div>
      )}

      <DestinationModal
        destination={editingDestination}
        isPending={isPending}
        locale={locale}
        onCancel={() => setEditingDestinationId(null)}
        onSave={handleSaveDestinationDetails}
        open={editingDestination !== null}
      />

      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon('delete')}</DialogTitle>
            <DialogDescription>{tDestinations('confirmDeleteDestination')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setPendingDeleteId(null)} variant="outline">
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleConfirmDeleteDestination} variant="destructive">
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
