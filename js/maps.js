// Leaflet + Geoapify Maps Utility Functions

/**
 * Create a Leaflet map with Geoapify tiles
 * @param {string} elementId - ID of the div element for the map
 * @param {Object} center - {lat, lng} center coordinates
 * @param {number} zoom - Zoom level
 * @returns {Object} Leaflet map instance
 */
function createMap(elementId, center, zoom) {
    const map = L.map(elementId).setView([center.lat, center.lng], zoom);

    // Add Geoapify tiles
    const tileUrl = `https://maps.geoapify.com/v1/tile/${CONFIG.MAP_STYLE}/{z}/{x}/{y}.png?apiKey=${CONFIG.GEOAPIFY_API_KEY}`;

    L.tileLayer(tileUrl, {
        attribution: '© <a href="https://www.geoapify.com/">Geoapify</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 20
    }).addTo(map);

    return map;
}

/**
 * Create a custom numbered marker
 * @param {Array} latlng - [lat, lng]
 * @param {string} color - Hex color code
 * @param {number} number - Number to display
 * @param {boolean} draggable - Whether marker should be draggable (default: false)
 * @returns {Object} Leaflet marker
 */
function createNumberedMarker(latlng, color, number, draggable = false) {
    const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${number}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    return L.marker(latlng, { icon: icon, draggable: draggable });
}

/**
 * Create a simple colored marker
 * @param {Array} latlng - [lat, lng]
 * @param {string} color - Hex color code
 * @param {boolean} draggable - Whether marker should be draggable (default: false)
 * @returns {Object} Leaflet marker
 */
function createSimpleMarker(latlng, color, draggable = false) {
    const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${color};
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    return L.marker(latlng, { icon: icon, draggable: draggable });
}

/**
 * Calculate total distance of a route using Haversine formula
 * @param {Array} coordinates - Array of {lat, lng} objects
 * @returns {number} Distance in meters
 */
function calculateRouteDistance(coordinates) {
    if (coordinates.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
        totalDistance += haversineDistance(
            coordinates[i].lat, coordinates[i].lng,
            coordinates[i + 1].lat, coordinates[i + 1].lng
        );
    }

    return Math.round(totalDistance);
}

/**
 * Haversine formula to calculate distance between two points
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
function formatDistance(meters) {
    if (meters < 1000) {
        return `${meters} متر`;
    }
    return `${(meters / 1000).toFixed(1)} كم`;
}

/**
 * Geocode an address using Geoapify
 * @param {string} address - Address string
 * @returns {Promise<Object>} Promise resolving to {lat, lng}
 */
async function geocodeAddress(address) {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address + ', Haifa, Israel')}&apiKey=${CONFIG.GEOAPIFY_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const coords = data.features[0].geometry.coordinates;
            return {
                lat: coords[1],
                lng: coords[0]
            };
        } else {
            throw new Error('Address not found');
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

/**
 * Reverse geocode coordinates to address using Geoapify
 * @param {Object} coordinates - {lat, lng}
 * @returns {Promise<string>} Promise resolving to address string
 */
async function reverseGeocode(coordinates) {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${coordinates.lat}&lon=${coordinates.lng}&apiKey=${CONFIG.GEOAPIFY_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            return data.features[0].properties.formatted;
        } else {
            throw new Error('Address not found');
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        throw error;
    }
}

/**
 * Generate a random color for a new trip
 * @returns {string} Random hex color
 */
function generateRandomColor() {
    const colors = [
        '#FF3B30', // Red
        '#FF9500', // Orange
        '#FFCC00', // Yellow
        '#34C759', // Green
        '#00C7BE', // Teal
        '#30B0C7', // Cyan
        '#007AFF', // Blue
        '#5856D6', // Indigo
        '#AF52DE', // Purple
        '#FF2D55'  // Pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Create a polyline on the map
 * @param {Object} map - Leaflet map instance
 * @param {Array} coordinates - Array of {lat, lng} objects
 * @param {string} color - Line color
 * @param {number} weight - Line weight
 * @returns {Object} Leaflet polyline
 */
function createPolyline(map, coordinates, color, weight = 4) {
    const latlngs = coordinates.map(coord => [coord.lat, coord.lng]);
    return L.polyline(latlngs, {
        color: color,
        weight: weight,
        opacity: 0.8
    }).addTo(map);
}

/**
 * Fit map bounds to show all markers
 * @param {Object} map - Leaflet map instance
 * @param {Array} coordinates - Array of {lat, lng} objects
 */
function fitMapBounds(map, coordinates) {
    if (coordinates.length === 0) return;

    const bounds = L.latLngBounds(coordinates.map(coord => [coord.lat, coord.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
}

/**
 * Make a map static (non-interactive) with tap-to-activate overlay
 * @param {Object} map - Leaflet map instance
 * @param {string} containerId - ID of the map container element
 */
function makeMapStatic(map, containerId) {
    // Disable all map interactions
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.tap) map.tap.disable();

    // Get the map container
    const container = document.getElementById(containerId);
    if (!container) return;

    const mapContainer = container.parentElement;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'map-overlay';
    overlay.innerHTML = `
        <div class="map-overlay-message">
            <div class="map-overlay-icon">🗺️</div>
            <p class="map-overlay-text">اضغط لتفعيل الخريطة للتكبير والتصغير والتنقل</p>
        </div>
    `;

    // Create exit button
    const exitBtn = document.createElement('button');
    exitBtn.className = 'exit-map-btn';
    exitBtn.textContent = '✕ إغلاق الخريطة';

    // Add overlay and exit button to container
    mapContainer.appendChild(overlay);
    mapContainer.appendChild(exitBtn);

    // Activate map on overlay click
    overlay.addEventListener('click', () => {
        activateMap(map, mapContainer);
    });

    // Deactivate map on exit button click
    exitBtn.addEventListener('click', () => {
        deactivateMap(map, mapContainer);
    });
}

/**
 * Activate map interactions
 * @param {Object} map - Leaflet map instance
 * @param {HTMLElement} container - Map container element
 */
function activateMap(map, container) {
    // Enable all map interactions
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if (map.tap) map.tap.enable();

    // Add active class to container
    container.classList.add('map-active');

    // Scroll map into view
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Deactivate map interactions
 * @param {Object} map - Leaflet map instance
 * @param {HTMLElement} container - Map container element
 */
function deactivateMap(map, container) {
    // Disable all map interactions
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.tap) map.tap.disable();

    // Remove active class from container
    container.classList.remove('map-active');
}

/**
 * Add user location tracking to map with compass orientation on mobile
 * @param {Object} map - Leaflet map instance
 * @returns {Object} Object with locationMarker, accuracyCircle, and cleanup function
 */
function addUserLocationTracking(map) {
    let locationMarker = null;
    let accuracyCircle = null;
    let watchId = null;
    let orientationListener = null;
    let currentHeading = 0;

    // Check if geolocation is supported
    if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return null;
    }

    // Create custom user location icon
    function createLocationIcon(heading = 0) {
        // If heading is available (mobile with compass), show directional arrow
        if (heading !== null && heading !== 0) {
            return L.divIcon({
                className: 'user-location-marker',
                html: `<div style="
                    width: 0;
                    height: 0;
                    border-left: 10px solid transparent;
                    border-right: 10px solid transparent;
                    border-bottom: 20px solid #007AFF;
                    transform: rotate(${heading}deg);
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
        } else {
            // Standard blue dot for non-compass devices
            return L.divIcon({
                className: 'user-location-marker',
                html: `<div style="
                    width: 16px;
                    height: 16px;
                    background-color: #007AFF;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });
        }
    }

    // Update marker position and heading
    function updateLocation(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        if (!locationMarker) {
            // Create new marker
            locationMarker = L.marker([lat, lng], {
                icon: createLocationIcon(currentHeading),
                zIndexOffset: 1000
            }).addTo(map);

            // Create accuracy circle
            accuracyCircle = L.circle([lat, lng], {
                radius: accuracy,
                color: '#007AFF',
                fillColor: '#007AFF',
                fillOpacity: 0.1,
                weight: 1,
                opacity: 0.3
            }).addTo(map);

            // Center map on user location on first load
            map.setView([lat, lng], 16);
        } else {
            // Update existing marker
            locationMarker.setLatLng([lat, lng]);
            locationMarker.setIcon(createLocationIcon(currentHeading));
            accuracyCircle.setLatLng([lat, lng]);
            accuracyCircle.setRadius(accuracy);
        }
    }

    // Handle orientation/compass data (mobile only)
    function handleOrientation(event) {
        // Get compass heading
        // alpha: rotation around z-axis (0-360 degrees)
        let heading = null;

        if (event.alpha !== null) {
            // For iOS devices with absolute orientation
            if (event.webkitCompassHeading !== undefined) {
                heading = event.webkitCompassHeading;
            } else {
                // For Android: alpha gives rotation, we need to convert
                // 0 = North, 90 = East, 180 = South, 270 = West
                heading = 360 - event.alpha;
            }

            currentHeading = heading;

            // Update marker icon with new heading
            if (locationMarker) {
                locationMarker.setIcon(createLocationIcon(heading));
            }
        }
    }

    // Request device orientation permission (required for iOS 13+)
    async function requestOrientationPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    orientationListener = true;
                }
            } catch (error) {
                console.log('Device orientation permission denied:', error);
            }
        } else if (window.DeviceOrientationEvent) {
            // For non-iOS or older iOS versions
            window.addEventListener('deviceorientation', handleOrientation, true);
            orientationListener = true;
        }
    }

    // Start watching user location
    watchId = navigator.geolocation.watchPosition(
        updateLocation,
        (error) => {
            console.error('Error getting location:', error);
            alert('تعذر الحصول على موقعك. يرجى التحقق من إعدادات الموقع.');
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );

    // Start compass tracking on mobile
    requestOrientationPermission();

    // Cleanup function
    function cleanup() {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }
        if (orientationListener) {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        }
        if (locationMarker) {
            map.removeLayer(locationMarker);
        }
        if (accuracyCircle) {
            map.removeLayer(accuracyCircle);
        }
    }

    return {
        locationMarker,
        accuracyCircle,
        cleanup
    };
}
