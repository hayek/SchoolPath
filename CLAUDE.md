# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NaviGo** is a mobile-first web application for creating and managing educational walking tours in Haifa, Israel. It's designed for students in grades 1-8 and allows teachers to create custom routes with points of interest, missions, and integrated map navigation.

### Key Characteristic
- **Static site architecture** (no backend/database required)
- Pure vanilla JavaScript (ES6+), HTML5, CSS3
- Mobile-first responsive design with Hebrew RTL support
- Hosted on GitHub Pages
- Uses Geoapify Maps API (configured in config.js)

## Quick Start

### Running Locally
The project uses a static file architecture that requires a local web server:

```bash
# Python 3 (macOS built-in)
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`

### Configuration
Edit `config.js` to set:
- Geoapify API key (required)
- Default map center coordinates
- Map style and zoom level

## Architecture Overview

### Three Main Pages
1. **index.html** - Main page displaying all trips on a unified map
2. **trip.html** - Individual trip details with full route
3. **creator.html** - Visual trip creator tool with map interface

### Core JavaScript Modules
- **maps.js** (16KB) - Shared map utilities and helpers
- **index.js** - Main page logic (loads all trips, unified map)
- **trip.js** - Trip detail page logic (single trip display)
- **poi-detail.js** - POI detail view logic
- **creator.js** (29KB) - Trip creation interface and JSON export
- **editor.js** - Helper for trip editing

### Data Structure
```
routes/
├── trips-index.json          # Central registry of all trips
└── *.json                     # Individual trip files (one per trip)
```

Each trip JSON contains:
- Metadata: id, title, description, color, grades, date
- pointsOfInterest: Array of educational stops with coordinates, photos, missions
- secondaryPoints: Routing waypoints for precise path control

See `DATA_STRUCTURE.md` for complete schema.

### Styling
- **css/styles.css** - Single comprehensive stylesheet using CSS Grid/Flexbox
- Design system: Apple-inspired minimalist UI
- Responsive breakpoints: mobile-first approach
- CSS custom properties for theming

## Development Workflow

### Important Note
Per the readme.md, **do not commit or push changes automatically**. Always let the user handle commits and pushes manually unless he asks to.

### Common Development Tasks

**Creating/Editing Trips**
1. Use creator.html to visually design trips
2. Export JSON file
3. Place in routes/ folder
4. Update routes/trips-index.json to register the trip

**Manual Trip JSON Creation**
Edit trip files directly following the schema in `DATA_STRUCTURE.md`. The creator tool exports valid JSON that can be used as a template.

**Adding Trip to Site**
1. Save JSON file to `routes/` folder
2. Add filename to `routes/trips-index.json`:
   ```json
   {
       "trips": ["existing-trip.json", "new-trip.json"]
   }
   ```

### Updating Geoapify API Configuration
1. Get a free API key from https://www.geoapify.com/
2. Update config.js with your key (line 5)
3. Optionally adjust MAP_STYLE in config.js

## File Organization

```
NaviGo/
├── index.html                 # Main page
├── trip.html                  # Trip detail page
├── creator.html               # Trip creator
├── poi-detail.html            # POI detail view
├── editor.html                # Trip editor
├── config.js                  # API & config settings
│
├── css/
│   └── styles.css             # Complete design system
│
├── js/
│   ├── index.js               # Main page logic
│   ├── trip.js                # Trip page logic
│   ├── creator.js             # Creator tool (29KB - largest file)
│   ├── poi-detail.js          # POI detail logic
│   ├── maps.js                # Shared map utilities
│   └── editor.js              # Editor helper
│
├── routes/
│   ├── trips-index.json       # Trip registry
│   ├── carmel-center.json     # Example trip
│   ├── gan-hame.json          # Example trip
│   ├── gan-atsmaoot.json      # Example trip
│   └── library.json           # Example trip
│
├── images/                    # POI photos
├── css/                       # Stylesheets
├── assets/                    # App icons and assets
│
└── Documentation/
    ├── ARCHITECTURE.md        # System architecture diagrams
    ├── QUICKSTART.md          # 5-minute setup
    ├── SETUP.md               # Full setup guide
    ├── DATA_STRUCTURE.md      # JSON schema
    ├── PROJECT_SUMMARY.md     # Feature overview
    ├── TEACHER_GUIDE.md       # User guide (Hebrew)
    └── DEPLOY_TO_GITHUB.md    # GitHub Pages deployment
```

## Key Implementation Patterns

### Fetching Trip Data
```javascript
// Load trips-index.json
fetch('routes/trips-index.json')
  .then(r => r.json())
  .then(data => {
    // data.trips contains list of trip filenames
    // Load each individually
  })

// Load individual trip
fetch(`routes/${tripId}.json`).then(r => r.json())
```

### URL Parameters
Trip pages use query parameters:
- `trip.html?id=trip-id` - Load specific trip
- ID matches the trip's JSON filename (without .json)

### Map Initialization
All pages use Geoapify Maps API. The initMap() function:
1. Checks if Google Maps (old) or Geoapify (new)
2. Sets center to HAIFA_CENTER from config
3. Loads trip data asynchronously
4. Renders polylines (routes) and markers (POIs)

### Learning Tasks Enhancement
Recent updates added customizable learning task cards with:
- Individual card display per learning task
- Color customization per task
- Mobile-friendly touch targets

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Maps API**: Geoapify (replaces Google Maps)
- **Data Format**: JSON (static files)
- **Hosting**: GitHub Pages ready
- **No build tools**: Works as-is, no npm/webpack needed

## Deployment

### GitHub Pages
```bash
# Automatic after repository setup
# Settings → Pages → Source: main branch
# Site deployed to: https://USERNAME.github.io/REPO_NAME/
```

### Pre-deployment Checklist
1. ✅ Valid Geoapify API key in config.js
2. ✅ All trip JSONs valid and registered in trips-index.json
3. ✅ Image paths point to actual files
4. ✅ No console errors when running locally

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS/Android)
- ⚠️ IE 11 not supported

## Performance Notes

- **Single stylesheet** (styles.css) for all pages
- **Vanilla JS** keeps bundle small
- **Lazy-loaded images** for POIs
- **Static JSON** files load efficiently
- Typical page load: < 2 seconds with good connection

## Recent Changes & Context

### Latest Improvements (October 2024)
- Enhanced learning task feature with individual card display
- Mobile-friendly touch targets for task buttons
- Customizable colors per learning task
- Refactored to use learningTasks array (removed hasLearningActivity boolean)
- Migration from Google Maps to Geoapify for map rendering

### Common Git Commit Pattern
See recent commits for style: keep messages concise, use conventional commits (feat:, fix:, refactor:), include emoji where helpful.

## No Additional Setup Required

Unlike typical web projects:
- ❌ No npm install
- ❌ No build step
- ❌ No transpilation
- ❌ No config files to modify (except config.js)
- ✅ Just serve the folder and start developing

## Documentation References

- `ARCHITECTURE.md` - System diagrams and data flows
- `QUICKSTART.md` - 5-minute setup (start here)
- `SETUP.md` - Complete setup with troubleshooting
- `DATA_STRUCTURE.md` - JSON schema and format
- `TEACHER_GUIDE.md` - User documentation (Hebrew)
- `PROJECT_SUMMARY.md` - Feature overview
- `readme.md` - Original requirements
