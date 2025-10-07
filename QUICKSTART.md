# PathSchool - Quick Start Guide

## Get Started in 5 Minutes! 🚀

### Step 1: Get Your Google Maps API Key (2 minutes)

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable "Maps JavaScript API"
4. Create an API key
5. Copy the key

### Step 2: Configure the Project (1 minute)

Open `config.js` and replace `YOUR_API_KEY`:

```javascript
const CONFIG = {
    GOOGLE_MAPS_API_KEY: 'paste-your-key-here',
    HAIFA_CENTER: { lat: 32.7940, lng: 34.9896 },
    DEFAULT_ZOOM: 14
};
```

### Step 3: Start a Local Server (1 minute)

**Using Python:**
```bash
python -m http.server 8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
```

**Using VS Code:**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

### Step 4: Open in Browser (30 seconds)

Visit: `http://localhost:8000`

### Step 5: Create Your First Trip! (Variable time)

1. Open `http://localhost:8000/creator.html`
2. Fill in trip details
3. Click on map to add points of interest
4. Export JSON file
5. Move JSON to `routes/` folder
6. Add filename to `routes/trips-index.json`

**Done!** Your trip is now live on the main page! 🎉

---

## Project Files Overview

```
PathSchool/
├── 📄 index.html           → Main page (view all trips)
├── 📄 trip.html            → Individual trip page
├── 📄 creator.html         → Create new trips
├── ⚙️  config.js            → API key configuration
├── 📁 css/
│   └── styles.css         → All styling
├── 📁 js/
│   ├── index.js           → Main page logic
│   ├── trip.js            → Trip page logic
│   ├── creator.js         → Creator logic
│   ├── maps.js            → Map utilities
│   └── load-maps.js       → API loader
├── 📁 routes/
│   ├── trips-index.json   → List of all trips
│   └── *.json             → Individual trip files
└── 📁 images/              → Trip photos
```

---

## Sample Trips Included

Two example trips are pre-configured:

1. **Carmel Center Tour** (`carmel-center-tour.json`)
   - 3 POIs in central Haifa
   - Grades 4-6

2. **Hadar Heritage Walk** (`hadar-heritage-walk.json`)
   - 3 historical sites
   - Grades 6-8

---

## Common Tasks

### View All Trips
Open: `index.html`

### View Specific Trip
Open: `trip.html?id=carmel-center-tour`

### Create New Trip
Open: `creator.html`

### Add Trip to Site
1. Save JSON to `routes/`
2. Add to `routes/trips-index.json`:
   ```json
   {
       "trips": ["trip1.json", "trip2.json", "new-trip.json"]
   }
   ```

---

## Deploy to GitHub Pages

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git branch -M main
git remote add origin https://github.com/USERNAME/PathSchool.git
git push -u origin main

# Enable Pages in repository Settings → Pages → Source: main
```

Your site will be live at:
`https://USERNAME.github.io/PathSchool/`

---

## Need Help?

- 📖 **Full Setup Guide**: See `SETUP.md`
- 👩‍🏫 **Teacher Guide**: See `TEACHER_GUIDE.md`
- 📊 **Data Structure**: See `DATA_STRUCTURE.md`
- 🐛 **Issues**: Check browser console (F12)

---

## Key Features

✅ Mobile-first responsive design
✅ Interactive Google Maps
✅ Walking navigation integration
✅ Visual trip creator tool
✅ Hebrew language support (RTL)
✅ Apple-inspired minimalist UI
✅ No backend required (static site)
✅ Easy to deploy on GitHub Pages

---

**Ready to create amazing walking tours! 🗺️🚶‍♂️**
