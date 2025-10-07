// Main Index Page JavaScript - Leaflet Version

let map;
let trips = [];
let polylines = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize map
    map = createMap('map', CONFIG.HAIFA_CENTER, CONFIG.DEFAULT_ZOOM);

    // Load and display all trips
    await loadTrips();
});

// Load all trip JSON files
async function loadTrips() {
    const tripsList = document.getElementById('trips-list');

    try {
        // Read all JSON files from routes folder
        const response = await fetch('routes/trips-index.json');

        if (!response.ok) {
            throw new Error('Could not load trips index');
        }

        const tripsIndex = await response.json();
        trips = await Promise.all(
            tripsIndex.trips.map(async (tripFile) => {
                const tripResponse = await fetch(`routes/${tripFile}`);
                return await tripResponse.json();
            })
        );

        // Display trips on map
        await displayTripsOnMap();

        // Display trips list
        displayTripsList();
    } catch (error) {
        console.error('Error loading trips:', error);
        tripsList.innerHTML = `
            <div class="empty-state">
                <p>لم يتم العثور على رحلات متاحة</p>
                <p style="font-size: 14px; margin-top: 8px;">
                    أضف ملفات JSON إلى مجلد routes واستخدم منشئ الرحلات
                </p>
            </div>
        `;
    }
}

// Display all trips on the unified map
async function displayTripsOnMap() {
    // Clear existing polylines
    polylines.forEach(polyline => map.removeLayer(polyline));
    polylines = [];

    const allCoordinates = [];

    // Fetch walking routes for all trips
    for (const trip of trips) {
        // Combine POIs and secondary points, sort by order
        const allPoints = [
            ...trip.pointsOfInterest.map(poi => ({ ...poi, type: 'poi' })),
            ...trip.secondaryPoints.map(sp => ({ ...sp, type: 'secondary' }))
        ].sort((a, b) => a.order - b.order);

        // Fetch walking route from Geoapify
        await fetchWalkingRouteForTrip(trip, allPoints);

        // Add markers for POIs
        trip.pointsOfInterest.forEach((poi, index) => {
            const marker = createNumberedMarker(
                [poi.coordinates.lat, poi.coordinates.lng],
                trip.color,
                index + 1
            );

            // Add popup
            marker.bindPopup(`
                <div style="padding: 8px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px;">${poi.name}</h3>
                    <p style="margin: 0; font-size: 14px; color: #666;">${trip.title}</p>
                </div>
            `);

            marker.addTo(map);

            // Collect coordinates for bounds
            allCoordinates.push(poi.coordinates);
        });
    }

    // Fit map to show all trips
    if (allCoordinates.length > 0) {
        fitMapBounds(map, allCoordinates);
    }
}

// Fetch walking route from Geoapify for a trip on index page
async function fetchWalkingRouteForTrip(trip, points) {
    try {
        // Build waypoints string: lat1,lng1|lat2,lng2|...
        const waypoints = points.map(p =>
            `${p.coordinates.lat},${p.coordinates.lng}`
        ).join('|');

        const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=walk&apiKey=${CONFIG.GEOAPIFY_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        console.log('Geoapify response for', trip.title, ':', data); // Debug

        if (data.features && data.features.length > 0 && data.features[0].geometry) {
            const geometry = data.features[0].geometry;
            let routeCoordinates;

            // Handle both LineString and MultiLineString
            if (geometry.type === 'LineString') {
                routeCoordinates = geometry.coordinates;
            } else if (geometry.type === 'MultiLineString') {
                // Flatten MultiLineString into a single array
                routeCoordinates = geometry.coordinates.flat();
            } else {
                throw new Error('Unsupported geometry type: ' + geometry.type);
            }

            // Convert from [lng, lat] to [lat, lng] for Leaflet
            const leafletCoords = routeCoordinates.map(coord => [coord[1], coord[0]]);

            // Draw the walking route
            const polyline = L.polyline(leafletCoords, {
                color: trip.color,
                weight: 4,
                opacity: 0.7
            }).addTo(map);

            polylines.push(polyline);
        } else {
            // Fallback to straight lines if routing fails
            console.warn('Routing API returned no results for trip:', trip.title);
            const path = points.map(point => point.coordinates);
            const polyline = createPolyline(map, path, trip.color, 4);
            polylines.push(polyline);
        }
    } catch (error) {
        console.error('Error fetching walking route for trip:', trip.title, error);
        // Fallback to straight lines
        const path = points.map(point => point.coordinates);
        const polyline = createPolyline(map, path, trip.color, 4);
        polylines.push(polyline);
    }
}

// Display trips in the list
function displayTripsList() {
    const tripsList = document.getElementById('trips-list');
    tripsList.style.display = 'flex';
    tripsList.style.flexDirection = 'column';
    tripsList.style.gap = 'var(--spacing-md)';

    if (trips.length === 0) {
        tripsList.innerHTML = `
            <div class="empty-state">
                <p>لا توجد رحلات متاحة حاليًا</p>
            </div>
        `;
        return;
    }

    tripsList.innerHTML = trips.map(trip => `
        <div class="card card-clickable trip-card" onclick="location.href='trip.html?id=${trip.id}'">
            <div class="trip-color-indicator" style="background-color: ${trip.color}"></div>
            <div class="trip-info">
                <div class="trip-header">
                    <div class="trip-header-content">
                        <h3>${trip.title}</h3>
                        <p>${trip.description}</p>
                        <div class="trip-meta">
                            <span class="trip-grades">
                                ${trip.grades.map(grade => `<span class="grade-badge">الصف ${grade}</span>`).join('')}
                            </span>
                        </div>
                    </div>
                    <button class="copy-btn" onclick="event.stopPropagation(); copyTripUrl('${trip.id}', this)" title="نسخ رابط الرحلة">
                        <img src="assets/copy.svg" alt="نسخ">
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Copy trip URL to clipboard
function copyTripUrl(tripId, button) {
    const url = `${window.location.origin}${window.location.pathname.replace('index.html', '')}trip.html?id=${tripId}`;

    navigator.clipboard.writeText(url).then(() => {
        // Show success feedback
        const img = button.querySelector('img');
        button.innerHTML = '<span style="color: #34C759; font-size: 18px;">✓</span>';
        button.classList.add('copied');

        setTimeout(() => {
            button.innerHTML = '<img src="assets/copy.svg" alt="نسخ">';
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy URL:', err);
        alert('فشل نسخ الرابط');
    });
}
