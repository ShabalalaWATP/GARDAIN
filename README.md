# NEO Dashboard

A real time hazard mapping dashboard built with React and AWS Location Service. This web application visualises safety reports and hazard zones on an interactive map, helping commanders stay informed about activities on the ground.

## What This App Does

The NEO Dashboard app is the web interface for viewing hazard reports/NEO evacuation requests/AWS Mapping Features. It displays:
- **Hazard zones** as colored polygons showing areas to avoid
- **Individual reports** as point markers with severity indicators
- **Interactive map controls** for zooming and panning
- **Real-time data** fetched from AWS S3 storage

Think of it as a community safety map that updates with new reports from users in the field.

## Tech Stack

We chose modern, performant tools that work well with AWS services:

- **React 18** - For building the interactive UI
- **Vite** - Lightning-fast dev server and optimized builds
- **MapLibre GL** - Open-source map rendering engine
- **AWS Location Service** - Provides map tiles and geocoding capabilities

## Getting Started

### Prerequisites

You'll need Node.js installed on your machine. We recommend version 18 or higher (LTS).

Check your Node version:
```bash
node --version
```

If you need to install or update Node, grab it from [nodejs.org](https://nodejs.org/).

### Installation

Clone the repository and navigate to the Dashboard folder:

```bash
git clone https://github.com/your-org/hackathon-2025-team-3.git
cd hackathon-2025-team-3/Dashboard
```

Install the dependencies:

```bash
npm install
```

### Configuration

Create a `.env` file in the Dashboard directory with your AWS Location Service API key:

```bash
VITE_AWS_LOCATION_KEY=your-api-key-here
```

Optionally, you can also specify a custom GeoJSON URL:

```bash
VITE_GEOJSON_URL=https://your-bucket.s3.region.amazonaws.com/your-data.json
```

If you don't set `VITE_GEOJSON_URL`, the app defaults to our demo data.

### Running Locally

Start the development server:

```bash
npm run dev
```

Vite will start the server and show you the local URL (usually `http://localhost:5173`). Open it in your browser and you should see the map!

The dev server has hot module replacement, so any changes you make to the code will instantly appear in the browser without refreshing.

## How We Built It

### Setting Up React with Vite

We used Vite to bootstrap the React project because it's incredibly fast and has great developer experience. The setup was straightforward:

```bash
npm create vite@latest Dashboard -- --template react
```

This gave us a clean React project with modern tooling out of the box.

### Connecting to AWS Services

The dashboard integrates with AWS Location Service for map rendering. We configured it to:
- Fetch map tiles from AWS's Standard style
- Support both Light and Dark color schemes
- Use the `eu-west-2` region (London) for low latency

The connection happens through the MapLibre GL library, which communicates directly with AWS Location Service's API.

### Adding the Interactive Map

We created a custom `MapLibreMap` component that wraps MapLibre GL functionality. This component:

1. **Initializes the map** with AWS Location Service styling
2. **Adds navigation controls** for zooming and rotating
3. **Fetches GeoJSON data** from S3 when the map loads
4. **Renders the features** as layers on the map

The map configuration is flexible - you can change the center point, zoom level, and even the map style through props.

### Rendering Polygons

Hazard zones come from a GeoJSON file stored in S3. When the map loads, we:

1. Fetch the GeoJSON data
2. Add it as a data source to the map
3. Create two layers:
   - A fill layer (semi-transparent colored areas)
   - A line layer (solid borders around each zone)

Each polygon can have custom colors defined in its properties. If no color is specified, we use a default indigo shade.

The code handles this in the `addGeoJsonToMap` function:

```javascript
map.addLayer({
  id: 'polygon-fill',
  type: 'fill',
  source: sourceId,
  filter: ['==', '$type', 'Polygon'],
  paint: {
    'fill-color': ['coalesce', ['get', 'color'], '#4F46E5'],
    'fill-opacity': 0.3,
  },
});
```

### Displaying Point Markers

Individual hazard reports appear as circular markers. We style them with:
- Custom radius (6px)
- Color based on the feature properties (defaults to red)
- White stroke border for visibility against any background

The map automatically fits the bounds to show all features when data loads, so you never have to manually pan around looking for markers.

## Project Structure

Here's how the Dashboard code is organized:

```
Dashboard/
├── src/
│   ├── components/
│   │   └── MapLibreMap.jsx    # Main map component
│   ├── App.jsx                # Root component & config
│   ├── App.css                # App-level styles
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── index.html                 # HTML template
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies & scripts
└── .env                       # Environment variables (gitignored)
```

## Available Scripts

### Development

```bash
npm run dev
```
Starts the Vite dev server with hot reload. Perfect for active development.

### Production Build

```bash
npm run build
```
Creates an optimized production bundle in the `dist/` folder. The build is minified and ready for deployment.

### Preview Production Build

```bash
npm run preview
```
Runs a local server to preview the production build. Useful for testing before deployment.

### Linting

```bash
npm run lint
```
Checks your code for common issues and style violations using ESLint.

## What's Next

We have some exciting features planned for the dashboard

## Troubleshooting

### Port Already in Use

If port 5173 is taken, you can specify a different one:

```bash
npm run dev -- --port 3000
```

### Missing API Key Error

If you see "Missing AWS Location Service API key" in the browser:
1. Make sure you created a `.env` file in the Dashboard directory
2. Check that the key name is exactly `VITE_AWS_LOCATION_KEY`
3. Restart the dev server after creating/modifying `.env`

### Map Not Displaying

Check the browser console for errors. Common issues:
- Invalid API key
- Network connectivity problems
- CORS issues with the GeoJSON URL

### Clean Install

If you're experiencing strange issues, try a fresh install:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Related Projects

This dashboard works with the **SafePassage iOS app**, which allows users to submit hazard reports in the field. Check out the iOS app in the `SafePassage/` directory of this repository.



