'use client';

import { DragEvent, FormEvent, useEffect, useState, useTransition } from 'react';
import {
  createDestinationAction,
  deleteDestinationAction,
  reorderDestinationsAction,
  saveDestinationDetailsAction
} from '@/app/actions/destinations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DestinationWithRelations } from '@/types/database';
import { DestinationCard } from './destination-card';
import { DestinationModal, type DestinationModalSubmitInput } from './destination-modal';

type DestinationListProps = {
  locale: string;
  tripId: number;
  destinations: DestinationWithRelations[];
  startDate: string | null;
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

export function DestinationList({ locale, tripId, destinations, startDate }: DestinationListProps) {
  const [items, setItems] = useState<DestinationWithRelations[]>(() => sortByPosition(destinations));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingDestinationId, setEditingDestinationId] = useState<number | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [newCity, setNewCity] = useState('');
  const [newDuration, setNewDuration] = useState('2');
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

  const handleAddDestination = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCity = newCity.trim();
    if (!trimmedCity) {
      setErrorMessage(locale === 'es' ? 'La ciudad es obligatoria.' : 'City is required.');
      return;
    }

    const parsedDuration = Number(newDuration);
    const duration = Number.isFinite(parsedDuration) ? parsedDuration : 2;

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const createdDestination = await createDestinationAction({
          locale,
          tripId,
          city: trimmedCity,
          duration
        });

        setItems((previousItems) =>
          sortByPosition([
            ...previousItems,
            {
              ...createdDestination,
              transport: null,
              accommodation: null
            }
          ])
        );
        setExpandedCards((previousCards) => ({
          ...previousCards,
          [createdDestination.destination_id]: false
        }));
        setNewCity('');
        setNewDuration('2');
      } catch {
        setErrorMessage(locale === 'es' ? 'No se pudo agregar el destino.' : 'Could not add destination.');
      }
    });
  };

  const handleDeleteDestination = (destinationId: number) => {
    const confirmed = window.confirm(
      locale === 'es' ? '¿Estás seguro de que deseas eliminar?' : 'Are you sure you want to delete?'
    );
    if (!confirmed) {
      return;
    }

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

  return (
    <section className="space-y-4">
      <form
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[2fr_1fr_auto]"
        onSubmit={handleAddDestination}
      >
        <Input
          disabled={isPending}
          onChange={(event) => setNewCity(event.target.value)}
          placeholder={locale === 'es' ? 'Nueva Ciudad' : 'New City'}
          value={newCity}
        />
        <Input
          disabled={isPending}
          min={1}
          onChange={(event) => setNewDuration(event.target.value)}
          placeholder={locale === 'es' ? 'Duración (días)' : 'Duration (days)'}
          type="number"
          value={newDuration}
        />
        <Button disabled={isPending} type="submit">
          {locale === 'es' ? 'Agregar Destino' : 'Add Destination'}
        </Button>
      </form>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          {locale === 'es' ? 'No hay destinos todavía.' : 'No destinations yet.'}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((destination, index) => (
            <div
              key={destination.destination_id}
              draggable={!isPending}
              onDragOver={handleDragOver}
              onDragStart={(event) => handleDragStart(event, index)}
              onDrop={(event) => handleDrop(event, index)}
            >
              <DestinationCard
                destination={destination}
                destinations={items}
                expanded={Boolean(expandedCards[destination.destination_id])}
                index={index}
                isDragging={draggedIndex === index}
                locale={locale}
                onDelete={() => handleDeleteDestination(destination.destination_id)}
                onEdit={() => handleOpenModal(destination.destination_id)}
                onToggle={() => handleToggleCard(destination.destination_id)}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                startDate={startDate}
              />
            </div>
          ))}
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
    </section>
  );
}
