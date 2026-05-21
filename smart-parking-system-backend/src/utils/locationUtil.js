// Haversine formula to calculate distance between two coordinates
// Returns distance in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

// Find nearest parking lots to user location
const findNearestParking = (parkingLots, userLat, userLon, radiusKm = 5) => {
  const nearbyParking = parkingLots
    .map((parking) => {
      const [longitude, latitude] = parking.location.coordinates;
      const distance = calculateDistance(userLat, userLon, latitude, longitude);
      return {
        ...parking.toObject(),
        distance: parseFloat(distance.toFixed(2)),
      };
    })
    .filter((parking) => parking.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  return nearbyParking;
};

// Validate pagination parameters
const getPaginationParams = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * pageLimit;

  return { page: pageNum, limit: pageLimit, skip };
};

module.exports = {
  calculateDistance,
  findNearestParking,
  getPaginationParams,
};
