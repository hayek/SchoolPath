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

        // Show location permission explanation popup first
        showLocationPermissionPopup();

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

    // Show location permission explanation popup first
    showLocationPermissionPopup();

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
        // Get first 3 lines of description (truncate at first 3 newlines or after 300 characters)
        const getFirstLine = (text) => {
            if (!text) return '';
            const lines = text.split('\n');
            const firstThreeLines = lines.slice(0, 3).join('\n');
            const hasMoreLines = lines.length > 3;
            const isTooLong = firstThreeLines.length > 300;

            if (isTooLong) {
                return firstThreeLines.substring(0, 300) + '...';
            }
            return firstThreeLines + (hasMoreLines ? '\n...' : '...');
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
                const taskLinks = typeof task === 'object' ? (task.links || []) : [];
                const taskUrl = typeof task === 'object' ? task.url : ''; // Support legacy format
                const taskUrlTitle = typeof task === 'object' ? (task.urlTitle || 'رابط النشاط') : 'رابط النشاط'; // Support legacy format
                const taskPdfs = typeof task === 'object' ? task.pdfs : [];
                const taskColor = typeof task === 'object' ? (task.color || '#ff69b4') : '#ff69b4';

                const taskBgColor = taskColor + '20'; // 20 = ~12% opacity
                const taskPdfBgColor = taskColor + '30'; // 30 = ~19% opacity

                // Helper function to detect YouTube URLs
                function isYouTubeUrl(url) {
                    return url.includes('youtube.com') || url.includes('youtu.be');
                }

                const hasContent = taskBody || taskLinks.length > 0 || taskUrl || (taskPdfs && taskPdfs.length > 0);

                return `
                    <div style="padding: 20px; background: ${taskBgColor}; border-left: 6px solid ${taskColor}; border-radius: var(--radius-md); margin-top: var(--spacing-md);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: ${hasContent ? '12px' : '0'};">
                            <img src="assets/idea.svg" alt="نشاط تعليمي" style="width: 24px; height: 24px; filter: invert(0.2);">
                            <strong style="color: ${taskColor}; font-size: 15px;">${taskTitle}</strong>
                        </div>
                        ${hasContent ? `
                            <div style="padding-right: 36px;">
                                ${taskBody ? `<p style="margin: 0 0 8px 0; color: #333; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${taskBody}</p>` : ''}
                                ${taskLinks && taskLinks.length > 0 ? `
                                    <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">
                                        ${taskLinks.map(link => {
                                            const isYouTube = isYouTubeUrl(link.url);
                                            return `
                                                <a href="${link.url}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: ${taskColor}; text-decoration: none; font-size: 14px; padding: 10px 14px; background: white; border: 2px solid ${taskColor}; border-radius: 8px; font-weight: 500;" onclick="event.stopPropagation();">
                                                    ${isYouTube ? `
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                                        </svg>
                                                    ` : `
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                                                            <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                                                        </svg>
                                                    `}
                                                    ${link.title}
                                                </a>
                                            `;
                                        }).join('')}
                                    </div>
                                ` : ''}
                                ${taskUrl ? `
                                    <a href="${taskUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: ${taskColor}; text-decoration: none; font-size: 14px; padding: 10px 14px; background: white; border: 2px solid ${taskColor}; border-radius: 8px; margin-top: ${taskLinks.length > 0 ? '8px' : '0'}; margin-bottom: 8px; font-weight: 500;" onclick="event.stopPropagation();">
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

// Show location help dialog
function showLocationHelp() {
    const errorBanner = document.getElementById('location-error');
    const errorCode = errorBanner ? errorBanner.dataset.errorCode : null;

    // Detect browser
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    let instructions = '';

    // Permission denied - show how to enable
    if (errorCode == 1) {
        if (isIOS) {
            instructions = `
                <h3 style="margin-top: 0; color: #007AFF;">كيفية تفعيل الموقع على iPhone/iPad:</h3>
                <ol style="text-align: right; line-height: 1.8; padding-right: 20px;">
                    <li>افتح <strong>الإعدادات</strong> (Settings)</li>
                    <li>اذهب إلى <strong>الخصوصية والأمان</strong> (Privacy & Security)</li>
                    <li>اضغط على <strong>خدمات الموقع</strong> (Location Services)</li>
                    <li>تأكد من تفعيل خدمات الموقع</li>
                    <li>ابحث عن <strong>Safari</strong> في القائمة</li>
                    <li>اختر <strong>"أثناء استخدام التطبيق"</strong> (While Using the App)</li>
                    <li>ارجع للمتصفح وأعد تحميل الصفحة</li>
                </ol>
            `;
        } else if (isChrome) {
            instructions = `
                <h3 style="margin-top: 0; color: #007AFF;">كيفية تفعيل الموقع على Chrome:</h3>
                <ol style="text-align: right; line-height: 1.8; padding-right: 20px;">
                    <li>اضغط على أيقونة <strong>القفل</strong> 🔒 أو <strong>معلومات الموقع</strong> ℹ️ في شريط العنوان</li>
                    <li>ابحث عن <strong>"الموقع"</strong> (Location)</li>
                    <li>اختر <strong>"السماح"</strong> (Allow)</li>
                    <li>أعد تحميل الصفحة</li>
                </ol>
                <p style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 14px;">
                    <strong>أو:</strong> اذهب إلى الإعدادات ← الخصوصية والأمان ← إعدادات الموقع ← الموقع
                </p>
            `;
        } else if (isSafari) {
            instructions = `
                <h3 style="margin-top: 0; color: #007AFF;">كيفية تفعيل الموقع على Safari:</h3>
                <ol style="text-align: right; line-height: 1.8; padding-right: 20px;">
                    <li>اذهب إلى <strong>Safari</strong> في شريط القوائم</li>
                    <li>اختر <strong>الإعدادات لهذا الموقع</strong></li>
                    <li>بجانب <strong>"الموقع"</strong>، اختر <strong>"السماح"</strong></li>
                    <li>أعد تحميل الصفحة</li>
                </ol>
            `;
        } else if (isFirefox) {
            instructions = `
                <h3 style="margin-top: 0; color: #007AFF;">كيفية تفعيل الموقع على Firefox:</h3>
                <ol style="text-align: right; line-height: 1.8; padding-right: 20px;">
                    <li>اضغط على أيقونة <strong>القفل</strong> 🔒 في شريط العنوان</li>
                    <li>اضغط على السهم <strong>←</strong> بجانب "الاتصال آمن"</li>
                    <li>اضغط على <strong>"مزيد من المعلومات"</strong></li>
                    <li>اذهب إلى تبويب <strong>"الأذونات"</strong></li>
                    <li>ابحث عن <strong>"مشاركة الموقع"</strong> وقم بإلغاء تحديد <strong>"استخدام الافتراضي"</strong></li>
                    <li>ضع علامة على <strong>"السماح"</strong></li>
                    <li>أعد تحميل الصفحة</li>
                </ol>
            `;
        } else {
            instructions = `
                <h3 style="margin-top: 0; color: #007AFF;">كيفية تفعيل الموقع:</h3>
                <ol style="text-align: right; line-height: 1.8; padding-right: 20px;">
                    <li>ابحث عن أيقونة <strong>القفل</strong> 🔒 أو <strong>الإعدادات</strong> ⚙️ في شريط العنوان</li>
                    <li>ابحث عن إعدادات <strong>"الموقع"</strong> أو <strong>"الأذونات"</strong></li>
                    <li>اختر <strong>"السماح"</strong> لهذا الموقع</li>
                    <li>أعد تحميل الصفحة</li>
                </ol>
            `;
        }
    } else {
        // Other errors - general troubleshooting
        instructions = `
            <h3 style="margin-top: 0; color: #007AFF;">نصائح لحل المشكلة:</h3>
            <ul style="text-align: right; line-height: 1.8; padding-right: 20px;">
                <li>تأكد من تفعيل <strong>خدمات الموقع</strong> على جهازك</li>
                <li>تأكد من اتصالك بالإنترنت</li>
                <li>جرّب إعادة تحميل الصفحة</li>
                <li>إذا كنت في مكان مغلق، جرّب الانتقال إلى مكان مفتوح</li>
                <li>تأكد من تفعيل GPS على جهازك</li>
            </ul>
        `;
    }

    // Create modal dialog
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        ">
            ${instructions}
            <button onclick="this.closest('div[style*=fixed]').remove()" style="
                width: 100%;
                padding: 12px;
                background: #007AFF;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 20px;
            ">فهمت</button>
        </div>
    `;

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

// Show location permission explanation popup before requesting permission
function showLocationPermissionPopup() {
    // Check if user has already seen this popup in this session
    if (sessionStorage.getItem('locationPopupShown')) {
        // Already shown, just request location directly
        userLocationTracking = addUserLocationTracking(map);
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'location-permission-popup';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            padding: 32px 24px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: slideUp 0.3s ease;
        ">
            <div style="
                font-size: 48px;
                margin-bottom: 16px;
            ">📍</div>

            <h3 style="
                margin: 0 0 16px 0;
                color: #007AFF;
                font-size: 20px;
                font-weight: 600;
            ">نحتاج إلى موقعك</h3>

            <p style="
                margin: 0 0 24px 0;
                color: #666;
                font-size: 16px;
                line-height: 1.6;
            ">لكي نتمكن من إظهار موقعك على الخريطة ومساعدتك في التنقل خلال الرحلة، سنطلب منك السماح بالوصول إلى موقعك الجغرافي.</p>

            <p style="
                margin: 0 0 24px 0;
                padding: 16px;
                background: #f0f7ff;
                border-radius: 12px;
                color: #007AFF;
                font-size: 14px;
                font-weight: 500;
            ">⚠️ يرجى الضغط على "السماح" عندما يظهر الطلب</p>

            <button id="request-location-btn" style="
                width: 100%;
                padding: 14px;
                background: #007AFF;
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 17px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
            ">فهمت، المتابعة</button>
        </div>
    `;

    // Add hover effect to button
    const button = modal.querySelector('#request-location-btn');
    button.addEventListener('mouseenter', () => {
        button.style.background = '#0051D5';
    });
    button.addEventListener('mouseleave', () => {
        button.style.background = '#007AFF';
    });

    // Handle button click
    button.addEventListener('click', () => {
        // Mark as shown for this session
        sessionStorage.setItem('locationPopupShown', 'true');

        // Add fade out animation
        modal.style.animation = 'fadeOut 0.3s ease';

        // Remove modal after animation
        setTimeout(() => {
            modal.remove();
        }, 300);

        // Now request location permission - this will trigger browser's native prompt
        userLocationTracking = addUserLocationTracking(map);
    });

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(modal);
}
