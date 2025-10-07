# PathSchool Data Structure

## Trip JSON Format

Each trip is stored as a JSON file in the `routes/` folder. The filename should be descriptive (e.g., `carmel-center-tour.json`).

### Schema

```json
{
  "id": "unique-trip-id",
  "title": "Trip Title",
  "description": "Brief description of the trip",
  "color": "#FF5733",
  "grades": [1, 2, 3],
  "pointsOfInterest": [
    {
      "id": "poi-1",
      "name": "Point of Interest Name",
      "description": "Detailed description of the location",
      "coordinates": {
        "lat": 32.7940,
        "lng": 34.9896
      },
      "photo": "images/poi-1.jpg",
      "missionLink": "https://example.com/mission",
      "order": 1
    }
  ],
  "secondaryPoints": [
    {
      "id": "secondary-1",
      "coordinates": {
        "lat": 32.7950,
        "lng": 34.9900
      },
      "order": 2,
      "afterPOI": "poi-1"
    }
  ]
}
```

### Field Descriptions

- **id**: Unique identifier for the trip
- **title**: Display name of the trip
- **description**: Brief overview of what students will see/learn
- **color**: Hex color code for the route on the map
- **grades**: Array of grade numbers this trip is suitable for
- **pointsOfInterest**: Array of main POIs
  - **id**: Unique identifier for the POI
  - **name**: Display name
  - **description**: Educational content about the location
  - **coordinates**: GPS coordinates (Haifa, Israel)
  - **photo**: Path to the photo file (relative to project root)
  - **missionLink**: External URL with interactive mission/activity
  - **order**: Sequence number in the route
- **secondaryPoints**: Array of routing waypoints
  - **id**: Unique identifier
  - **coordinates**: GPS coordinates
  - **order**: Sequence number in the route
  - **afterPOI**: ID of the POI this waypoint follows

### Route Construction

The complete route is built by sorting all POIs and secondary points by their `order` field. This creates the walking path that will be displayed on the map and used for navigation.
