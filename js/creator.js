// Trip Creator JavaScript - Leaflet Version

let map;
let markers = [];
let polyline = null;
let points = []; // { type: 'poi' | 'secondary', coordinates, data, marker }
let addMode = null; // 'poi' | 'secondary' | null
let editingPointIndex = null;
let currentLearningTasks = []; // Temporary array for learning tasks being edited

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize map
    map = createMap('map', CONFIG.HAIFA_CENTER, CONFIG.DEFAULT_ZOOM);

    // Add click listener for adding points
    map.on('click', (event) => {
        if (addMode) {
            addPoint(event.latlng, addMode);
            // Don't clear addMode - keep it active until user deactivates
        }
    });

    setupEventListeners();

    // Check if we're editing an existing trip
    await checkForEditMode();
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

    // Learning tasks button
    document.getElementById('add-learning-task-btn').addEventListener('click', () => {
        addLearningTaskField();
    });

    // Preview button
    document.getElementById('preview-btn').addEventListener('click', previewTrip);

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
            true, // draggable
            points.length + 1 // overall position number
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
            title: '',
            subtitle: '',
            description: '',
            photo: '',
            missionLink: '',
            learningTasks: []
        } : null,
        marker: marker
    };

    points.push(point);
    markers.push(marker);

    // Update display
    updatePointsList();
    updatePolyline();

    // Don't auto-open editor - let user add multiple points first
}

// Edit a point
function editPoint(index) {
    if (points[index].type !== 'poi') return;

    editingPointIndex = index;
    const point = points[index];

    // Calculate POI number (count only POI type points up to this index)
    const poiNumber = points.slice(0, index + 1).filter(p => p.type === 'poi').length;

    // Strip 'images/' prefix from photo path for display
    let photoValue = point.data.photo || '';
    if (photoValue.startsWith('images/')) {
        photoValue = photoValue.substring(7); // Remove 'images/'
    }

    document.getElementById('poi-title').value = point.data.title || '';
    document.getElementById('poi-subtitle').value = point.data.subtitle || '';
    document.getElementById('poi-description').value = point.data.description || '';
    document.getElementById('poi-photo').value = photoValue;
    document.getElementById('poi-mission').value = point.data.missionLink || '';

    // Show POI number in editor title
    document.getElementById('poi-editor-number').textContent = `(${poiNumber})`;

    // Load learning tasks
    currentLearningTasks = point.data.learningTasks ? [...point.data.learningTasks] : [];
    displayLearningTasks();

    document.getElementById('poi-editor').style.display = 'block';
    document.getElementById('poi-editor').scrollIntoView({ behavior: 'smooth' });
}

// Save POI edit
function savePOIEdit() {
    if (editingPointIndex === null) return;

    const point = points[editingPointIndex];
    let photoValue = document.getElementById('poi-photo').value.trim();

    // Add 'images/' prefix if not already present
    if (photoValue && !photoValue.startsWith('images/')) {
        photoValue = 'images/' + photoValue;
    }

    point.data = {
        title: document.getElementById('poi-title').value,
        subtitle: document.getElementById('poi-subtitle').value,
        description: document.getElementById('poi-description').value,
        photo: photoValue,
        missionLink: document.getElementById('poi-mission').value,
        learningTasks: [...currentLearningTasks]
    };

    closePoiEditor();
    updatePointsList();
}

// Close POI editor
function closePoiEditor() {
    editingPointIndex = null;
    currentLearningTasks = [];
    document.getElementById('poi-editor').style.display = 'none';
    document.getElementById('poi-form').reset();
    displayLearningTasks();
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
        } else {
            // Update secondary marker number
            const newMarker = createSimpleMarker(
                [point.coordinates.lat, point.coordinates.lng],
                '#666',
                true, // draggable
                index + 1 // overall position number
            );
            newMarker.on('dragend', (event) => {
                const newLatLng = event.target.getLatLng();
                point.coordinates = {
                    lat: newLatLng.lat,
                    lng: newLatLng.lng
                };
                updatePolyline();
            });

            map.removeLayer(point.marker);
            newMarker.addTo(map);
            point.marker = newMarker;
            markers[index] = newMarker;
        }
    });
}

// Setup drag and drop for points list
let draggedIndex = null;

function setupDragAndDrop() {
    const pointItems = document.querySelectorAll('.point-item');

    pointItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedIndex = parseInt(e.target.dataset.index);
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            draggedIndex = null;
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropIndex = parseInt(e.currentTarget.dataset.index);

            if (draggedIndex !== null && draggedIndex !== dropIndex) {
                // Reorder points array
                const draggedPoint = points[draggedIndex];
                points.splice(draggedIndex, 1);

                // Adjust index if dragging down (after removal, indices shift)
                const newIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
                points.splice(newIndex, 0, draggedPoint);

                // Update display and map
                updatePointsList();
                updatePolyline();
                updateMarkerNumbers();
            }
        });
    });
}

// Update points list display
function updatePointsList() {
    const pointsList = document.getElementById('points-list');

    if (points.length === 0) {
        pointsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">لا توجد نقاط بعد</p>';
        return;
    }

    const tripColor = document.getElementById('trip-color').value;
    let poiCount = 1; // Counter for POI numbers only

    pointsList.innerHTML = points.map((point, index) => {
        let displayNumber = '';
        let displayIcon = '';

        if (point.type === 'poi') {
            // Create a numbered circle with trip color for POIs
            displayNumber = poiCount;
            displayIcon = `
                <div style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background-color: ${tripColor};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: white;
                    font-size: 14px;
                    flex-shrink: 0;
                ">
                    ${displayNumber}
                </div>
            `;
            poiCount++;
        } else {
            // For secondary points, show the sequential number
            displayIcon = `<span style="font-weight: 600; color: var(--text-secondary);">${index + 1}</span>`;
        }

        return `
            <div class="point-item" draggable="true" data-index="${index}">
                <div class="flex items-center gap-sm" style="flex: 1;">
                    <span class="drag-handle" style="cursor: grab;">☰</span>
                    ${displayIcon}
                    <span>
                        ${point.type === 'poi' ?
                            `${point.data.title || 'نقطة اهتمام بدون اسم'}` :
                            'نقطة توجيه'}
                    </span>
                </div>
                <div class="flex gap-sm">
                    ${point.type === 'poi' ? `<button onclick="editPoint(${index})" class="btn btn-secondary btn-small">✏️</button>` : ''}
                    <button onclick="deletePoint(${index})" class="btn btn-danger btn-small">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    // Setup drag and drop
    setupDragAndDrop();
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

// Learning tasks management functions
function addLearningTaskField(task = null) {
    if (!task) {
        task = {
            title: '',
            body: '',
            url: '',
            urlTitle: '',
            pdfs: [],
            color: '#ff69b4' // Default pink color
        };
    }
    currentLearningTasks.push(task);
    displayLearningTasks();
}

function removeLearningTask(index) {
    currentLearningTasks.splice(index, 1);
    displayLearningTasks();
}

function updateLearningTaskField(index, field, value) {
    if (!currentLearningTasks[index]) return;
    currentLearningTasks[index][field] = value;
}

function addPdfToTask(index) {
    const filename = prompt('أدخل اسم ملف PDF (مثال: activity1.pdf):');
    if (filename && filename.trim()) {
        if (!currentLearningTasks[index].pdfs) {
            currentLearningTasks[index].pdfs = [];
        }
        // Automatically prepend "pdfs/" to the filename
        const pdfPath = 'pdfs/' + filename.trim();
        currentLearningTasks[index].pdfs.push(pdfPath);
        displayLearningTasks();
    }
}

function removePdfFromTask(taskIndex, pdfIndex) {
    if (currentLearningTasks[taskIndex] && currentLearningTasks[taskIndex].pdfs) {
        currentLearningTasks[taskIndex].pdfs.splice(pdfIndex, 1);
        displayLearningTasks();
    }
}

function addLinkToTask(index) {
    const url = prompt('أدخل الرابط (URL):');
    if (url && url.trim()) {
        if (!currentLearningTasks[index].links) {
            currentLearningTasks[index].links = [];
        }
        const title = prompt('أدخل عنوان الرابط (اختياري):', 'رابط');
        currentLearningTasks[index].links.push({
            url: url.trim(),
            title: title ? title.trim() : 'رابط'
        });
        displayLearningTasks();
    }
}

function removeLinkFromTask(taskIndex, linkIndex) {
    if (currentLearningTasks[taskIndex] && currentLearningTasks[taskIndex].links) {
        currentLearningTasks[taskIndex].links.splice(linkIndex, 1);
        displayLearningTasks();
    }
}

function updateLinkInTask(taskIndex, linkIndex, field, value) {
    if (currentLearningTasks[taskIndex] && currentLearningTasks[taskIndex].links && currentLearningTasks[taskIndex].links[linkIndex]) {
        currentLearningTasks[taskIndex].links[linkIndex][field] = value;
    }
}

function displayLearningTasks() {
    const container = document.getElementById('learning-tasks-list');

    if (currentLearningTasks.length === 0) {
        container.innerHTML = '<p style="font-size: 14px; color: var(--text-secondary);">لا توجد أنشطة تعليمية بعد</p>';
        return;
    }

    container.innerHTML = currentLearningTasks.map((task, index) => {
        const taskTitle = typeof task === 'string' ? task : (task.title || '');
        const taskBody = typeof task === 'object' ? (task.body || '') : '';
        const taskLinks = typeof task === 'object' ? (task.links || []) : [];
        const taskPdfs = typeof task === 'object' ? (task.pdfs || []) : [];
        const taskColor = typeof task === 'object' ? (task.color || '#ff69b4') : '#ff69b4';

        return `
            <div style="border: 2px solid ${taskColor}; border-radius: 8px; padding: 16px; background: var(--background);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <strong style="color: ${taskColor};">نشاط ${index + 1}</strong>
                    <button
                        type="button"
                        onclick="removeLearningTask(${index})"
                        class="btn btn-danger btn-small"
                    >🗑️ حذف</button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 13px; font-weight: 600;">العنوان (إجباري)</label>
                        <input
                            type="text"
                            value="${taskTitle}"
                            onchange="updateLearningTaskField(${index}, 'title', this.value)"
                            placeholder="عنوان النشاط"
                            required
                            style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px;"
                        >
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 13px; font-weight: 600;">الوصف (اختياري)</label>
                        <textarea
                            onchange="updateLearningTaskField(${index}, 'body', this.value)"
                            placeholder="وصف تفصيلي للنشاط"
                            rows="3"
                            style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; resize: vertical;"
                        >${taskBody}</textarea>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 13px; font-weight: 600;">الروابط (اختياري)</label>
                        ${taskLinks.length > 0 ? `
                            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
                                ${taskLinks.map((link, linkIndex) => `
                                    <div style="display: flex; flex-direction: column; gap: 6px; padding: 8px; background: var(--surface); border-radius: 4px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <input
                                                type="url"
                                                value="${link.url}"
                                                onchange="updateLinkInTask(${index}, ${linkIndex}, 'url', this.value)"
                                                placeholder="https://example.com"
                                                style="flex: 1; padding: 6px; border: 1px solid var(--border); border-radius: 3px; font-size: 12px;"
                                            >
                                            <button
                                                type="button"
                                                onclick="removeLinkFromTask(${index}, ${linkIndex})"
                                                class="btn btn-danger btn-small"
                                                style="padding: 2px 8px; font-size: 12px;"
                                            >✕</button>
                                        </div>
                                        <input
                                            type="text"
                                            value="${link.title}"
                                            onchange="updateLinkInTask(${index}, ${linkIndex}, 'title', this.value)"
                                            placeholder="عنوان الرابط (مثال: شاهد الفيديو)"
                                            style="width: 100%; padding: 6px; border: 1px solid var(--border); border-radius: 3px; font-size: 12px;"
                                        >
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        <button
                            type="button"
                            onclick="addLinkToTask(${index})"
                            class="btn btn-secondary btn-small"
                        >+ إضافة رابط</button>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 13px; font-weight: 600;">لون النشاط</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input
                                type="color"
                                value="${taskColor}"
                                onchange="updateLearningTaskField(${index}, 'color', this.value); displayLearningTasks();"
                                style="width: 60px; height: 40px; padding: 2px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer;"
                            >
                            <span style="font-size: 13px; color: var(--text-secondary);">${taskColor}</span>
                        </div>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 13px; font-weight: 600;">ملفات PDF (اختياري)</label>
                        ${taskPdfs.length > 0 ? `
                            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
                                ${taskPdfs.map((pdf, pdfIndex) => `
                                    <div style="display: flex; align-items: center; gap: 8px; padding: 6px; background: var(--surface); border-radius: 4px;">
                                        <span style="flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${pdf}</span>
                                        <button
                                            type="button"
                                            onclick="removePdfFromTask(${index}, ${pdfIndex})"
                                            class="btn btn-danger btn-small"
                                            style="padding: 2px 8px; font-size: 12px;"
                                        >✕</button>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        <button
                            type="button"
                            onclick="addPdfToTask(${index})"
                            class="btn btn-secondary btn-small"
                        >+ إضافة PDF</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Check if we're in edit mode and load trip data
async function checkForEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('edit');

    if (!tripId) return;

    try {
        // Load trips index
        const indexResponse = await fetch('routes/trips-index.json');
        const tripsIndex = await indexResponse.json();

        // Find and load the trip
        for (const tripFile of tripsIndex.trips) {
            const response = await fetch(`routes/${tripFile}`);
            const tripData = await response.json();

            if (tripData.id === tripId) {
                loadTripData(tripData);
                break;
            }
        }
    } catch (error) {
        console.error('Error loading trip for editing:', error);
        alert('خطأ في تحميل المسار للتحرير');
    }
}

// Load trip data into the creator
function loadTripData(trip) {
    // Fill form fields
    document.getElementById('trip-id').value = trip.id;
    document.getElementById('trip-title').value = trip.title;
    document.getElementById('trip-description').value = trip.description;
    document.getElementById('trip-color').value = trip.color;
    if (trip.duration) {
        document.getElementById('trip-duration').value = trip.duration;
    }

    // Set grades checkboxes
    const gradeCheckboxes = document.querySelectorAll('input[name="grades"]');
    gradeCheckboxes.forEach(checkbox => {
        checkbox.checked = trip.grades.includes(parseInt(checkbox.value));
    });

    // Combine POIs and secondary points, sort by order
    const allPoints = [
        ...trip.pointsOfInterest.map(poi => ({ ...poi, type: 'poi' })),
        ...trip.secondaryPoints.map(sp => ({ ...sp, type: 'secondary' }))
    ].sort((a, b) => a.order - b.order);

    // Load points onto map
    allPoints.forEach(point => {
        const latlng = L.latLng(point.coordinates.lat, point.coordinates.lng);

        if (point.type === 'poi') {
            // Create POI marker
            const marker = createNumberedMarker(
                [point.coordinates.lat, point.coordinates.lng],
                trip.color,
                trip.pointsOfInterest.filter(p => p.order <= point.order).length,
                true // draggable
            );

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

            // Add click listener for editing
            marker.on('click', () => {
                const pointIndex = markers.indexOf(marker);
                editPoint(pointIndex);
            });

            marker.addTo(map);

            const pointData = {
                type: 'poi',
                coordinates: point.coordinates,
                data: {
                    title: point.title,
                    subtitle: point.subtitle,
                    description: point.description,
                    photo: point.photo,
                    missionLink: point.missionLink,
                    learningTasks: point.learningTasks || []
                },
                marker: marker
            };

            points.push(pointData);
            markers.push(marker);

        } else {
            // Create secondary point marker
            const marker = createSimpleMarker(
                [point.coordinates.lat, point.coordinates.lng],
                '#666',
                true, // draggable
                points.length + 1
            );

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

            marker.addTo(map);

            const pointData = {
                type: 'secondary',
                coordinates: point.coordinates,
                data: null,
                marker: marker
            };

            points.push(pointData);
            markers.push(marker);
        }
    });

    // Update display
    updatePointsList();
    updatePolyline();

    // Fit map to show all points
    if (points.length > 0) {
        const bounds = L.latLngBounds(points.map(p => [p.coordinates.lat, p.coordinates.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Build trip object from current form and points
function buildTripObject() {
    const form = document.getElementById('trip-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return null;
    }

    const id = document.getElementById('trip-id').value;
    const title = document.getElementById('trip-title').value;
    const description = document.getElementById('trip-description').value;
    const color = document.getElementById('trip-color').value;
    const duration = document.getElementById('trip-duration').value || null;

    const gradesCheckboxes = document.querySelectorAll('input[name="grades"]:checked');
    const grades = Array.from(gradesCheckboxes).map(cb => parseInt(cb.value));

    if (grades.length === 0) {
        alert('يجب اختيار صف واحد على الأقل');
        return null;
    }

    // Get POIs
    const pois = points
        .filter(p => p.type === 'poi')
        .map((p, index) => ({
            id: `poi-${Date.now()}-${index}`,
            title: p.data.title,
            subtitle: p.data.subtitle,
            description: p.data.description,
            coordinates: p.coordinates,
            photo: p.data.photo,
            missionLink: p.data.missionLink,
            learningTasks: p.data.learningTasks || [],
            order: points.indexOf(p) + 1
        }));

    if (pois.length === 0) {
        alert('يجب إضافة نقطة اهتمام واحدة على الأقل');
        return null;
    }

    // Get secondary points
    const secondaryPoints = points
        .filter(p => p.type === 'secondary')
        .map((p, index) => {
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

    // Add optional duration if provided
    if (duration) {
        trip.duration = duration;
    }

    return trip;
}

// Preview trip in a new window
function previewTrip() {
    const trip = buildTripObject();
    if (!trip) return;

    // Store trip data in session storage for preview
    sessionStorage.setItem('previewTrip', JSON.stringify(trip));

    // Open preview window
    const previewWindow = window.open('trip.html?preview=true', 'previewTrip', 'width=1200,height=800');
    if (!previewWindow) {
        alert('تعذر فتح نافذة المعاينة. يرجى السماح بالنوافذ المنبثقة.');
    }
}

// Export trip as JSON
function exportTrip() {
    const trip = buildTripObject();
    if (!trip) return;

    // Download as JSON
    const dataStr = JSON.stringify(trip, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${trip.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`تم تنزيل الملف ${id}.json بنجاح!\n\nالخطوات التالية:\n1. قم برفع الملف إلى مجلد routes\n2. قم بعمل commit و push إلى GitHub\n3. سيتم تحديث قائمة الرحلات تلقائياً!`);
}
