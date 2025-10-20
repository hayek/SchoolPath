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
            const tasksHTML = poi.learningTasks.map((task, index) => {
                const taskTitle = typeof task === 'string' ? task : task.title;
                const taskBody = typeof task === 'object' ? task.body : '';
                const taskUrl = typeof task === 'object' ? task.url : '';
                const taskUrlTitle = typeof task === 'object' ? (task.urlTitle || 'رابط النشاط') : 'رابط النشاط';
                const taskPdfs = typeof task === 'object' ? task.pdfs : [];
                const taskColor = typeof task === 'object' ? (task.color || '#ff69b4') : '#ff69b4';

                // Generate lighter background color (add alpha)
                const taskBgColor = taskColor + '15'; // 15 = ~8% opacity

                return `
                    <div style="margin: ${index > 0 ? '16px' : '0'} 0 0 0; padding: 24px; background: ${taskBgColor}; border-left: 6px solid ${taskColor}; border-radius: 12px;">
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: ${taskBody || taskUrl || (taskPdfs && taskPdfs.length > 0) ? '16px' : '0'};">
                            <img src="assets/idea.svg" alt="نشاط تعليمي" style="width: 28px; height: 28px; filter: invert(0.2);">
                            <h4 style="margin: 0; color: ${taskColor}; font-size: 16px;">${taskTitle}</h4>
                        </div>
                        ${taskBody || taskUrl || (taskPdfs && taskPdfs.length > 0) ? `
                            <div style="padding-right: 44px;">
                                ${taskBody ? `<p style="margin: 0 0 12px 0; color: #333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${taskBody}</p>` : ''}
                                ${taskUrl ? `
                                    <a href="${taskUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: ${taskColor}; text-decoration: none; font-size: 14px; margin-bottom: 8px;">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                                            <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                                        </svg>
                                        ${taskUrlTitle}
                                    </a>
                                ` : ''}
                                ${taskPdfs && taskPdfs.length > 0 ? `
                                    <div style="margin-top: 8px;">
                                        <strong style="color: #666; font-size: 13px; display: block; margin-bottom: 6px;">ملفات PDF:</strong>
                                        ${taskPdfs.map(pdf => `
                                            <a href="${pdf}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: ${taskColor}; text-decoration: none; font-size: 13px; margin-left: 12px;">
                                                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                                                    <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/>
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
            }).join('');

            learningActivitySection.innerHTML = tasksHTML;
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
