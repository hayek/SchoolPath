// Trip Creator JavaScript - Leaflet Version

let map;
let markers = [];
let polyline = null;
let points = []; // { type: 'poi' | 'secondary', coordinates, data, marker }
let addMode = null; // 'poi' | 'secondary' | null
let editingPointIndex = null;

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    map = createMap('map', CONFIG.HAIFA_CENTER, CONFIG.DEFAULT_ZOOM);

    // Add click listener for adding points
    map.on('click', (event) => {
        if (addMode) {
            addPoint(event.latlng, addMode);
            addMode = null;
            updateModeButtons();
        }
    });

    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    // Mode buttons
    document.getElementById('add-poi-mode').addEventListener('click', () => {
        addMode = addMode === 'poi' ? null : 'poi';
        updateModeButtons();
    });

    document.getElementById('add-secondary-mode').addEventListener('click', () => {
        addMode = addMode === 'secondary' ? null : 'secondary';
        updateModeButtons();
    });

    // POI form
    document.getElementById('poi-form').addEventListener('submit', (e) => {
        e.preventDefault();
        savePOIEdit();
    });

    document.getElementById('cancel-poi-edit').addEventListener('click', () => {
        closePoiEditor();
    });

    // Export button
    document.getElementById('export-btn').addEventListener('click', exportTrip);
}

// Update mode buttons visual state
function updateModeButtons() {
    const poiBtn = document.getElementById('add-poi-mode');
    const secondaryBtn = document.getElementById('add-secondary-mode');

    poiBtn.className = addMode === 'poi' ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small';
    secondaryBtn.className = addMode === 'secondary' ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small';

    // Update cursor style
    if (addMode) {
        map.getContainer().style.cursor = 'crosshair';
    } else {
        map.getContainer().style.cursor = '';
    }
}

// Add a point to the map
function addPoint(latlng, type) {
    const coordinates = {
        lat: latlng.lat,
        lng: latlng.lng
    };

    const color = document.getElementById('trip-color').value;

    // Create marker
    let marker;
    if (type === 'poi') {
        marker = createNumberedMarker(
            [coordinates.lat, coordinates.lng],
            color,
            points.filter(p => p.type === 'poi').length + 1,
            true // draggable
        );
    } else {
        marker = createSimpleMarker(
            [coordinates.lat, coordinates.lng],
            '#666',
            true // draggable
        );
    }

    // Add drag event
    marker.on('dragend', (event) => {
        const newLatLng = event.target.getLatLng();
        const pointIndex = markers.indexOf(marker);
        if (pointIndex >= 0) {
            points[pointIndex].coordinates = {
                lat: newLatLng.lat,
                lng: newLatLng.lng
            };
            updatePolyline();
        }
    });

    // Add click listener for editing POIs
    if (type === 'poi') {
        marker.on('click', () => {
            const pointIndex = markers.indexOf(marker);
            editPoint(pointIndex);
        });
    }

    marker.addTo(map);

    const point = {
        type: type,
        coordinates: coordinates,
        data: type === 'poi' ? {
            name: '',
            description: '',
            photo: '',
            missionLink: ''
        } : null,
        marker: marker
    };

    points.push(point);
    markers.push(marker);

    // Update display
    updatePointsList();
    updatePolyline();

    // If POI, open editor
    if (type === 'poi') {
        editPoint(points.length - 1);
    }
}

// Edit a point
function editPoint(index) {
    if (points[index].type !== 'poi') return;

    editingPointIndex = index;
    const point = points[index];

    document.getElementById('poi-name').value = point.data.name || '';
    document.getElementById('poi-description').value = point.data.description || '';
    document.getElementById('poi-photo').value = point.data.photo || '';
    document.getElementById('poi-mission').value = point.data.missionLink || '';

    document.getElementById('poi-editor').style.display = 'block';
    document.getElementById('poi-editor').scrollIntoView({ behavior: 'smooth' });
}

// Save POI edit
function savePOIEdit() {
    if (editingPointIndex === null) return;

    const point = points[editingPointIndex];
    point.data = {
        name: document.getElementById('poi-name').value,
        description: document.getElementById('poi-description').value,
        photo: document.getElementById('poi-photo').value,
        missionLink: document.getElementById('poi-mission').value
    };

    closePoiEditor();
    updatePointsList();
}

// Close POI editor
function closePoiEditor() {
    editingPointIndex = null;
    document.getElementById('poi-editor').style.display = 'none';
    document.getElementById('poi-form').reset();
}

// Delete a point
function deletePoint(index) {
    if (!confirm('هل تريد حذف هذه النقطة؟')) return;

    map.removeLayer(points[index].marker);
    points.splice(index, 1);
    markers.splice(index, 1);

    updatePointsList();
    updatePolyline();
    updateMarkerNumbers();
}

// Move point up in order
function movePointUp(index) {
    if (index === 0) return;

    [points[index], points[index - 1]] = [points[index - 1], points[index]];
    updatePointsList();
    updatePolyline();
    updateMarkerNumbers();
}

// Move point down in order
function movePointDown(index) {
    if (index === points.length - 1) return;

    [points[index], points[index + 1]] = [points[index + 1], points[index]];
    updatePointsList();
    updatePolyline();
    updateMarkerNumbers();
}

// Update marker numbers after reordering
function updateMarkerNumbers() {
    const color = document.getElementById('trip-color').value;
    let poiCount = 1;

    points.forEach((point, index) => {
        if (point.type === 'poi') {
            // Update POI marker number
            const newMarker = createNumberedMarker(
                [point.coordinates.lat, point.coordinates.lng],
                color,
                poiCount,
                true // draggable
            );
            newMarker.on('dragend', (event) => {
                const newLatLng = event.target.getLatLng();
                point.coordinates = {
                    lat: newLatLng.lat,
                    lng: newLatLng.lng
                };
                updatePolyline();
            });
            newMarker.on('click', () => {
                editPoint(index);
            });

            map.removeLayer(point.marker);
            newMarker.addTo(map);
            point.marker = newMarker;
            markers[index] = newMarker;

            poiCount++;
        }
    });
}

// Update points list display
function updatePointsList() {
    const pointsList = document.getElementById('points-list');

    if (points.length === 0) {
        pointsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">لا توجد نقاط بعد</p>';
        return;
    }

    pointsList.innerHTML = points.map((point, index) => `
        <div class="point-item">
            <div class="flex items-center gap-sm" style="flex: 1;">
                <span style="font-weight: 600; color: var(--text-secondary);">${index + 1}</span>
                <span>
                    ${point.type === 'poi' ?
                        `📍 ${point.data.name || 'نقطة اهتمام بدون اسم'}` :
                        '• نقطة توجيه'}
                </span>
            </div>
            <div class="flex gap-sm">
                ${index > 0 ? `<button onclick="movePointUp(${index})" class="btn btn-link btn-small">↑</button>` : ''}
                ${index < points.length - 1 ? `<button onclick="movePointDown(${index})" class="btn btn-link btn-small">↓</button>` : ''}
                ${point.type === 'poi' ? `<button onclick="editPoint(${index})" class="btn btn-secondary btn-small">✏️</button>` : ''}
                <button onclick="deletePoint(${index})" class="btn btn-danger btn-small">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Update polyline on map
function updatePolyline() {
    if (polyline) {
        map.removeLayer(polyline);
    }

    if (points.length < 2) return;

    const path = points.map(point => point.coordinates);
    const color = document.getElementById('trip-color').value;

    polyline = createPolyline(map, path, color, 4);
}

// Update marker colors when trip color changes
document.getElementById('trip-color').addEventListener('change', () => {
    updateMarkerNumbers();
    updatePolyline();
});

// Export trip as JSON
function exportTrip() {
    // Validate form
    const form = document.getElementById('trip-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Get form data
    const id = document.getElementById('trip-id').value;
    const title = document.getElementById('trip-title').value;
    const description = document.getElementById('trip-description').value;
    const color = document.getElementById('trip-color').value;

    const gradesCheckboxes = document.querySelectorAll('input[name="grades"]:checked');
    const grades = Array.from(gradesCheckboxes).map(cb => parseInt(cb.value));

    if (grades.length === 0) {
        alert('يجب اختيار صف واحد على الأقل');
        return;
    }

    // Get POIs
    const pois = points
        .filter(p => p.type === 'poi')
        .map((p, index) => ({
            id: `poi-${Date.now()}-${index}`,
            name: p.data.name,
            description: p.data.description,
            coordinates: p.coordinates,
            photo: p.data.photo,
            missionLink: p.data.missionLink,
            order: points.indexOf(p) + 1
        }));

    if (pois.length === 0) {
        alert('يجب إضافة نقطة اهتمام واحدة على الأقل');
        return;
    }

    // Get secondary points
    const secondaryPoints = points
        .filter(p => p.type === 'secondary')
        .map((p, index) => {
            // Find the POI that comes before this secondary point
            const pointIndex = points.indexOf(p);
            let afterPOI = null;
            for (let i = pointIndex - 1; i >= 0; i--) {
                if (points[i].type === 'poi') {
                    afterPOI = pois.find(poi => poi.order === i + 1)?.id;
                    break;
                }
            }

            return {
                id: `secondary-${Date.now()}-${index}`,
                coordinates: p.coordinates,
                order: pointIndex + 1,
                afterPOI: afterPOI || pois[0].id
            };
        });

    // Create trip object
    const trip = {
        id: id,
        title: title,
        description: description,
        color: color,
        grades: grades,
        pointsOfInterest: pois,
        secondaryPoints: secondaryPoints
    };

    // Download as JSON
    const dataStr = JSON.stringify(trip, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`تم تنزيل الملف ${id}.json بنجاح!\n\nالخطوات التالية:\n1. قم برفع الملف إلى مجلد routes\n2. قم بعمل commit و push إلى GitHub\n3. سيتم تحديث قائمة الرحلات تلقائياً!`);
}
