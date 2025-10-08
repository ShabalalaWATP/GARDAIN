# GARDIAN Dashboard

GARDIAN (Geospatial Aid Response & Disaster Information Analysis Network) is a real-time operational dashboard that fuses hazard zoning, entitled-person tracking, and live intelligence to support Non-combatant Evacuation Operations (NEO). The dashboard is built with React and MapLibre on top of AWS Location Service, giving commanders a tailored tactical picture for theatre planning and response.

## Overview

The web application delivers a single pane of glass for mission staff:
- Visualises AWS-hosted hazard polygons and point features with responsive map styling.
- Streams entitled-person location data and presents at-a-glance evacuation statistics.
- Surfaces curated local news, liaison contacts, and doctrine references for rapid decision support.
- Provides in-map messaging to push instructions back to individual evacuees.

## Key Capabilities

- **Live hazard overlays**: `MapLibreMap` initialises AWS Location Service tiles, fetches GeoJSON zones from S3 (or a configured endpoint), and auto-fits the viewport to show every feature while preserving custom colours.
- **Entitled-person feed**: `PinDataFetcher` polls the entitled-persons API, renders pins with severity colouring, and powers an interactive popup allowing operators to send a message via the messaging router. `PinStatistics` then summarises totals vs. outstanding evacuations.
- **Intel and coordination panels**: The intelligence, weather, requests, contacts, and doctrine sections in `App.jsx` show which data sources are already connected (news feed) and where placeholders remain for upcoming integrations.
- **Shared map context**: A single `mapRef` is passed from `App` into both the base map and pin overlay to ensure layers stay in sync and can be extended by additional controllers such as the optional `ManualPinManager`.
- **Operational styling**: Rich UI treatments in `App.css` deliver a polished command-centre look while keeping critical data readable in low-light environments.

## Architecture Overview

| Data source / service | Origin | Consumed by | Purpose |
| --- | --- | --- | --- |
| AWS Location Service tiles | AWS Location (Region: `eu-west-2`) | `src/components/MapLibreMap.jsx` | Base map styling, navigation controls, light/dark palette support. |
| Hazard GeoJSON | Configurable S3 bucket (`VITE_GEOJSON_URL`) with polygon and point features | `MapLibreMap` | Draws hazard zones, outlines, and ad-hoc point markers; fits map bounds. |
| Entitled-person API | `https://ksip4rkha0.execute-api.eu-west-2.amazonaws.com/entitled-persons` | `src/components/PinDataFetcher.jsx` | Supplies evacuee pin data and metadata for popups & statistics. |
| Messaging router | `https://ksip4rkha0.execute-api.eu-west-2.amazonaws.com/messaging-router` | `PinDataFetcher` -> `InteractivePopup` | Sends operator-authored messages back to selected evacuees. |
| News feed | `VITE_NEWS_FEED_URL` (defaults to the Hackathon feed) | `src/components/NewsFeed.jsx` | Displays rolling open-source intelligence summaries. |
| Manual overlays (planned) | Operator input | `src/components/ManualPinManager.jsx` | Enables drag-to-drop manual markers when mounted (feature scaffolding present). |

The main React tree lives in `src/App.jsx`. It wires the shared `mapRef` into `MapLibreMap` and `PinDataFetcher`, then composes the supporting panels. Layout, colour treatments, and responsive behaviour are handled in `src/App.css`.

### Component Topology

```
App
|-- MapLibreMap (MapLibre + AWS Location)
|-- PinDataFetcher
|   |-- InteractivePopup (message dispatch)
|   |-- PinStatistics (floating summary)
|-- NewsFeed
|-- [ManualPinManager] (ready for activation)
`-- Auxiliary panels (weather, requests, contacts, doctrine)
```

## Project Structure

```
Dashboard/
├─ public/                 # Static assets served by Vite
├─ src/
│  ├─ App.jsx              # Root layout and section composition
│  ├─ App.css              # Navigation, panels, and HUD styling
│  ├─ components/
│  │  ├─ MapLibreMap.jsx   # Map initialisation, hazard overlays
│  │  ├─ PinDataFetcher.jsx# Entitled-person feed & messaging
│  │  ├─ PinStatistics.jsx # Fixed-position statistics banner
│  │  ├─ NewsFeed.jsx      # OSS news ingestion & rendering
│  │  └─ ManualPinManager.jsx # Optional manual overlay controls
│  ├─ assets/              # Logos and illustrations
│  └─ main.jsx             # React entry point
├─ vite.config.js          # Vite + React configuration
├─ package.json            # Scripts and dependencies
└─ dist/                   # Production build artefacts (`npm run build`)
```

## Configuration

Provide the following environment variables in a `.env` file at the root of the Dashboard project:

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_AWS_LOCATION_KEY` | AWS Location Service API key used by MapLibre for tile requests. | _None (required)_ |
| `VITE_GEOJSON_URL` | Remote GeoJSON (FeatureCollection) describing polygons/points to render. | `https://zones-of-interest.s3.eu-west-2.amazonaws.com/hazard_zones.json` |
| `VITE_NEWS_FEED_URL` | Optional override for the news feed endpoint. | `https://oqwz797yb0.execute-api.eu-west-2.amazonaws.com/prod/news` |

The entitled-person feed and messaging endpoints are currently hard-coded for the Hackathon environment. For productionisation, promote both URLs into env vars (e.g. `VITE_PIN_DATA_URL`, `VITE_MESSAGING_URL`) so deployments can target staging or live APIs without code changes.

## Data Contracts

### Hazard GeoJSON (`VITE_GEOJSON_URL`)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "color": "#4F46E5"     // optional fill colour
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], ...]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "color": "#DC2626"     // optional marker colour
      },
      "geometry": {
        "type": "Point",
        "coordinates": [lng, lat]
      }
    }
  ]
}
```

The map will automatically add fill, outline, and point layers, falling back to default colours if none are supplied.

### Entitled-person feed

`PinDataFetcher` expects a JSON array where each entry includes location and contextual metadata:

```json
[
  {
    "id": "string",               // unique identifier
    "name": "string",
    "description": "string",
    "latitude": 34.1234,
    "longitude": 69.1234,
    "to_evacuate": true,
    "timestamp": "2025-10-08T11:45:00Z"
  }
]
```

Boolean values for `to_evacuate` allow the statistics banner to split totals accurately, while the popup still tolerates `"true"`/`"false"` string values. Additional properties are preserved and rendered where available.

### Messaging payload

When an operator sends a message from the popup, the application POSTs to the messaging router with:

```json
{
  "message": "Operator instruction text",
  "id": "linked entitled-person ID",
  "name": "linked entitled-person name",
  "timestamp": "ISO8601 dispatch time"
}
```

Ensure receiving services can accept this contract or adjust the handler accordingly.

## Development Workflow

```bash
npm install      # install dependencies
npm run dev      # start Vite dev server (default: http://localhost:5173)
npm run lint     # run ESLint (React Hooks + Refresh plugins)
```

While the UI labels advertise a 90-second refresh, the current implementation fetches data on initial load only. Configure polling or webhooks before relying on the indicator in live operations.

## Production Build

```bash
npm run build    # generate optimised assets in dist/
npm run preview  # locally serve the production bundle
```

The build outputs static assets suitable for deployment to AWS Amplify, S3 + CloudFront, or any modern static host. Ensure environment variables are set during build time so Vite can inline the correct API endpoints.

## Operational Notes

- **Screenshots and demos**: Capture an updated dashboard screenshot (map, stats, and news panels visible) for stakeholder packs and include it in future README revisions.
- **Manual overlays**: `ManualPinManager` is scaffolded but not yet mounted. Activating it will let operators drop colour-coded markers locally; consider enabling it once UX testing is complete.
- **Future integrations**: Weather and evacuation queue sections are placeholders awaiting upstream services. Keep their copy up to date so readers know which feeds are pending.

## Troubleshooting

- **Missing API key**: Set `VITE_AWS_LOCATION_KEY` and restart the dev server if the map reports an authentication error.
- **Feed parsing issues**: `NewsFeed` performs light sanitisation on malformed JSON; persistent failures will surface in the console for investigation.
- **Map display problems**: Confirm network access to AWS Location Service and verify CORS configuration on any custom GeoJSON endpoints.

## Related Projects

This dashboard pairs with the **SafePassage iOS app**, which collects field reports and entitled-person data. The app lives in the `SafePassage/` directory of the same repository.
