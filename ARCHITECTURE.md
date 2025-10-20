# NaviGo - System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        NaviGo System                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│  Main Page       │    →    │  Trip Page       │    →    │  Google Maps     │
│  (index.html)    │         │  (trip.html)     │         │  Navigation      │
│                  │         │                  │         │                  │
│  • All trips map │         │  • Single route  │         │  • Walking       │
│  • Trip cards    │         │  • POI details   │         │    directions    │
│  • Browse        │         │  • Navigation    │         │  • Live GPS      │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
         ↑                            ↑
         │                            │
         │                            │
    [Load Trips]                 [Load Trip]
         │                            │
         ↓                            ↓
┌─────────────────────────────────────────────────────────┐
│                                                           │
│                    routes/                                │
│                                                           │
│  ┌──────────────────┐                                    │
│  │ trips-index.json │  → Index of all trips              │
│  └──────────────────┘                                    │
│           ↓                                               │
│  ┌──────────────────┐                                    │
│  │ trip1.json       │  → Individual trip data            │
│  │ trip2.json       │                                    │
│  │ trip3.json       │                                    │
│  └──────────────────┘                                    │
│                                                           │
└─────────────────────────────────────────────────────────┘
         ↑
         │
         │ [Export JSON]
         │
┌──────────────────┐
│                  │
│  Creator Tool    │
│  (creator.html)  │
│                  │
│  • Visual editor │
│  • Map interface │
│  • Add POIs      │
│  • Export JSON   │
│                  │
└──────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ index.html  │  │  trip.html  │  │creator.html │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                 │                 │                    │
│         └─────────────────┴─────────────────┘                    │
│                           │                                      │
│                           ↓                                      │
│              ┌────────────────────────┐                          │
│              │     styles.css         │                          │
│              │  (Design System)       │                          │
│              └────────────────────────┘                          │
│                           │                                      │
│                           ↓                                      │
│  ┌───────────────────────────────────────────────────┐          │
│  │              JavaScript Layer                      │          │
│  ├───────────────────────────────────────────────────┤          │
│  │                                                     │          │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐            │          │
│  │  │index.js │ │ trip.js │ │creator.js│            │          │
│  │  └─────────┘ └─────────┘ └──────────┘            │          │
│  │       │           │            │                   │          │
│  │       └───────────┴────────────┘                   │          │
│  │                   │                                │          │
│  │                   ↓                                │          │
│  │          ┌─────────────────┐                      │          │
│  │          │    maps.js      │  ← Shared utilities  │          │
│  │          └─────────────────┘                      │          │
│  │                   │                                │          │
│  │                   ↓                                │          │
│  │          ┌─────────────────┐                      │          │
│  │          │  load-maps.js   │  ← API loader        │          │
│  │          └─────────────────┘                      │          │
│  │                   │                                │          │
│  └───────────────────┼────────────────────────────────┘          │
│                      │                                           │
└──────────────────────┼───────────────────────────────────────────┘
                       │
                       ↓
          ┌────────────────────────┐
          │  Google Maps API       │
          │  • Maps rendering      │
          │  • Markers & polylines │
          │  • Geocoding           │
          │  • Geometry calcs      │
          └────────────────────────┘
```

## Data Flow

### 1. Viewing Trips (Main Page)

```
User visits index.html
        ↓
Load config.js (API key)
        ↓
Initialize Google Maps
        ↓
Fetch routes/trips-index.json
        ↓
For each trip in index:
    Fetch routes/{trip}.json
        ↓
Combine all trip data
        ↓
Render on unified map:
    • Draw polylines (routes)
    • Place markers (POIs)
    • Create trip cards
        ↓
User clicks trip card
        ↓
Navigate to trip.html?id={trip-id}
```

### 2. Viewing Single Trip

```
User visits trip.html?id=X
        ↓
Load config.js
        ↓
Initialize Google Maps
        ↓
Parse URL parameter (trip ID)
        ↓
Fetch routes/trips-index.json
        ↓
Find and fetch matching trip JSON
        ↓
Display on page:
    • Render route on map
    • Place numbered markers
    • Show POI cards
    • Setup navigation button
        ↓
User clicks "Start Navigation"
        ↓
Build Google Maps URL with all waypoints
        ↓
Open Google Maps app/web
```

### 3. Creating Trip

```
Teacher opens creator.html
        ↓
Load config.js
        ↓
Initialize editable Google Maps
        ↓
Teacher fills form:
    • Title, description
    • Date, grades
    • Color
        ↓
Teacher clicks "Add POI"
        ↓
Click on map to place marker
        ↓
Modal opens to edit POI:
    • Name
    • Description
    • Photo path
    • Mission link
        ↓
Repeat for all POIs and routing points
        ↓
Teacher clicks "Export JSON"
        ↓
JavaScript builds JSON object:
    {
        id, title, description,
        color, date, grades,
        pointsOfInterest: [...],
        secondaryPoints: [...]
    }
        ↓
Download JSON file
        ↓
Teacher manually:
    1. Moves JSON to routes/
    2. Adds filename to trips-index.json
        ↓
Trip now available on main site!
```

## Technology Stack

```
┌────────────────────────────────────────┐
│           Frontend Layer               │
├────────────────────────────────────────┤
│                                        │
│  HTML5      → Structure & Content      │
│  CSS3       → Styling & Layout         │
│  JavaScript → Interactivity & Logic    │
│                                        │
└────────────────────────────────────────┘
            ↓
┌────────────────────────────────────────┐
│          External APIs                 │
├────────────────────────────────────────┤
│                                        │
│  Google Maps JavaScript API            │
│  • Maps rendering                      │
│  • Markers & info windows              │
│  • Polylines for routes                │
│  • Geometry library                    │
│  • Places library (creator)            │
│                                        │
└────────────────────────────────────────┘
            ↓
┌────────────────────────────────────────┐
│           Data Layer                   │
├────────────────────────────────────────┤
│                                        │
│  JSON files (static)                   │
│  • trips-index.json                    │
│  • Individual trip JSONs               │
│                                        │
│  No database required!                 │
│                                        │
└────────────────────────────────────────┘
            ↓
┌────────────────────────────────────────┐
│          Hosting Layer                 │
├────────────────────────────────────────┤
│                                        │
│  Static file hosting:                  │
│  • GitHub Pages                        │
│  • Netlify                             │
│  • Vercel                              │
│  • Any static host                     │
│                                        │
└────────────────────────────────────────┘
```

## File Dependencies

```
index.html
├── config.js                (API configuration)
├── css/styles.css           (All styles)
├── js/maps.js               (Map utilities)
├── js/index.js              (Page logic)
├── js/load-maps.js          (Google Maps loader)
└── routes/trips-index.json  (Trip index)
    └── routes/*.json        (Individual trips)

trip.html
├── config.js
├── css/styles.css
├── js/maps.js
├── js/trip.js               (Trip page logic)
├── js/load-maps.js
└── routes/*.json            (Trip data)

creator.html
├── config.js
├── css/styles.css
├── js/maps.js
├── js/creator.js            (Creator logic)
└── js/load-maps.js
```

## Security Model

```
┌────────────────────────────────────┐
│   Google Maps API Key              │
│   • Stored in config.js            │
│   • Restrict to domain             │
│   • Limit API access               │
└────────────────────────────────────┘
            ↓
┌────────────────────────────────────┐
│   Static Files (Public)            │
│   • No server-side code            │
│   • No database                    │
│   • No user authentication         │
│   • No sensitive data              │
└────────────────────────────────────┘
            ↓
┌────────────────────────────────────┐
│   HTTPS (GitHub Pages)             │
│   • Encrypted transmission         │
│   • Secure connections             │
└────────────────────────────────────┘
```

## Deployment Architecture

```
Development
    ↓
┌─────────────────────┐
│  Local Web Server   │
│  (testing)          │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Git Repository     │
│  (version control)  │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  GitHub             │
│  (hosting)          │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  GitHub Pages       │
│  (CDN + HTTPS)      │
└─────────────────────┘
    ↓
End Users
```

## Performance Optimization

```
HTML Files
    ↓ Minify (optional)
CSS Files
    ↓ Minify (optional)
JavaScript Files
    ↓ Minify (optional)
Images
    ↓ Optimize & Lazy Load
Google Maps
    ↓ Load async
JSON Files
    ↓ Keep small (<50KB)
        ↓
    Fast Load Times!
    (< 2 seconds)
```

## Scalability

```
Current: 2 sample trips
    ↓
Can support: 100+ trips
    ↓
Each trip: Unlimited POIs
    ↓
Performance remains constant
    (Each page loads only needed data)
```

## Browser Compatibility Matrix

```
✅ Chrome 90+     → Full support
✅ Firefox 88+    → Full support
✅ Safari 14+     → Full support
✅ Edge 90+       → Full support
✅ iOS Safari 14+ → Full support
✅ Chrome Mobile  → Full support
⚠️  IE 11         → Not supported
```

## Key Architectural Decisions

### 1. **Static Site Architecture**
   - No backend server needed
   - Easy to host and maintain
   - Fast loading times
   - Version control friendly

### 2. **JSON Data Storage**
   - Human-readable format
   - Easy to edit manually
   - No database complexity
   - Simple backup/restore

### 3. **Vanilla JavaScript**
   - No framework dependencies
   - Smaller bundle size
   - Better performance
   - Easier to understand

### 4. **Mobile-First Design**
   - Optimized for on-site use
   - Touch-friendly interfaces
   - Responsive layouts
   - Progressive enhancement

### 5. **Modular Code Structure**
   - Reusable components
   - Clear separation of concerns
   - Easy to maintain
   - Simple to extend

---

This architecture provides:
- ✅ Simplicity
- ✅ Performance
- ✅ Scalability
- ✅ Maintainability
- ✅ Reliability

**Perfect for educational use!** 🎓
