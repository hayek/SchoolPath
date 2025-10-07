# PathSchool - Setup & Development Guide

## Project Overview

PathSchool is a mobile-first web application for creating and sharing educational walking tours in Haifa, Israel. It's designed for students in grades 1-8 and allows teachers to create custom routes with points of interest, missions, and integrated Google Maps navigation.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Maps**: Google Maps JavaScript API
- **Hosting**: GitHub Pages (static site)
- **Data Format**: JSON
- **Design System**: Apple-inspired minimalist UI

## Project Structure

```
PathSchool/
├── index.html              # Main page - shows all trips
├── trip.html              # Individual trip page
├── creator.html           # Trip creation tool
├── config.js              # Configuration (API keys)
├── css/
│   └── styles.css         # Main stylesheet
├── js/
│   ├── index.js           # Main page logic
│   ├── trip.js            # Trip page logic
│   ├── creator.js         # Creator tool logic
│   └── maps.js            # Google Maps utilities
├── routes/
│   ├── trips-index.json   # Index of all trip files
│   └── *.json            # Individual trip data files
├── images/                # POI images
├── DATA_STRUCTURE.md      # JSON schema documentation
├── TEACHER_GUIDE.md       # User documentation
└── readme.md             # Project requirements
```

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Geocoding API (for creator tool)
   - Places API (optional, for address search)
4. Create credentials (API Key)
5. Restrict the key:
   - **Application restrictions**: HTTP referrers (web sites)
   - **API restrictions**: Select only the APIs you need

### 2. Configure the Project

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd PathSchool
   ```

2. Update `config.js` with your API key:
   ```javascript
   const CONFIG = {
       GOOGLE_MAPS_API_KEY: 'YOUR_ACTUAL_API_KEY_HERE',
       HAIFA_CENTER: { lat: 32.7940, lng: 34.9896 },
       DEFAULT_ZOOM: 14
   };
   ```

3. Update the API key in HTML files:
   - In `index.html`, `trip.html`, and `creator.html`
   - Replace `YOUR_API_KEY` in the Google Maps script tag with your key:
   ```html
   <script async defer
       src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&callback=initMap&libraries=geometry">
   </script>
   ```

### 3. Local Development

You can use any local web server. Here are a few options:

**Option 1: Python (if installed)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option 2: Node.js http-server**
```bash
npx http-server -p 8000
```

**Option 3: VS Code Live Server**
- Install "Live Server" extension
- Right-click on `index.html`
- Select "Open with Live Server"

Then visit `http://localhost:8000` in your browser.

### 4. Testing

Test these key features:

1. **Main Page** (`index.html`)
   - All trips load from `trips-index.json`
   - Map displays all routes with correct colors
   - Clicking a trip card navigates to trip detail page

2. **Trip Page** (`trip.html?id=carmel-center-tour`)
   - Trip details load correctly
   - Route displays on map with markers
   - POI list shows with correct order
   - "Navigate" button generates correct Google Maps URL

3. **Creator** (`creator.html`)
   - Can add POIs and secondary points
   - Can reorder points
   - Can edit POI details
   - Export generates valid JSON file

## Deployment to GitHub Pages

### 1. Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit: PathSchool project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/PathSchool.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to repository Settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "main" branch
4. Click "Save"

Your site will be live at: `https://YOUR_USERNAME.github.io/PathSchool/`

### 3. Custom Domain (Optional)

If you have a custom domain:
1. Add a `CNAME` file with your domain
2. Configure DNS settings with your domain provider
3. Update GitHub Pages settings with custom domain

## Creating Trips

### Using the Creator Tool

1. Open `creator.html` in browser
2. Fill in trip details (ID, title, description, etc.)
3. Add POIs by clicking "Add Point of Interest" then clicking on map
4. Add routing points between POIs as needed
5. Edit each POI to add name, description, photo, mission link
6. Click "Export JSON" to download the trip file

### Manual JSON Creation

You can also create trip JSON files manually following the schema in `DATA_STRUCTURE.md`.

### Adding Trip to Site

1. Place the JSON file in `routes/` folder
2. Add filename to `routes/trips-index.json`:
   ```json
   {
       "trips": [
           "existing-trip.json",
           "new-trip.json"
       ]
   }
   ```

## Data Format

See `DATA_STRUCTURE.md` for complete JSON schema documentation.

### Quick Example

```json
{
  "id": "example-tour",
  "title": "Example Tour",
  "description": "A sample walking tour",
  "color": "#007AFF",
  "date": "2024-06-01",
  "grades": [4, 5, 6],
  "pointsOfInterest": [
    {
      "id": "poi-1",
      "name": "First Location",
      "description": "Description here",
      "coordinates": { "lat": 32.7940, "lng": 34.9896 },
      "photo": "images/location1.jpg",
      "missionLink": "https://example.com/mission1",
      "order": 1
    }
  ],
  "secondaryPoints": []
}
```

## API Reference

### Google Maps API Usage

The app uses these Google Maps features:

- **Map Display**: `google.maps.Map`
- **Markers**: `google.maps.Marker` with custom icons
- **Polylines**: `google.maps.Polyline` for routes
- **Info Windows**: `google.maps.InfoWindow` for POI details
- **Geometry Library**: For distance calculations
- **Geocoding**: For address lookup in creator (optional)

### JavaScript Modules

**maps.js** - Utility functions:
- `calculateRouteDistance(coordinates)` - Calculate total route distance
- `formatDistance(meters)` - Format distance for display
- `generateRandomColor()` - Generate random trip color

**index.js** - Main page:
- `initMap()` - Initialize map
- `loadTrips()` - Load all trips from JSON
- `displayTripsOnMap()` - Render all routes
- `displayTripsList()` - Render trip cards

**trip.js** - Trip detail page:
- `initMap()` - Initialize map
- `loadTrip()` - Load single trip data
- `displayTripOnMap()` - Render trip route
- `setupNavigationButton()` - Configure Google Maps navigation

**creator.js** - Creator tool:
- `initMap()` - Initialize editable map
- `addPoint(latLng, type)` - Add POI or routing point
- `editPoint(index)` - Edit POI details
- `exportTrip()` - Generate and download JSON

## Customization

### Styling

Edit `css/styles.css` to customize:
- Colors: Modify CSS variables in `:root`
- Fonts: Change `font-family` in `body`
- Layout: Adjust grid/flexbox layouts
- Responsive breakpoints: Edit `@media` queries

### Map Styling

Customize map appearance in the `initMap()` functions by modifying the `styles` array.

### Default Location

Change default map center in `config.js`:
```javascript
HAIFA_CENTER: { lat: YOUR_LAT, lng: YOUR_LNG }
```

## Troubleshooting

### Map Not Loading

- Check API key is correct in both `config.js` and HTML files
- Verify API key restrictions allow your domain
- Check browser console for errors

### Trips Not Displaying

- Verify `trips-index.json` is valid JSON
- Check individual trip JSON files are in `routes/` folder
- Ensure trip IDs match between files
- Check browser console for fetch errors

### Images Not Showing

- Verify image paths are correct relative to project root
- Check image files exist in `images/` folder
- Ensure proper file extensions (.jpg, .png, etc.)

### GitHub Pages 404 Error

- Wait a few minutes after enabling Pages
- Check repository is public or Pages enabled for private repo
- Verify correct branch is selected (main)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions (iOS and macOS)
- Mobile browsers: iOS Safari, Chrome Mobile

## Performance Tips

1. **Optimize Images**: Use compressed JPEG/WebP, max 1200px width
2. **Lazy Loading**: Images load as needed
3. **JSON Size**: Keep trip files under 50KB each
4. **Cache**: Browser caches static assets automatically

## Security Notes

- API key should be restricted to your domain
- Don't commit sensitive API keys to public repos
- Use environment variables for production keys
- Consider using a backend proxy for API calls in production

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

## Support

For issues or questions:
- GitHub Issues: [repository URL]
- Email: [contact email]
- Documentation: See TEACHER_GUIDE.md for user guide

---

**Happy Trail Building! 🗺️🚶‍♀️**
