import React, { useState, useEffect } from 'react';
import { Plane, Train, Bus, Hotel, StickyNote, DollarSign, MapPin, Clock, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Download, Upload, GripVertical, Calendar, MoreVertical } from 'lucide-react';

const TravelPlanner = () => {
  const [tripTitle, setTripTitle] = useState('Mi Viaje');
  const [startDate, setStartDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndDateOptions, setShowEndDateOptions] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [endDateDiff, setEndDateDiff] = useState(0);
  const [endDateAction, setEndDateAction] = useState('add');
  const [departure, setDeparture] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [returnTrip, setReturnTrip] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('travel-planner-data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTripTitle(data.title || 'Mi Viaje');
        setStartDate(data.startDate || null);
        setDeparture(data.departure || null);
        setDestinations(data.destinations || []);
        setReturnTrip(data.return || null);
      } catch (e) {
        console.error('Error loading data:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const data = {
      title: tripTitle,
      startDate,
      departure,
      destinations,
      return: returnTrip
    };
    localStorage.setItem('travel-planner-data', JSON.stringify(data));
  }, [tripTitle, startDate, departure, destinations, returnTrip]);

  const calculateDate = (baseDate, daysToAdd) => {
    if (!baseDate) return null;
    const date = new Date(baseDate);
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getTotalDays = () => {
    return destinations.reduce((sum, dest) => sum + (dest.duration || 0), 0);
  };

  const getDestinationDates = (index) => {
    if (!startDate) return { start: null, end: null };
    
    let dayOffset = 0;
    for (let i = 0; i < index; i++) {
      dayOffset += destinations[i].duration || 0;
    }
    
    const start = calculateDate(startDate, dayOffset);
    const end = calculateDate(startDate, dayOffset + (destinations[index].duration || 0));
    
    return { start, end };
  };

  const handleConfirmStartDate = () => {
    if (!tempDate) {
      alert('Selecciona una fecha');
      return;
    }
    setStartDate(tempDate);
    if (!departure) {
      setDeparture({
        type: 'departure',
        city: 'Buenos Aires',
        date: tempDate,
        transport: {}
      });
    } else {
      setDeparture({
        ...departure,
        date: tempDate
      });
    }
    setShowDatePicker(false);
    setTempDate('');
  };

  const handleEditStartDate = () => {
    setTempDate(startDate || '');
    setShowDatePicker(true);
  };

  const handleEditEndDate = () => {
    const endDate = calculateDate(startDate, getTotalDays());
    setTempEndDate(endDate);
    setShowEndDatePicker(true);
  };

  const handleConfirmEndDate = () => {
    if (!tempEndDate || !startDate) {
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(tempEndDate);
    const newTotalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const currentTotalDays = getTotalDays();
    const difference = newTotalDays - currentTotalDays;
    
    // No debería llegar aquí si hay colisión (botón está deshabilitado), pero por seguridad
    if (end < start || (destinations.length > 0 && difference < 0)) {
      return;
    }
    
    // B1: Fecha posterior - Mostrar opciones
    if (difference > 0 && destinations.length > 0) {
      setEndDateDiff(difference);
      setShowEndDatePicker(false);
      setShowEndDateOptions(true);
      return;
    }
    
    // Si no hay destinos o diferencia es 0, simplemente actualizar
    setShowEndDatePicker(false);
    setTempEndDate('');
  };

  const handleConfirmEndDateAction = () => {
    if (endDateAction === 'add') {
      // Crear nueva ciudad con los días disponibles
      const newDest = {
        id: Date.now().toString(),
        city: 'Nueva Ciudad',
        duration: endDateDiff,
        transport: {},
        accommodation: {},
        notes: '',
        budget: null
      };
      setDestinations([...destinations, newDest]);
    } else if (endDateAction === 'extend') {
      // Extender última ciudad
      const updatedDestinations = [...destinations];
      const lastIndex = updatedDestinations.length - 1;
      updatedDestinations[lastIndex] = {
        ...updatedDestinations[lastIndex],
        duration: updatedDestinations[lastIndex].duration + endDateDiff
      };
      setDestinations(updatedDestinations);
    }
    
    setShowEndDateOptions(false);
    setEndDateDiff(0);
    setEndDateAction('add');
    setTempEndDate('');
  };

  const handleAddDestination = () => {
    if (!startDate) {
      alert('Primero debes configurar la fecha de salida');
      return;
    }
    
    const newDest = {
      id: Date.now().toString(),
      city: '',
      duration: 2,
      transport: {},
      accommodation: {},
      notes: '',
      budget: null
    };
    setEditingCard({ ...newDest, isNew: true });
    setShowModal(true);
  };

  const handleSaveCard = (cardData) => {
    if (cardData.type === 'departure') {
      const updatedDeparture = {
        ...departure,
        ...cardData,
        type: 'departure'
      };
      setDeparture(updatedDeparture);
    } else if (cardData.type === 'return') {
      const updatedReturn = {
        ...returnTrip,
        ...cardData,
        type: 'return'
      };
      setReturnTrip(updatedReturn);
    } else {
      if (cardData.isNew) {
        const { isNew, ...destData } = cardData;
        setDestinations([...destinations, destData]);
      } else {
        setDestinations(destinations.map(d => 
          d.id === cardData.id ? { ...d, ...cardData } : d
        ));
      }
    }
    
    setShowModal(false);
    setEditingCard(null);
  };

  const handleEditCard = (card, type = null) => {
    setEditingCard({ ...card, type });
    setShowModal(true);
  };

  const handleDeleteDestination = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      setDestinations(destinations.filter(d => d.id !== deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newDestinations = [...destinations];
    const [draggedItem] = newDestinations.splice(draggedIndex, 1);
    newDestinations.splice(dropIndex, 0, draggedItem);
    
    setDestinations(newDestinations);
    setDraggedIndex(null);
  };

  const exportJSON = () => {
    const data = {
      title: tripTitle,
      startDate,
      departure,
      destinations,
      return: returnTrip
    };
    setExportData(JSON.stringify(data, null, 2));
    setShowExportModal(true);
    setCopySuccess(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert('Error al copiar al portapapeles');
    }
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setTripTitle(data.title || 'Mi Viaje');
        setStartDate(data.startDate || null);
        setDeparture(data.departure || null);
        setDestinations(data.destinations || []);
        setReturnTrip(data.return || null);
      } catch (e) {
        alert('Error al importar el archivo');
      }
    };
    reader.readAsText(file);
  };

  const getTransportIcon = (transport) => {
    if (!transport || !transport.company) return null;
    const company = transport.company.toLowerCase();
    if (company.includes('aerolínea') || company.includes('airline') || company.includes('vuelo')) return Plane;
    if (company.includes('tren') || company.includes('train')) return Train;
    if (company.includes('bus') || company.includes('autobús')) return Bus;
    return Plane;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <input
            type="text"
            value={tripTitle}
            onChange={(e) => setTripTitle(e.target.value)}
            className="text-3xl font-bold mb-4 w-full border-none focus:outline-none"
            placeholder="Nombre del viaje"
          />
          
          {startDate && (
            <div className="text-gray-600 mb-4 flex items-center gap-2 flex-wrap">
              <button
                onClick={handleEditStartDate}
                className="font-medium hover:text-blue-600 underline decoration-dotted"
              >
                {formatDate(startDate)}
              </button>
              {destinations.length > 0 && (
                <>
                  {' '}-{' '}
                  <button
                    onClick={handleEditEndDate}
                    className="font-medium hover:text-blue-600 underline decoration-dotted"
                  >
                    {formatDate(calculateDate(startDate, getTotalDays()))}
                  </button>
                  {' '}({getTotalDays()} días)
                </>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {!startDate ? (
              <button
                onClick={() => setShowDatePicker(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Calendar className="w-4 h-4" />
                Configurar fecha de inicio
              </button>
            ) : (
              <>
                <button
                  onClick={handleAddDestination}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Destino
                </button>
                <button
                  onClick={exportJSON}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Importar
                  <input type="file" accept=".json" onChange={importJSON} className="hidden" />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Fecha de Salida</h3>
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="w-full p-2 border rounded-lg mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmStartDate}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowDatePicker(false);
                    setTempDate('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* End Date Picker Modal */}
        {showEndDatePicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Fecha de Regreso</h3>
              <p className="text-sm text-gray-600 mb-3">
                Selecciona la nueva fecha de regreso de tu viaje.
              </p>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="w-full p-2 border rounded-lg mb-4"
              />
              
              {/* Validation Messages */}
              {tempEndDate && (() => {
                if (!startDate) return null;
                
                const selectedEnd = new Date(tempEndDate);
                const tripStart = new Date(startDate);
                
                // Tipo 2: Fecha de regreso anterior a fecha de inicio
                if (selectedEnd < tripStart) {
                  return (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>⚠️ Fecha inválida:</strong> La fecha de regreso ({formatDate(tempEndDate)}) no puede ser anterior a la fecha de inicio del viaje ({formatDate(startDate)}).
                      </p>
                    </div>
                  );
                }
                
                // Tipo 1: Fecha anterior a ciudades existentes
                if (destinations.length > 0) {
                  const currentEndDate = calculateDate(startDate, getTotalDays());
                  const calculatedEnd = new Date(currentEndDate);
                  
                  if (selectedEnd < calculatedEnd) {
                    const lastCity = destinations[destinations.length - 1].city || 'tu última ciudad';
                    return (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>⚠️ Colisión detectada:</strong> La fecha seleccionada ({formatDate(tempEndDate)}) es anterior al último día en {lastCity} que termina el {formatDate(currentEndDate)}.
                        </p>
                        <p className="text-sm text-red-700 mt-2">
                          Para adelantar el regreso, primero reduce la duración de tus destinos.
                        </p>
                      </div>
                    );
                  }
                }
                
                return null;
              })()}
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmEndDate}
                  disabled={tempEndDate && (() => {
                    if (!startDate) return true;
                    const selectedEnd = new Date(tempEndDate);
                    const tripStart = new Date(startDate);
                    
                    // Deshabilitar si es anterior a fecha de inicio
                    if (selectedEnd < tripStart) return true;
                    
                    // Deshabilitar si es anterior a última ciudad
                    if (destinations.length > 0) {
                      const currentEndDate = calculateDate(startDate, getTotalDays());
                      const calculatedEnd = new Date(currentEndDate);
                      if (selectedEnd < calculatedEnd) return true;
                    }
                    
                    return false;
                  })()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowEndDatePicker(false);
                    setTempEndDate('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* End Date Options Modal */}
        {showEndDateOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Días adicionales disponibles</h3>
              <p className="text-gray-700 mb-4">
                Hay <strong>{endDateDiff} días adicionales</strong> disponibles ({formatDate(calculateDate(startDate, getTotalDays()))} - {formatDate(tempEndDate)})
              </p>
              <p className="text-sm text-gray-600 mb-4">¿Qué deseas hacer?</p>
              
              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="endDateAction"
                    value="add"
                    checked={endDateAction === 'add'}
                    onChange={(e) => setEndDateAction(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Dejar disponible para agregar destinos</div>
                    <div className="text-sm text-gray-600">Se creará una nueva ciudad con {endDateDiff} días</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="endDateAction"
                    value="extend"
                    checked={endDateAction === 'extend'}
                    onChange={(e) => setEndDateAction(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">
                      Extender {destinations.length > 0 ? destinations[destinations.length - 1].city : 'última ciudad'} a {destinations.length > 0 ? destinations[destinations.length - 1].duration + endDateDiff : endDateDiff} días
                    </div>
                    <div className="text-sm text-gray-600">Se agregarán {endDateDiff} días al destino actual</div>
                  </div>
                </label>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmEndDateAction}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowEndDateOptions(false);
                    setEndDateDiff(0);
                    setEndDateAction('add');
                    setTempEndDate('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Departure Card */}
          {departure && (
            <TripCard
              card={departure}
              type="departure"
              expanded={expandedCards['departure']}
              onToggle={() => toggleExpand('departure')}
              onEdit={() => handleEditCard(departure, 'departure')}
              color="bg-green-50 border-green-200"
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              cardId="departure"
            />
          )}

          {/* Destination Cards */}
          {destinations.map((dest, index) => {
            const dates = getDestinationDates(index);
            return (
              <div
                key={dest.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className="relative"
              >
                <TripCard
                  card={dest}
                  dates={dates}
                  expanded={expandedCards[dest.id]}
                  onToggle={() => toggleExpand(dest.id)}
                  onEdit={() => handleEditCard(dest)}
                  onDelete={() => handleDeleteDestination(dest.id)}
                  color="bg-orange-50 border-orange-200"
                  isDragging={draggedIndex === index}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  cardId={dest.id}
                />
              </div>
            );
          })}

          {/* Return Card */}
          {startDate && destinations.length > 0 && (
            <TripCard
              card={returnTrip || {
                type: 'return',
                city: departure?.city || 'Buenos Aires',
                date: calculateDate(startDate, getTotalDays()),
                transport: {}
              }}
              type="return"
              expanded={expandedCards['return']}
              onToggle={() => toggleExpand('return')}
              onEdit={() => handleEditCard(
                returnTrip || { 
                  type: 'return', 
                  city: departure?.city || 'Buenos Aires', 
                  transport: {} 
                }, 
                'return'
              )}
              color="bg-blue-50 border-blue-200"
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              cardId="return"
            />
          )}
        </div>

        {/* Edit Modal */}
        {showModal && (
          <EditModal
            card={editingCard}
            onSave={handleSaveCard}
            onCancel={() => {
              setShowModal(false);
              setEditingCard(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Confirmar eliminación</h3>
              <p className="text-gray-700 mb-6">¿Estás seguro de que deseas eliminar este destino?</p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Eliminar
                </button>
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export JSON Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
              <h3 className="text-xl font-bold mb-4">Exportar Itinerario</h3>
              <p className="text-sm text-gray-600 mb-3">
                Copia el contenido JSON a continuación para guardar tu itinerario.
              </p>
              <textarea
                value={exportData}
                readOnly
                className="flex-1 w-full p-3 border rounded-lg font-mono text-sm mb-4 overflow-auto"
                rows="15"
              />
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  {copySuccess ? (
                    <>
                      <span>✓</span>
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Copiar al portapapeles
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TripCard = ({ card, dates, expanded, onToggle, onEdit, onDelete, color, type, isDragging, openMenuId, setOpenMenuId, cardId }) => {
  const getTransportIconByType = (transportType) => {
    if (!transportType) return Plane;
    if (transportType === 'plane') return Plane;
    if (transportType === 'train') return Train;
    if (transportType === 'bus') return Bus;
    return Plane;
  };
  
  const TransportIcon = getTransportIconByType(card.transport?.type);
  const hasTransport = card.transport && Object.keys(card.transport).some(k => card.transport[k]);
  const hasAccommodation = card.accommodation && Object.keys(card.accommodation).some(k => card.accommodation[k]);
  
  const isSpecial = type === 'departure' || type === 'return';
  const displayCity = isSpecial 
    ? (type === 'departure' ? `Salida desde ${card.city || 'Buenos Aires'}` : `Regreso a ${card.city || 'Buenos Aires'}`)
    : card.city;

  // Obtener campos completados
  const getCompletedFields = (obj, maxFields = 2) => {
    if (!obj) return [];
    const fields = [];
    const fieldMap = {
      leaveAccommodationTime: 'Salida alojamiento',
      terminal: 'Terminal',
      company: 'Empresa',
      bookingNumber: 'N° Boleto',
      bookingCode: 'Código',
      departureTime: 'Hora salida',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      name: 'Nombre',
      bookingLink: 'Link',
      address: 'Dirección'
    };
    
    for (const [key, label] of Object.entries(fieldMap)) {
      if (obj[key]) {
        fields.push({ label, value: obj[key] });
        if (fields.length >= maxFields) break;
      }
    }
    return fields;
  };

  const transportPreview = getCompletedFields(card.transport, 2);
  const accommodationPreview = getCompletedFields(card.accommodation, 2);
  
  // Verificar si hay contenido adicional para mostrar separador
  const hasMoreContent = () => {
    if (isSpecial) return false;
    
    const transportFields = card.transport ? Object.keys(card.transport).filter(k => card.transport[k]).length : 0;
    const accommodationFields = card.accommodation ? Object.keys(card.accommodation).filter(k => card.accommodation[k]).length : 0;
    
    return (
      transportFields > 2 ||
      accommodationFields > 2 ||
      card.notes ||
      card.budget
    );
  };

  const showSeparator = hasMoreContent();

  // Cerrar menú al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId === cardId && !e.target.closest('.action-menu')) {
        setOpenMenuId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId, cardId, setOpenMenuId]);

  return (
    <div className={`mb-6 ${isDragging ? 'opacity-50' : ''}`}>
      <div className={`rounded-lg border-2 ${color} shadow-sm overflow-hidden`}>
        {/* Header */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {!isSpecial && <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />}
                {hasTransport && TransportIcon && <TransportIcon className="w-5 h-5 text-gray-600" />}
                {hasAccommodation && <Hotel className="w-5 h-5 text-gray-600" />}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {displayCity || 'Nueva Ciudad'}
              </h3>
              
              {!isSpecial && card.duration && (
                <p className="text-sm text-gray-600 mb-2">{card.duration} días</p>
              )}
              
              {dates && dates.start && (
                <p className="text-sm text-gray-500">
                  {formatDate(dates.start)} - {formatDate(dates.end)}
                </p>
              )}
              
              {(type === 'departure' || type === 'return') && card.date && (
                <p className="text-sm text-gray-500">{formatDate(card.date)}</p>
              )}
            </div>
            
            {/* Menú de acciones para destinos */}
            {!isSpecial && (
              <div className="relative action-menu">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === cardId ? null : cardId);
                  }}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                
                {/* Dropdown */}
                {openMenuId === cardId && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[150px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        onEdit();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        onDelete();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Botón editar para cards especiales */}
            {isSpecial && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Vista previa colapsada */}
          {!expanded && !isSpecial && (
            <div className="space-y-3 text-sm text-gray-700">
              {transportPreview.length > 0 && (
                <div className="space-y-1">
                  {transportPreview.map((field, idx) => (
                    <p key={idx}><span className="text-gray-500">{field.label}:</span> {field.value}</p>
                  ))}
                </div>
              )}
              {accommodationPreview.length > 0 && (
                <div className="space-y-1">
                  {accommodationPreview.map((field, idx) => (
                    <p key={idx}><span className="text-gray-500">{field.label}:</span> {field.value}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Separador clickeable */}
          {showSeparator && (
            <button
              onClick={onToggle}
              className="w-full mt-4 pt-4 border-t border-gray-300 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 transition-colors group"
            >
              <div className="flex-1 h-px bg-gray-300 group-hover:bg-gray-400"></div>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <div className="flex-1 h-px bg-gray-300 group-hover:bg-gray-400"></div>
            </button>
          )}

          {/* Contenido expandido */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              {/* Transport Section */}
              {hasTransport && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    {TransportIcon && <TransportIcon className="w-4 h-4" />}
                    TRANSPORTE
                  </h4>
                  <div className="space-y-1 text-sm text-gray-700 ml-6">
                    {card.transport.leaveAccommodationTime && (
                      <p>Salida alojamiento: {card.transport.leaveAccommodationTime}</p>
                    )}
                    {card.transport.terminal && <p>Terminal: {card.transport.terminal}</p>}
                    {card.transport.company && <p>Empresa: {card.transport.company}</p>}
                    {(card.transport.bookingNumber || card.transport.bookingCode) && (
                      <p>Reserva: {[card.transport.bookingNumber, card.transport.bookingCode].filter(Boolean).join(' / ')}</p>
                    )}
                    {card.transport.departureTime && <p>Hora salida: {card.transport.departureTime}</p>}
                  </div>
                </div>
              )}

              {/* Accommodation Section */}
              {hasAccommodation && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Hotel className="w-4 h-4" />
                    HOSPEDAJE
                  </h4>
                  <div className="space-y-1 text-sm text-gray-700 ml-6">
                    {(card.accommodation.checkIn || card.accommodation.checkOut) && (
                      <p>
                        Check-in: {card.accommodation.checkIn || '-'} | Check-out: {card.accommodation.checkOut || '-'}
                      </p>
                    )}
                    {card.accommodation.name && <p>{card.accommodation.name}</p>}
                    {(card.accommodation.bookingLink || card.accommodation.bookingCode) && (
                      <p>Reserva: {card.accommodation.bookingCode || card.accommodation.bookingLink}</p>
                    )}
                    {card.accommodation.address && <p>{card.accommodation.address}</p>}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {card.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    NOTAS
                  </h4>
                  <p className="text-sm text-gray-700 ml-6">{card.notes}</p>
                </div>
              )}

              {/* Budget Section */}
              {card.budget && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    PRESUPUESTO
                  </h4>
                  <p className="text-sm text-gray-700 ml-6">${card.budget}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ card, onSave, onCancel }) => {
  const [formData, setFormData] = useState(card || {});
  const [showTransport, setShowTransport] = useState(false);
  const [showAccommodation, setShowAccommodation] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  const isSpecial = card.type === 'departure' || card.type === 'return';

  const getTransportIconForModal = () => {
    const type = formData.transport?.type || 'plane';
    if (type === 'plane') return Plane;
    if (type === 'train') return Train;
    if (type === 'bus') return Bus;
    return Plane;
  };

  const TransportIconModal = getTransportIconForModal();

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.city) {
      alert('El nombre de la ciudad es obligatorio');
      return;
    }
    if (!isSpecial && (!formData.duration || formData.duration < 1)) {
      alert('La duración debe ser al menos 1 día');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8 max-h-[85vh] flex flex-col">
        {/* Header fijo */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">
            {isSpecial ? (card.type === 'departure' ? 'Salida' : 'Regreso') : 'Editar Destino'}
          </h2>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* General Info */}
        <div className="mb-6 space-y-4">
          {isSpecial && (
            <div>
              <label className="block text-sm font-medium mb-1">Ciudad *</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleChange(null, 'city', e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="Ej: Buenos Aires"
              />
            </div>
          )}
          {!isSpecial && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Ciudad *</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => handleChange(null, 'city', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Ej: Madrid"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duración (días) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration || 2}
                  onChange={(e) => handleChange(null, 'duration', parseInt(e.target.value))}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </>
          )}
        </div>

          {/* Transport Section */}
          <div className="mb-6">
            <button
              onClick={() => setShowTransport(!showTransport)}
              className="flex items-center justify-between w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <span className="font-semibold flex items-center gap-2">
                <TransportIconModal className="w-4 h-4" />
                Transporte
              </span>
              {showTransport ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {showTransport && (
              <div className="mt-4 space-y-4 pl-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de transporte</label>
                  <select
                    value={formData.transport?.type || 'plane'}
                    onChange={(e) => handleChange('transport', 'type', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="plane">Avión</option>
                    <option value="train">Tren</option>
                    <option value="bus">Bus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora salida del alojamiento</label>
                  <input
                    type="time"
                    value={formData.transport?.leaveAccommodationTime || ''}
                    onChange={(e) => handleChange('transport', 'leaveAccommodationTime', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Terminal de origen</label>
                  <input
                    type="text"
                    value={formData.transport?.terminal || ''}
                    onChange={(e) => handleChange('transport', 'terminal', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Ej: Aeropuerto Barajas - T4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Empresa</label>
                  <input
                    type="text"
                    value={formData.transport?.company || ''}
                    onChange={(e) => handleChange('transport', 'company', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Ej: Iberia, Renfe, Alsa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Número de boleto</label>
                  <input
                    type="text"
                    value={formData.transport?.bookingNumber || ''}
                    onChange={(e) => handleChange('transport', 'bookingNumber', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código de reserva</label>
                  <input
                    type="text"
                    value={formData.transport?.bookingCode || ''}
                    onChange={(e) => handleChange('transport', 'bookingCode', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora de salida del transporte</label>
                  <input
                    type="time"
                    value={formData.transport?.departureTime || ''}
                    onChange={(e) => handleChange('transport', 'departureTime', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Accommodation Section */}
          {!isSpecial && (
            <div className="mb-6">
              <button
                onClick={() => setShowAccommodation(!showAccommodation)}
                className="flex items-center justify-between w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <span className="font-semibold flex items-center gap-2">
                  <Hotel className="w-4 h-4" />
                  Hospedaje
                </span>
                {showAccommodation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {showAccommodation && (
                <div className="mt-4 space-y-4 pl-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Check-in</label>
                      <input
                        type="time"
                        value={formData.accommodation?.checkIn || ''}
                        onChange={(e) => handleChange('accommodation', 'checkIn', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Check-out</label>
                      <input
                        type="time"
                        value={formData.accommodation?.checkOut || ''}
                        onChange={(e) => handleChange('accommodation', 'checkOut', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre del alojamiento</label>
                    <input
                      type="text"
                      value={formData.accommodation?.name || ''}
                      onChange={(e) => handleChange('accommodation', 'name', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Ej: Hotel Ejemplo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link de reserva</label>
                    <input
                      type="text"
                      value={formData.accommodation?.bookingLink || ''}
                      onChange={(e) => handleChange('accommodation', 'bookingLink', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Código de reserva</label>
                    <input
                      type="text"
                      value={formData.accommodation?.bookingCode || ''}
                      onChange={(e) => handleChange('accommodation', 'bookingCode', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dirección</label>
                    <input
                      type="text"
                      value={formData.accommodation?.address || ''}
                      onChange={(e) => handleChange('accommodation', 'address', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Calle, número, ciudad"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Section */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdditional(!showAdditional)}
              className="flex items-center justify-between w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <span className="font-semibold flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                Adicionales
              </span>
              {showAdditional ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {showAdditional && (
              <div className="mt-4 space-y-4 pl-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Notas</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleChange(null, 'notes', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    rows="3"
                    placeholder="Lugares para visitar, recordatorios, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Presupuesto estimado</label>
                  <input
                    type="number"
                    value={formData.budget || ''}
                    onChange={(e) => handleChange(null, 'budget', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export default TravelPlanner;