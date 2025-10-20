// POI Detail Page JavaScript

let trip = null;
let poi = null;

// Get POI ID and trip ID from URL
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('trip');
const poiId = urlParams.get('poi');

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    if (!tripId || !poiId) {
        document.getElementById('poi-page-title').textContent = 'خطأ';
        document.getElementById('poi-detail-title').textContent = 'معلومات مفقودة';
        document.getElementById('poi-detail-description').textContent = 'معرّف الرحلة أو المكان مفقود';
        return;
    }

    // Set back button
    document.getElementById('back-btn').href = `trip.html?id=${tripId}`;

    // Load POI data
    await loadPOI();
});

// Load POI data
async function loadPOI() {
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

        // Find the POI
        poi = trip.pointsOfInterest.find(p => p.id === poiId);

        if (!poi) {
            throw new Error('POI not found');
        }

        // Display POI information
        displayPOIDetail();

    } catch (error) {
        console.error('Error loading POI:', error);
        document.getElementById('poi-page-title').textContent = 'خطأ';
        document.getElementById('poi-detail-title').textContent = 'لم يتم العثور على المعلومات';
        document.getElementById('poi-detail-description').textContent = `حدث خطأ في تحميل تفاصيل المكان: ${error.message}`;
    }
}

// Display POI detail information
function displayPOIDetail() {
    // Update page title
    document.getElementById('poi-page-title').textContent = poi.title;

    // Display image if available
    const imageElement = document.getElementById('poi-detail-image');
    if (poi.photo && poi.photo.trim() !== '') {
        imageElement.src = poi.photo;
        imageElement.style.display = 'block';
        imageElement.alt = poi.title;
    } else {
        imageElement.style.display = 'none';
    }

    // Display title and subtitle
    document.getElementById('poi-detail-title').textContent = poi.title;

    const subtitleElement = document.getElementById('poi-detail-subtitle');
    if (poi.subtitle && poi.subtitle.trim() !== '') {
        subtitleElement.textContent = poi.subtitle;
    } else {
        subtitleElement.style.display = 'none';
    }

    // Display description
    document.getElementById('poi-detail-description').textContent = poi.description || 'لا يوجد وصف متاح';

    // Display learning activities if available
    const learningActivitySection = document.getElementById('learning-activity-section');
    if (learningActivitySection) {
        if (poi.hasLearningActivity && poi.learningTasks && poi.learningTasks.length > 0) {
            const tasksHTML = poi.learningTasks.map((task, index) => `
                <div style="display: flex; align-items: flex-start; gap: 12px; margin-top: ${index > 0 ? '12px' : '0'};">
                    <span style="color: #007AFF; font-size: 14px; font-weight: 600; flex-shrink: 0;">${index + 1}.</span>
                    <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">${task}</p>
                </div>
            `).join('');

            learningActivitySection.innerHTML = `
                <div style="margin: 24px 0; padding: 24px; background: #f0f9ff; border-left: 6px solid #007AFF; border-radius: 12px;">
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                        <img src="assets/idea.svg" alt="نشاط تعليمي" style="width: 28px; height: 28px; filter: invert(0.2);">
                        <strong style="color: #007AFF; font-size: 16px;">${poi.learningTasks.length > 1 ? 'أنشطة تعليمية' : 'نشاط تعليمي'}</strong>
                    </div>
                    ${tasksHTML}
                </div>
            `;
            learningActivitySection.style.display = 'block';
        } else {
            learningActivitySection.style.display = 'none';
        }
    }

    // Display mission link if available
    if (poi.missionLink && poi.missionLink.trim() !== '') {
        const missionSection = document.getElementById('mission-section');
        const missionLink = document.getElementById('mission-link');

        missionLink.href = poi.missionLink;
        missionSection.style.display = 'block';
    }
}

// Open image in fullscreen
function openImageFullscreen(imageSrc) {
    if (!imageSrc || imageSrc.trim() === '') return;

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
