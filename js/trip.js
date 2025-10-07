// Individual Trip Page JavaScript - Leaflet Version

let map;
let trip = null;

// Get trip ID from URL
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('id');

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    if (!tripId) {
        document.getElementById('trip-title').textContent = 'لم يتم العثور على الرحلة';
        document.getElementById('poi-list').innerHTML = '<div class="empty-state"><p>معرّف الرحلة مفقود</p></div>';
        return;
    }

    // Initialize map
    map = createMap('map', CONFIG.HAIFA_CENTER, CONFIG.DEFAULT_ZOOM);

    // Load trip data
    await loadTrip();
});

// Load trip data
async function loadTrip() {
    try {
        // First, get the trips index to find the correct file
        const indexResponse = await fetch('routes/trips-index.json');
        const tripsIndex = await indexResponse.json();

        // Load all trips to find the one with matching ID
        for (const tripFile of tripsIndex.trips) {
            const response = await fetch(`routes/${tripFile}`);
            const tripData = await response.json();

            if (tripData.id === tripId) {
                trip = tripData;
                break;
            }
        }

        if (!trip) {
            throw new Error('Trip not found');
        }

        // Display trip information
        displayTripInfo();
        displayTripOnMap();
        displayPointsOfInterest();
        setupNavigationButton();

    } catch (error) {
        console.error('Error loading trip:', error);
        document.getElementById('trip-title').textContent = 'خطأ في تحميل الرحلة';
        document.getElementById('poi-list').innerHTML = `
            <div class="empty-state">
                <p>لا يمكن تحميل تفاصيل الرحلة</p>
            </div>
        `;
    }
}

// Display trip information
function displayTripInfo() {
    document.getElementById('trip-title').textContent = trip.title;
    document.getElementById('trip-description').textContent = trip.description;

    document.getElementById('trip-details').innerHTML = `
        <div class="flex flex-column gap-sm">
            <div class="flex gap-sm items-center">
                <strong>الصفوف:</strong>
                <div class="trip-grades">
                    ${trip.grades.map(grade => `<span class="grade-badge">الصف ${grade}</span>`).join('')}
                </div>
            </div>
            <div class="flex gap-sm items-center">
                <strong>نقاط الاهتمام:</strong>
                <span>${trip.pointsOfInterest.length}</span>
            </div>
        </div>
    `;
}

// Display trip route on map
function displayTripOnMap() {
    // Combine POIs and secondary points, sort by order
    const allPoints = [
        ...trip.pointsOfInterest.map(poi => ({ ...poi, type: 'poi' })),
        ...trip.secondaryPoints.map(sp => ({ ...sp, type: 'secondary' }))
    ].sort((a, b) => a.order - b.order);

    // Create path from coordinates
    const path = allPoints.map(point => point.coordinates);

    // Create polyline
    createPolyline(map, path, trip.color, 5);

    const allCoordinates = [];

    // Add markers for POIs
    trip.pointsOfInterest.forEach((poi, index) => {
        const marker = createNumberedMarker(
            [poi.coordinates.lat, poi.coordinates.lng],
            trip.color,
            index + 1
        );

        // Add popup
        marker.bindPopup(`
            <div style="padding: 12px; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px;">${poi.name}</h3>
                <p style="margin: 0; font-size: 14px; color: #666;">${poi.description}</p>
                ${poi.missionLink ? `
                    <a href="${poi.missionLink}" target="_blank"
                       style="display: inline-block; margin-top: 8px; color: #007AFF; text-decoration: none;">
                       عرض المهمة ←
                    </a>
                ` : ''}
            </div>
        `);

        marker.addTo(map);

        // Click handler to scroll to POI in list
        marker.on('click', () => {
            const poiElement = document.getElementById(`poi-${poi.id}`);
            if (poiElement) {
                poiElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        allCoordinates.push(poi.coordinates);
    });

    // Fit map to show entire route
    fitMapBounds(map, allCoordinates);
}

// Display points of interest list
function displayPointsOfInterest() {
    const poiList = document.getElementById('poi-list');

    if (trip.pointsOfInterest.length === 0) {
        poiList.innerHTML = '<div class="empty-state"><p>لا توجد نقاط اهتمام في المسار</p></div>';
        return;
    }

    // Sort POIs by order
    const sortedPOIs = [...trip.pointsOfInterest].sort((a, b) => a.order - b.order);

    poiList.innerHTML = sortedPOIs.map((poi, index) => `
        <div class="poi-card" id="poi-${poi.id}">
            ${poi.photo ? `<img src="${poi.photo}" alt="${poi.name}" class="poi-image">` : ''}
            <div style="flex: 1;">
                <div class="poi-header">
                    <div>
                        <div class="flex items-center gap-sm mb-sm">
                            <div class="poi-number">${index + 1}</div>
                            <h3 style="margin: 0;">${poi.name}</h3>
                        </div>
                        <p>${poi.description}</p>
                    </div>
                </div>
                ${poi.missionLink ? `
                    <a href="${poi.missionLink}" target="_blank" class="btn btn-secondary mt-sm">
                        📝 انتقل إلى المهمة
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Setup navigation button
function setupNavigationButton() {
    const navigateBtn = document.getElementById('navigate-btn');

    navigateBtn.addEventListener('click', () => {
        // Combine all points in order (POIs and secondary points)
        const allPoints = [
            ...trip.pointsOfInterest.map(poi => ({ ...poi, type: 'poi' })),
            ...trip.secondaryPoints.map(sp => ({ ...sp, type: 'secondary' }))
        ].sort((a, b) => a.order - b.order);

        // Build OpenStreetMap navigation URL with waypoints
        // Format: https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=lat1,lng1;lat2,lng2;lat3,lng3

        const waypoints = allPoints.map(point =>
            `${point.coordinates.lat},${point.coordinates.lng}`
        ).join(';');

        // Use OSRM for foot/walking navigation
        const navigationUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${waypoints}`;

        // Open in new window/tab
        window.open(navigationUrl, '_blank');
    });
}
