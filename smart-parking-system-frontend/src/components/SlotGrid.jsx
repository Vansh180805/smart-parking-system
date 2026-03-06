import React from 'react';
import '../styles/SlotGrid.css';

const SlotGrid = ({ slots, onSlotSelect, vehicleType, selectedSlot }) => {
  const getSlotStatus = (slot) => {
    if (slot.status === 'available') return 'available';
    if (slot.status === 'occupied') return 'occupied';
    if (slot.status === 'reserved') return 'reserved';
    return 'maintenance';
  };

  const getSlotColor = (status) => {
    switch (status) {
      case 'available':
        return '#10b981';
      case 'occupied':
        return '#ef4444';
      case 'reserved':
        return '#f59e0b';
      default:
        return '#9ca3af';
    }
  };

  const getSlotIcon = (status) => {
    switch (status) {
      case 'available':
        return '✓';
      case 'occupied':
        return '✖'; // Heavier X
      case 'reserved':
        return '🔒'; // Lock icon for reserved
      default:
        return '⚠';
    }
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.slotType]) acc[slot.slotType] = [];
    acc[slot.slotType].push(slot);
    return acc;
  }, {});

  const vehicleTypeLabels = {
    twoWheeler: '🏍️ 2-Wheelers',
    threeWheeler: '🛺 3-Wheelers',
    fourWheeler: '🚗 4-Wheelers',
    heavyVehicle: '🚚 Heavy Vehicles',
  };

  const stats = {
    total: slots.length,
    available: slots.filter((s) => s.status === 'available').length,
    occupied: slots.filter((s) => s.status === 'occupied').length,
    reserved: slots.filter((s) => s.status === 'reserved').length,
  };

  return (
    <div className="slot-grid-container">
      <div className="slot-statistics">
        <div className="stat-card">
          <h3>Total Slots</h3>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card available">
          <h3>Available</h3>
          <p className="stat-value">{stats.available}</p>
        </div>
        <div className="stat-card occupied">
          <h3>Occupied</h3>
          <p className="stat-value">{stats.occupied}</p>
        </div>
        <div className="stat-card reserved">
          <h3>Reserved</h3>
          <p className="stat-value">{stats.reserved}</p>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
          <span>Occupied</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
          <span>Reserved</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#9ca3af' }}></span>
          <span>Maintenance</span>
        </div>
      </div>

      {Object.entries(groupedSlots).map(([type, typeSlots]) => (
        <div key={type} className="slot-section">
          <h2 className="section-title">{vehicleTypeLabels[type]}</h2>
          <div className="slots-grid">
            {typeSlots.map((slot) => {
              const status = getSlotStatus(slot);
              const isSelectable = status === 'available';
              const isSelected = selectedSlot?.id === slot.id;

              return (
                <button
                  key={slot.id}
                  className={`slot-card ${status} ${isSelected ? 'selected' : ''}`}
                  onClick={() => isSelectable && onSlotSelect(slot)}
                  disabled={!isSelectable && status !== 'occupied'} // Allow clicking occupied to see info maybe? but disable for now as per req
                  style={{
                    backgroundColor: isSelected ? getSlotColor(status) : 'transparent',
                    borderColor: getSlotColor(status),
                    color: isSelected ? 'white' : getSlotColor(status)
                  }}
                >
                  <div className="slot-number">{slot.slotNumber}</div>
                  <div className="slot-icon" style={{ color: status === 'occupied' ? '#ef4444' : 'inherit' }}>
                    {getSlotIcon(status)}
                  </div>
                  <div className="slot-status">{status}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedSlot && (
        <div className="selected-slot-info">
          <p>
            <strong>Selected Slot:</strong> {selectedSlot.slotNumber}
          </p>
          <p>
            <strong>Type:</strong> {vehicleTypeLabels[selectedSlot.slotType]}
          </p>
        </div>
      )}
    </div>
  );
};

export default SlotGrid;
