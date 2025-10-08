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

## Development Workflow

```bash
npm install      # install dependencies
npm run dev      # start Vite dev server (default: http://localhost:5173)
npm run lint     # run ESLint (React Hooks + Refresh plugins)
```

While the UI labels advertise a 90 second refresh, the current implementation fetches data on initial load only. Configure polling or webhooks before relying on the indicator in live operations.

## Production Build

```bash
npm run build    # generate optimised assets in dist/
npm run preview  # locally serve the production bundle
```

The build outputs static assets suitable for deployment to AWS Amplify, S3 + CloudFront, or any modern static host. Ensure environment variables are set during build time so Vite can inline the correct API endpoints.

## Future Features

- **Ability to drop Pins, Polygons, Other Shapes Manually**: Currentley the operator of the Dashboard cannot add these features manually on the dashboard they are fed in from AWS, it's a high priority to allow them to do this.
- **Real time Weather and News Feed with LLM analysis**: We'd like to connect GNews, Guardian and GDELT API's to automatically pull in real news stories based on the region the map is centred on, firther on from this it would include LLM analysis and summaries. The same goes with online weather reports.
- **Fully functioning Eligible Citizens Table**: The site features a blank space where a list of people on the map would appear, we would look to automatically have this feed from the map into the Dashboard list.
- **Real time tracking**: Currentley the user sends their position once and that's it, we would look to actually implement AWS Real time tracking to enable us to track the user if they give permission locally.
- **Greater Accesibility**: The site is easy to view and navigate, however could benefit from a light mode, testing to see if it's suitable for screen readers, the ability to interact using voice, potentially using OpenAI realtime voice/vision services. Support for other languages to enable future.
- **Offline Mode**: The ability to utilise the application disconnected, you could save things locally and set it to send automatically to the backend once re-connected.


## Troubleshooting

- **Missing API key**: Set `VITE_AWS_LOCATION_KEY` and restart the dev server if the map reports an authentication error.
- **Feed parsing issues**: `NewsFeed` performs light sanitisation on malformed JSON; persistent failures will surface in the console for investigation.
- **Map display problems**: Confirm network access to AWS Location Service and verify CORS configuration on any custom GeoJSON endpoints.

## Related Projects

This dashboard pairs with the **SafePassage iOS app**, which collects field reports and entitled-person data. The app lives in the `SafePassage/` directory of the same repository.
