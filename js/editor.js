// Editor Page JavaScript

let allTrips = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllTrips();
});

// Load all trips
async function loadAllTrips() {
    try {
        // Fetch the trips index
        const indexResponse = await fetch('routes/trips-index.json');
        const tripsIndex = await indexResponse.json();

        // Load all trips
        const tripPromises = tripsIndex.trips.map(async (tripFile) => {
            const response = await fetch(`routes/${tripFile}`);
            const tripData = await response.json();
            return { ...tripData, filename: tripFile };
        });

        allTrips = await Promise.all(tripPromises);

        // Display trips
        displayTrips();

    } catch (error) {
        console.error('Error loading trips:', error);
        document.getElementById('paths-list').innerHTML = `
            <div class="empty-state">
                <p>خطأ في تحميل المسارات</p>
            </div>
        `;
    }
}

// Display trips list
function displayTrips() {
    const pathsList = document.getElementById('paths-list');

    if (allTrips.length === 0) {
        pathsList.innerHTML = `
            <div class="empty-state">
                <p>لا توجد مسارات بعد</p>
                <a href="creator.html" class="btn btn-primary mt-md">أنشئ أول مسار</a>
            </div>
        `;
        return;
    }

    pathsList.className = 'path-list';
    pathsList.innerHTML = allTrips.map(trip => `
        <div class="path-card">
            <h3>${trip.title}</h3>
            <p>${trip.description}</p>

            <div class="path-info">
                <div class="path-info-item">
                    <strong>المعرّف:</strong>
                    <span>${trip.id}</span>
                </div>
                <div class="path-info-item">
                    <strong>النقاط:</strong>
                    <span>${trip.pointsOfInterest.length}</span>
                </div>
                <div class="path-info-item">
                    <strong>الصفوف:</strong>
                    <span>${trip.grades.join(', ')}</span>
                </div>
                <div class="path-info-item">
                    <strong>اللون:</strong>
                    <span style="display: inline-block; width: 20px; height: 20px; background: ${trip.color}; border-radius: 4px; border: 1px solid var(--border);"></span>
                </div>
            </div>

            <div class="path-actions">
                <button onclick="editTrip('${trip.id}')" class="btn btn-primary">✏️ تحرير</button>
                <a href="trip.html?id=${trip.id}" target="_blank" class="btn btn-secondary">👁️ عرض</a>
            </div>
        </div>
    `).join('');
}

// Edit trip - redirect to creator with trip data
function editTrip(tripId) {
    // Encode trip ID in URL parameter
    window.location.href = `creator.html?edit=${encodeURIComponent(tripId)}`;
}
