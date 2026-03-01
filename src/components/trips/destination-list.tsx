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
import type { DestinationWithRelations, Transport } from '@/types/database';
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
  departureTransport?: Transport | null;
  travelDays?: number;
  returnCity?: string;
  returnDate?: string | null;
  returnTransport?: Transport | null;
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
    <form className="relative flex gap-4" onSubmit={(event) => handleAddDestination(event, atPosition)}>
      {showTimelineNode ? (
        <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400">
          <Plus className="h-4 w-4" />
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-1 gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 transition-colors focus-within:border-primary-400 focus-within:bg-primary-50/30',
          showTimelineNode ? '' : 'ml-0'
        )}
      >
        <div className="flex items-center gap-2">
          <input
            checked={isStopover}
            className="h-4 w-4 rounded border-slate-300 text-primary-600"
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
            className="text-xs font-medium text-slate-500"
            htmlFor={atPosition !== undefined ? `stopover-${atPosition}` : 'stopover-bottom'}
          >
            {tDestinations('stopover')}
          </label>
        </div>
        <div className="flex flex-[2] flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">{tDestinations('city')}</label>
          <Input
            disabled={isPending}
            onChange={(event) => setNewCity(event.target.value)}
            placeholder={locale === 'es' ? 'Nueva Ciudad' : 'New City'}
            value={newCity}
          />
        </div>
        {!isStopover ? (
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">{tDestinations('duration')}</label>
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
        <Button className="self-end" disabled={isPending} type="submit">
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
            className="self-end"
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
    </form>
  );

  return (
    <section className="space-y-4">
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      {items.length === 0 ? (
        <>
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            {locale === 'es' ? 'No hay destinos todavía.' : 'No destinations yet.'}
          </p>
          {addDestinationForm(false)}
        </>
      ) : (
        <div className="relative space-y-0">
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-slate-200" />
          {departureCity ? (
            <div className="relative flex gap-4 pb-4">
              <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
                <PlaneTakeoff className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <DepartureCard
                  departureCity={departureCity}
                  departureTransport={departureTransport ?? null}
                  locale={locale}
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
                <div className="group/insert relative flex h-6 items-center">
                  <button
                    className="relative z-10 ml-2.5 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-400 opacity-0 transition-all duration-150 group-hover/insert:opacity-100 hover:border-primary-400 hover:text-primary-500 focus-visible:opacity-100"
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
                  <span className="pointer-events-none absolute left-10 top-1/2 z-20 -translate-y-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover/insert:opacity-100 group-focus-within/insert:opacity-100">
                    {tDestinations('insertHere')}
                  </span>
                </div>
              )}
              <div
                draggable={!isPending}
                onDragOver={handleDragOver}
                onDragStart={(event) => handleDragStart(event, index)}
                onDrop={(event) => handleDrop(event, index)}
                className={cn('relative flex gap-4 pb-4', draggedIndex === index ? 'opacity-60' : null)}
              >
                {destination.is_stopover ? (
                  <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-amber-300 bg-amber-50 text-amber-600">
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary-300 bg-white text-sm font-bold text-primary-700">
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
            <div className="relative flex gap-4 pb-4">
              <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
                <PlaneLanding className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <ReturnCard
                  locale={locale}
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
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteDestination}>
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
