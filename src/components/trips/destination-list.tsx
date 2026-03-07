'use client';

import { DragEvent, FormEvent, Fragment, useCallback, useEffect, useReducer, useState, useTransition } from 'react';
import { ArrowRightLeft, PlaneLanding, PlaneTakeoff, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
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
import type { Destination, DestinationWithRelations, TransportWithLegs } from '@/types/database';
import { DepartureCard } from './departure-card';
import { DestinationCard } from './destination-card';
import type { DestinationModalSubmitInput } from './destination-modal';
import { ReturnCard } from './return-card';

const DestinationModal = dynamic(() =>
  import('./destination-modal').then((mod) => mod.DestinationModal)
);

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

type DestinationListState = {
  items: DestinationWithRelations[];
  expandedCards: Record<number, boolean>;
  openMenuId: number | null;
  editingDestinationId: number | null;
  pendingDeleteId: number | null;
  draggedIndex: number | null;
  errorMessage: string | null;
};

type DestinationListAction =
  | { type: 'SET_ITEMS'; destinations: DestinationWithRelations[] }
  | { type: 'ADD_ITEM'; destination: Destination; atPosition?: number }
  | { type: 'REMOVE_ITEM'; destinationId: number }
  | { type: 'UPDATE_ITEM'; destination: DestinationWithRelations }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'ROLLBACK_ITEMS'; items: DestinationWithRelations[] }
  | { type: 'DRAG_START'; index: number }
  | { type: 'DRAG_END' }
  | { type: 'TOGGLE_CARD'; destinationId: number }
  | { type: 'OPEN_MENU'; destinationId: number | null }
  | { type: 'CLOSE_MENU' }
  | { type: 'OPEN_EDIT'; destinationId: number }
  | { type: 'CLOSE_EDIT' }
  | { type: 'REQUEST_DELETE'; destinationId: number }
  | { type: 'CANCEL_DELETE' }
  | { type: 'CONFIRM_DELETE' }
  | { type: 'SET_ERROR'; message: string | null };

function destinationListReducer(state: DestinationListState, action: DestinationListAction): DestinationListState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: sortByPosition(action.destinations) };

    case 'ADD_ITEM': {
      const newItem = { ...action.destination, transport: null, accommodation: null };
      let nextItems: DestinationWithRelations[];
      if (typeof action.atPosition === 'number') {
        nextItems = [...state.items];
        nextItems.splice(action.atPosition, 0, newItem);
        nextItems = withNormalizedPositions(nextItems);
      } else {
        nextItems = sortByPosition([...state.items, newItem]);
      }
      return {
        ...state,
        items: nextItems,
        expandedCards: { ...state.expandedCards, [action.destination.destination_id]: false }
      };
    }

    case 'REMOVE_ITEM': {
      const nextItems = withNormalizedPositions(
        state.items.filter((item) => item.destination_id !== action.destinationId)
      );
      const nextExpandedCards = { ...state.expandedCards };
      delete nextExpandedCards[action.destinationId];
      return {
        ...state,
        items: nextItems,
        expandedCards: nextExpandedCards,
        openMenuId: null,
        editingDestinationId:
          state.editingDestinationId === action.destinationId ? null : state.editingDestinationId,
        errorMessage: null
      };
    }

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: sortByPosition(
          state.items.map((item) =>
            item.destination_id === action.destination.destination_id ? action.destination : item
          )
        ),
        editingDestinationId: null
      };

    case 'REORDER': {
      const reordered = [...state.items];
      const [draggedItem] = reordered.splice(action.fromIndex, 1);
      reordered.splice(action.toIndex, 0, draggedItem);
      return {
        ...state,
        items: withNormalizedPositions(reordered),
        draggedIndex: null,
        openMenuId: null,
        errorMessage: null
      };
    }

    case 'ROLLBACK_ITEMS':
      return { ...state, items: action.items };

    case 'DRAG_START':
      return { ...state, draggedIndex: action.index, openMenuId: null };

    case 'DRAG_END':
      return { ...state, draggedIndex: null };

    case 'TOGGLE_CARD':
      return {
        ...state,
        expandedCards: {
          ...state.expandedCards,
          [action.destinationId]: !state.expandedCards[action.destinationId]
        }
      };

    case 'OPEN_MENU':
      return { ...state, openMenuId: action.destinationId };

    case 'CLOSE_MENU':
      return { ...state, openMenuId: null };

    case 'OPEN_EDIT':
      return { ...state, openMenuId: null, errorMessage: null, editingDestinationId: action.destinationId };

    case 'CLOSE_EDIT':
      return { ...state, editingDestinationId: null };

    case 'REQUEST_DELETE':
      return { ...state, openMenuId: null, pendingDeleteId: action.destinationId };

    case 'CANCEL_DELETE':
      return { ...state, pendingDeleteId: null };

    case 'CONFIRM_DELETE':
      return { ...state, pendingDeleteId: null };

    case 'SET_ERROR':
      return { ...state, errorMessage: action.message };

    default:
      return state;
  }
}

function createInitialState(destinations: DestinationWithRelations[]): DestinationListState {
  return {
    items: sortByPosition(destinations),
    expandedCards: {},
    openMenuId: null,
    editingDestinationId: null,
    pendingDeleteId: null,
    draggedIndex: null,
    errorMessage: null
  };
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
  const tErrors = useTranslations('errors');
  const [state, dispatch] = useReducer(destinationListReducer, destinations, createInitialState);
  const { items, expandedCards, openMenuId, editingDestinationId, pendingDeleteId, draggedIndex, errorMessage } = state;
  const [insertAtPosition, setInsertAtPosition] = useState<number | null>(null);
  const [newCity, setNewCity] = useState('');
  const [newDuration, setNewDuration] = useState('2');
  const [isStopover, setIsStopover] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    dispatch({ type: 'SET_ITEMS', destinations });
  }, [destinations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && !target.closest('.destination-action-menu')) {
        dispatch({ type: 'CLOSE_MENU' });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSetOpenMenuId = useCallback(
    (destinationId: number | null) => {
      dispatch(destinationId === null ? { type: 'CLOSE_MENU' } : { type: 'OPEN_MENU', destinationId });
    },
    []
  );

  const handleDragStart = (event: DragEvent, index: number) => {
    dispatch({ type: 'DRAG_START', index });
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
    dispatch({ type: 'REORDER', fromIndex: draggedIndex, toIndex: dropIndex });
    setInsertAtPosition(null);

    startTransition(async () => {
      try {
        const reordered = [...previousItems];
        const [draggedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(dropIndex, 0, draggedItem);
        const normalizedItems = withNormalizedPositions(reordered);
        await reorderDestinationsAction({
          locale,
          tripId,
          orderedIds: normalizedItems.map((destination) => destination.destination_id)
        });
      } catch {
        dispatch({ type: 'ROLLBACK_ITEMS', items: previousItems });
        dispatch({
          type: 'SET_ERROR',
          message: tErrors('reorderDestinations')
        });
      }
    });
  };

  const handleAddDestination = (event: FormEvent<HTMLFormElement>, atPosition?: number) => {
    event.preventDefault();

    const trimmedCity = newCity.trim();
    if (!trimmedCity) {
      dispatch({ type: 'SET_ERROR', message: tErrors('cityRequired') });
      return;
    }

    const parsedDuration = Number(newDuration);
    const duration = Number.isFinite(parsedDuration) ? parsedDuration : isStopover ? 0 : 2;

    dispatch({ type: 'SET_ERROR', message: null });

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

        dispatch({ type: 'ADD_ITEM', destination: createdDestination, atPosition });
        setInsertAtPosition(null);
        setNewCity('');
        setNewDuration('2');
        setIsStopover(false);
      } catch {
        dispatch({
          type: 'SET_ERROR',
          message: tErrors('addDestination')
        });
      }
    });
  };

  const handleDeleteDestination = useCallback(
    (destinationId: number) => {
      const previousItems = items;
      dispatch({ type: 'REMOVE_ITEM', destinationId });

      startTransition(async () => {
        try {
          await deleteDestinationAction({
            locale,
            tripId,
            destinationId
          });
        } catch {
          dispatch({ type: 'ROLLBACK_ITEMS', items: previousItems });
          dispatch({
            type: 'SET_ERROR',
            message: tErrors('deleteDestination')
          });
        }
      });
    },
    [items, locale, tripId, startTransition, tErrors]
  );

  const handleRequestDeleteDestination = useCallback((destinationId: number) => {
    dispatch({ type: 'REQUEST_DELETE', destinationId });
  }, []);

  const handleConfirmDeleteDestination = useCallback(() => {
    if (pendingDeleteId === null) {
      return;
    }

    const destinationId = pendingDeleteId;
    dispatch({ type: 'CONFIRM_DELETE' });
    handleDeleteDestination(destinationId);
  }, [handleDeleteDestination, pendingDeleteId]);

  const handleToggleCard = useCallback((destinationId: number) => {
    dispatch({ type: 'TOGGLE_CARD', destinationId });
  }, []);

  const handleOpenModal = useCallback((destinationId: number) => {
    dispatch({ type: 'OPEN_EDIT', destinationId });
  }, []);

  const handleSaveDestinationDetails = (payload: DestinationModalSubmitInput) => {
    dispatch({ type: 'SET_ERROR', message: null });

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

        dispatch({ type: 'UPDATE_ITEM', destination: updatedDestination });
      } catch {
        dispatch({
          type: 'SET_ERROR',
          message: tErrors('saveDestination')
        });
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
              placeholder={tDestinations('newCity')}
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
                placeholder={tDestinations('daysPlaceholder')}
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
                {tCommon('adding')}
              </>
            ) : (
              tCommon('add')
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
            {tDestinations('noDestinationsHint')}
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
                    isMenuOpen={openMenuId === destination.destination_id}
                    index={index}
                    locale={locale}
                    onDelete={handleRequestDeleteDestination}
                    onEdit={handleOpenModal}
                    onToggle={handleToggleCard}
                    setOpenMenuId={handleSetOpenMenuId}
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

      {editingDestination ? (
        <DestinationModal
          destination={editingDestination}
          isPending={isPending}
          onCancel={() => dispatch({ type: 'CLOSE_EDIT' })}
          onSave={handleSaveDestinationDetails}
          open
        />
      ) : null}

      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            dispatch({ type: 'CANCEL_DELETE' });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon('delete')}</DialogTitle>
            <DialogDescription>{tDestinations('confirmDeleteDestination')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => dispatch({ type: 'CANCEL_DELETE' })} variant="outline">
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
