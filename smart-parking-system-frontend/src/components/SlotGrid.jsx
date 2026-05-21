import React from 'react';
import {
  Bike,
  Car,
  Truck,
  CheckCircle2,
  XCircle,
  Lock,
  Wrench,
} from 'lucide-react';
import '../styles/SlotGrid.css';

const SlotGrid = ({ slots, onSlotSelect, vehicleType, selectedSlot }) => {
  const getSlotStatus = (slot) => {
    if (slot.status === 'available') return 'available';
    if (slot.status === 'occupied') return 'occupied';
    if (slot.status === 'reserved') return 'reserved';
    return 'maintenance';
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.slotType]) acc[slot.slotType] = [];
    acc[slot.slotType].push(slot);
    return acc;
  }, {});

  const vehicleTypeLabels = {
    twoWheeler:   '2-Wheelers',
    threeWheeler: '3-Wheelers',
    fourWheeler:  '4-Wheelers',
    heavyVehicle: 'Heavy Vehicles',
  };

  const vehicleTypeIcons = {
    twoWheeler:   <Bike size={14} strokeWidth={1.5} />,
    threeWheeler: <Car size={14} strokeWidth={1.5} />,
    fourWheeler:  <Car size={14} strokeWidth={1.5} />,
    heavyVehicle: <Truck size={14} strokeWidth={1.5} />,
  };

  const stats = {
    total:     slots.length,
    available: slots.filter((s) => s.status === 'available').length,
    occupied:  slots.filter((s) => s.status === 'occupied').length,
    reserved:  slots.filter((s) => s.status === 'reserved').length,
  };

  return (
    <div className="slot-grid-container">

      {/* ── Mini stat strip ───────────────────────────────── */}
      <div className="slot-stats-strip">
        <div className="strip-item">
          <span className="strip-dot total" />
          <span className="strip-count">{stats.total}</span>
          <span className="strip-label">Total</span>
        </div>
        <div className="strip-item">
          <span className="strip-dot available" />
          <span className="strip-count">{stats.available}</span>
          <span className="strip-label">Available</span>
        </div>
        <div className="strip-item">
          <span className="strip-dot occupied" />
          <span className="strip-count">{stats.occupied}</span>
          <span className="strip-label">Occupied</span>
        </div>
        <div className="strip-item">
          <span className="strip-dot reserved" />
          <span className="strip-count">{stats.reserved}</span>
          <span className="strip-label">Reserved</span>
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────── */}
      <div className="legend">
        <div className="legend-item">
          <span className="status-dot available" />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <XCircle size={14} className="status-icon occupied" />
          <span>Occupied</span>
        </div>
        <div className="legend-item">
          <Lock size={14} className="status-icon reserved" />
          <span>Reserved</span>
        </div>
        <div className="legend-item">
          <Wrench size={14} className="status-icon maintenance" />
          <span>Maintenance</span>
        </div>
      </div>

      {/* ── Slot sections ─────────────────────────────────── */}
      {Object.entries(groupedSlots).map(([type, typeSlots]) => (
        <div key={type} className="slot-section">
          <h2 className="section-title">
            {vehicleTypeIcons[type]}
            {vehicleTypeLabels[type]}
          </h2>

          <div className="slots-grid">
            {typeSlots.map((slot) => {
              const status = getSlotStatus(slot);
              const isSelectable = status === 'available';
              const isSelected = selectedSlot?.id === slot.id;
              const isUnavailable = status === 'occupied' || status === 'reserved' || status === 'maintenance';

              return (
                <button
                  key={slot.id}
                  className={`slot-card ${status} ${isSelected ? 'selected' : ''} ${isUnavailable ? 'unavailable' : ''}`}
                  onClick={() => isSelectable && onSlotSelect(slot)}
                  disabled={!isSelectable && status !== 'occupied'}
                  title={`Slot ${slot.slotNumber} — ${status}`}
                >
                  {status === 'available' ? (
                    <span className="status-dot available" />
                  ) : (
                    (() => {
                      const StatusIcon = {
                        occupied: XCircle,
                        reserved: Lock,
                        maintenance: Wrench
                      }[status];
                      return <StatusIcon size={14} className={`status-icon ${status}`} />;
                    })()
                  )}

                  <div className="slot-number">{slot.slotNumber}</div>

                  <div className="slot-status-text">{status}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Selected Slot Info ─────────────────────────────── */}
      {selectedSlot && (
        <div className="selected-slot-info">
          <CheckCircle2 size={16} strokeWidth={1.5} className="selected-check" />
          <div>
            <p className="selected-slot-label">Selected Slot</p>
            <p className="selected-slot-value">
              {selectedSlot.slotNumber}
              <span className="selected-slot-type">
                {vehicleTypeLabels[selectedSlot.slotType]}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotGrid;
