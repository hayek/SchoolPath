// Individual Trip Page JavaScript - Leaflet Version

let map;
let trip = null;
let userLocationTracking = null;

// Get trip ID from URL
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('id');
const isPreview = urlParams.get('preview') === 'true';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Check for preview mode
    if (isPreview) {
        const previewData = sessionStorage.getItem('previewTrip');
        if (!previewData) {
            document.getElementById('trip-title').textContent = 'خطأ في المعاينة';
            document.getElementById('poi-list').innerHTML = '<div class="empty-state"><p>بيانات المعاينة غير متوفرة</p></div>';
            return;
        }

        trip = JSON.parse(previewData);

        // Initialize map
        map = createMap('map', CONFIG.HAIFA_CENTER, CONFIG.DEFAULT_ZOOM);

        // Add user location tracking with compass
        userLocationTracking = addUserLocationTracking(map);

        // Display the preview trip
        await displayPreviewTrip();
        return;
    }

    if (!tripId) {
        document.getElementById('trip-title').textContent = 'لم يتم العثور على الرحلة';
        document.getElementById('poi-list').innerHTML = '<div class="empty-state"><p>معرّف الرحلة مفقود</p></div>';
        return;
    }

    // Initialize map
    map = createMap('map', CONFIG.HAIFA_CENTER, CONFIG.DEFAULT_ZOOM);

    // Add user location tracking with compass
    userLocationTracking = addUserLocationTracking(map);

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
        await displayTripOnMap();
        displayPointsOfInterest();
        setupNavigationButton();

        // Make map static with tap-to-activate overlay
        makeMapStatic(map, 'map');

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

// Display preview trip (from creator)
async function displayPreviewTrip() {
    try {
        // Display trip information
        displayTripInfo();
        await displayTripOnMap();
        displayPointsOfInterest();
        setupNavigationButton();

        // Make map static with tap-to-activate overlay
        makeMapStatic(map, 'map');

    } catch (error) {
        console.error('Error displaying preview trip:', error);
        document.getElementById('trip-title').textContent = 'خطأ في المعاينة';
        document.getElementById('poi-list').innerHTML = `
            <div class="empty-state">
                <p>لا يمكن عرض المعاينة</p>
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
            <div class="flex justify-between items-center">
                <strong>مشاركة الرحلة:</strong>
                <button class="copy-btn" onclick="copyCurrentTripUrl(this)" title="نسخ رابط الرحلة">
                    <img src="assets/copy.svg" alt="نسخ">
                </button>
            </div>
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
            ${trip.duration ? `
            <div class="flex gap-sm items-center">
                <strong>المدة الإجمالية:</strong>
                <span>${trip.duration}</span>
            </div>
            ` : ''}
        </div>
    `;
}

// Display trip route on map
async function displayTripOnMap() {
    // Combine POIs and secondary points, sort by order
    const allPoints = [
        ...trip.pointsOfInterest.map(poi => ({ ...poi, type: 'poi' })),
        ...trip.secondaryPoints.map(sp => ({ ...sp, type: 'secondary' }))
    ].sort((a, b) => a.order - b.order);

    const allCoordinates = [];

    // Fetch walking route from Geoapify
    await fetchWalkingRoute(allPoints);

    // Track the currently open popup
    let currentOpenMarker = null;

    // Add markers for POIs
    trip.pointsOfInterest.forEach((poi, index) => {
        const marker = createNumberedMarker(
            [poi.coordinates.lat, poi.coordinates.lng],
            trip.color,
            index + 1
        );

        // Add popup with title and image
        const popup = L.popup({
            closeButton: true,
            autoClose: false,
            closeOnClick: false
        }).setContent(`
            <div style="padding: 8px; cursor: pointer;" class="poi-popup" data-poi-id="${poi.id}">
                ${poi.photo ? `<img src="${poi.photo}" alt="${poi.title}" style="width: 200px; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; display: block;">` : ''}
                <h3 style="margin: 0; font-size: 16px;">${poi.title}</h3>
                ${poi.subtitle ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">${poi.subtitle}</p>` : ''}
            </div>
        `);

        marker.bindPopup(popup);
        marker.addTo(map);

        // Close any open popups before opening a new one
        marker.on('click', () => {
            if (currentOpenMarker && currentOpenMarker !== marker) {
                currentOpenMarker.closePopup();
            }
            currentOpenMarker = marker;
        });

        // Track when popup closes
        marker.on('popupclose', () => {
            if (currentOpenMarker === marker) {
                currentOpenMarker = null;
            }
        });

        // Click handler on popup to navigate to POI detail page
        marker.on('popupopen', () => {
            const popupElement = document.querySelector(`.poi-popup[data-poi-id="${poi.id}"]`);
            if (popupElement) {
                popupElement.addEventListener('click', () => {
                    navigateToPOI(trip.id, poi.id);
                });
            }
        });

        allCoordinates.push(poi.coordinates);
    });

    // Fit map to show entire route
    fitMapBounds(map, allCoordinates);
}

// Fetch walking route from Geoapify
async function fetchWalkingRoute(points) {
    // Check if we should use straight lines instead of routing API
    if (CONFIG.USE_STRAIGHT_LINES) {
        const path = points.map(point => point.coordinates);
        createPolyline(map, path, trip.color, 5);
        return;
    }

    try {
        // Build waypoints string: lat1,lng1|lat2,lng2|...
        const waypoints = points.map(p =>
            `${p.coordinates.lat},${p.coordinates.lng}`
        ).join('|');

        const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=walk&apiKey=${CONFIG.GEOAPIFY_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        console.log('Geoapify response:', data); // Debug

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
            L.polyline(leafletCoords, {
                color: trip.color,
                weight: 5,
                opacity: 0.7
            }).addTo(map);
        } else {
            // Fallback to straight lines if routing fails
            console.warn('Routing API returned no results, using straight lines');
            const path = points.map(point => point.coordinates);
            createPolyline(map, path, trip.color, 5);
        }
    } catch (error) {
        console.error('Error fetching walking route:', error);
        // Fallback to straight lines
        const path = points.map(point => point.coordinates);
        createPolyline(map, path, trip.color, 5);
    }
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

    poiList.innerHTML = sortedPOIs.map((poi, index) => {
        // Get first line of description (truncate at first newline or after 100 characters)
        const getFirstLine = (text) => {
            if (!text) return '';
            const firstLine = text.split('\n')[0];
            if (firstLine.length > 100) {
                return firstLine.substring(0, 100) + '...';
            }
            return firstLine + '...';
        };

        const descriptionBox = poi.description ? `
            <div style="padding: 24px; background: #f0f7ff; border-left: 6px solid #007AFF; border-radius: var(--radius-md); cursor: pointer; display: flex; flex-direction: column; gap: 12px; margin-top: var(--spacing-md);" onclick="navigateToPOI('${trip.id}', '${poi.id}', event)">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <img src="assets/read.svg" alt="وصف" style="width: 28px; height: 28px; filter: invert(0.2); flex-shrink: 0;">
                    <strong style="color: #007AFF; font-size: 16px;">اقرأ المزيد</strong>
                </div>
                <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">${getFirstLine(poi.description)}</p>
            </div>
        ` : '';

        const learningActivityBox = poi.learningTasks && poi.learningTasks.length > 0 ?
            poi.learningTasks.map((task, index) => {
                const taskTitle = typeof task === 'string' ? task : task.title;
                const taskBody = typeof task === 'object' ? task.body : '';
                const taskUrl = typeof task === 'object' ? task.url : '';
                const taskUrlTitle = typeof task === 'object' ? (task.urlTitle || 'رابط النشاط') : 'رابط النشاط';
                const taskPdfs = typeof task === 'object' ? task.pdfs : [];
                const taskColor = typeof task === 'object' ? (task.color || '#ff69b4') : '#ff69b4';

                const taskBgColor = taskColor + '20'; // 20 = ~12% opacity
                const taskPdfBgColor = taskColor + '30'; // 30 = ~19% opacity

                return `
                    <div style="padding: 20px; background: ${taskBgColor}; border-left: 6px solid ${taskColor}; border-radius: var(--radius-md); margin-top: var(--spacing-md);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: ${taskBody || taskUrl || (taskPdfs && taskPdfs.length > 0) ? '12px' : '0'};">
                            <img src="assets/idea.svg" alt="نشاط تعليمي" style="width: 24px; height: 24px; filter: invert(0.2);">
                            <strong style="color: ${taskColor}; font-size: 15px;">${taskTitle}</strong>
                        </div>
                        ${taskBody || taskUrl || (taskPdfs && taskPdfs.length > 0) ? `
                            <div style="padding-right: 36px;">
                                ${taskBody ? `<p style="margin: 0 0 8px 0; color: #333; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${taskBody}</p>` : ''}
                                ${taskUrl ? `
                                    <a href="${taskUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: ${taskColor}; text-decoration: none; font-size: 14px; padding: 10px 14px; background: white; border: 2px solid ${taskColor}; border-radius: 8px; margin-bottom: 8px; font-weight: 500;" onclick="event.stopPropagation();">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                                            <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                                        </svg>
                                        ${taskUrlTitle}
                                    </a>
                                ` : ''}
                                ${taskPdfs && taskPdfs.length > 0 ? `
                                    <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">
                                        ${taskPdfs.map(pdf => `
                                            <a href="${pdf}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: ${taskColor}; text-decoration: none; font-size: 13px; background: ${taskPdfBgColor}; padding: 10px 14px; border-radius: 8px; font-weight: 500;" onclick="event.stopPropagation();">
                                                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                                                </svg>
                                                ${pdf.split('/').pop()}
                                            </a>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('') : '';

        const poiCard = `
            <div class="poi-card" style="display: flex; flex-direction: column; gap: var(--spacing-md); cursor: pointer;">
                <div style="display: flex; flex-direction: row-reverse; gap: var(--spacing-md);" onclick="navigateToPOI('${trip.id}', '${poi.id}', event)">
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-sm);">
                        ${poi.photo ? `<img src="${poi.photo}" alt="${poi.title}" class="poi-image" onclick="openImageFullscreen('${poi.photo}', event)" style="width: 120px; height: 120px; object-fit: cover; border-radius: var(--radius-md); flex-shrink: 0;">` : ''}
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <div style="display: flex; align-items: flex-start; gap: var(--spacing-sm);">
                            <div class="poi-number" style="flex-shrink: 0;">${index + 1}</div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0;">${poi.title}</h3>
                                ${poi.subtitle ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">${poi.subtitle}</p>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                ${descriptionBox}
                ${learningActivityBox}
            </div>
        `;

        return poiCard;
    }).join('');

}

// Navigate to POI detail page
function navigateToPOI(tripId, poiId, event) {
    window.location.href = `poi-detail.html?trip=${tripId}&poi=${poiId}`;
}

// Open image in fullscreen
function openImageFullscreen(imageSrc, event) {
    // Prevent card click event from firing
    event.stopPropagation();

    const fullscreenOverlay = document.createElement('div');
    fullscreenOverlay.className = 'image-fullscreen-overlay';
    fullscreenOverlay.innerHTML = `
        <button class="image-fullscreen-close" onclick="closeImageFullscreen()">✕</button>
        <img src="${imageSrc}" alt="Fullscreen image" class="image-fullscreen">
    `;
    document.body.appendChild(fullscreenOverlay);
    document.body.style.overflow = 'hidden';
}

// Close fullscreen image
function closeImageFullscreen() {
    const overlay = document.querySelector('.image-fullscreen-overlay');
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = '';
    }
}

// Setup navigation button
function setupNavigationButton() {
    const navigateBtn = document.getElementById('navigate-btn');

    if (!navigateBtn) {
        console.log('Navigate button not found in DOM');
        return;
    }

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

// Copy current trip URL to clipboard
function copyCurrentTripUrl(button) {
    const url = window.location.href;

    navigator.clipboard.writeText(url).then(() => {
        // Show success feedback
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
