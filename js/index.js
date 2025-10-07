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
        displayTripsOnMap();

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
function displayTripsOnMap() {
    // Clear existing polylines
    polylines.forEach(polyline => map.removeLayer(polyline));
    polylines = [];

    const allCoordinates = [];

    trips.forEach(trip => {
        // Combine POIs and secondary points, sort by order
        const allPoints = [
            ...trip.pointsOfInterest.map(poi => ({ ...poi, type: 'poi' })),
            ...trip.secondaryPoints.map(sp => ({ ...sp, type: 'secondary' }))
        ].sort((a, b) => a.order - b.order);

        // Create path from coordinates
        const path = allPoints.map(point => point.coordinates);

        // Create polyline using utility function
        const polyline = createPolyline(map, path, trip.color, 4);
        polylines.push(polyline);

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
    });

    // Fit map to show all trips
    if (allCoordinates.length > 0) {
        fitMapBounds(map, allCoordinates);
    }
}

// Display trips in the list
function displayTripsList() {
    const tripsList = document.getElementById('trips-list');

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
                <h3>${trip.title}</h3>
                <p>${trip.description}</p>
                <div class="trip-meta">
                    <span>📅 ${formatDate(trip.date)}</span>
                    <span class="trip-grades">
                        ${trip.grades.map(grade => `<span class="grade-badge">الصف ${grade}</span>`).join('')}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
