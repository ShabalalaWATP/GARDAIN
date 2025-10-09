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

<img width="1222" height="515" alt="image" src="https://github.com/user-attachments/assets/a0903f8d-5a55-4326-9bca-2942a9f17820" />

```
App
├── MapLibreMap (MapLibre + AWS Location)
├── PinDataFetcher
│   ├── InteractivePopup (message dispatch)
│   └── PinStatistics (floating summary)
├── NewsFeed
├── [ManualPinManager] (ready for activation)
└── Auxiliary panels (weather, requests, contacts, doctrine)
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
| `VITE_OPENWEATHER_API_KEY` | OpenWeather API key used by the weather panel. | _None (required for weather)_ |

The entitled-person feed and messaging endpoints are currently hard-coded for the Hackathon environment. For productionisation, promote both URLs into env vars (e.g. `VITE_PIN_DATA_URL`, `VITE_MESSAGING_URL`) so deployments can target staging or live APIs without code changes.

### Weather Panel

The weather section in `App.jsx` renders `src/components/WeatherInfo.jsx`, which uses OpenWeather’s Geocoding + Current Weather + 5‑day/3‑hour endpoints to show:

- Current conditions (temp, wind/gust, humidity, visibility)
- Next few 3‑hour steps (configurable)
- A 5‑day outlook (daily min/max with representative icon)

Add your API key to `.env`:

```
VITE_OPENWEATHER_API_KEY=YOUR_KEY_HERE
```

By default, the component requests weather for “De Vere Cotswold Water Park, Cirencester, GB”. You can override the place or provide `lat`/`lon` props if you have precise coordinates. Results are cached in `localStorage` briefly to reduce API calls.

Security note: with Vite, any `VITE_` variable is exposed to the browser. For production, proxy these requests via a backend/serverless function to avoid exposing your key directly.

## Development Workflow

```bash
git clone https://github.com/AstraAppivate/hackathon-2025-team-3.git
create .env file to host API keys and insert VITE_AWS_LOCATION_KEY="INSERT API KEY" & VITE_OPENWEATHER_API_KEY="INSERT API KEY"
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

## Current Features 

- **AWS Map**: To enable the relevant commanders to view the situation on the ground. Capabale of displaying various overlays and featres from AWS.
- **Entitled Persons Statistics**: To display a list of persons on the map and if they have requested evacuation or not.
- **Dark/Light Mode**: The website is default dark mode as we can all agree it's far superior ;) but the user has the option to switch to light mode to aid accessibility.
- **Export Functionality**: The user can click either export the entire dashboard this puts the entire webpage snapshot onto a PDF, The other option is the ability to export all current users on the map's details into either a CSV file, Word Doc Table or PDF Table. This enables rapid sharing of data.
- **Local News Report Feed**: So far we have a placeholder for this but eventually will use GNews, GDELT and Guardian API's to display news related to a user/commanders search terms.
- **AI Scene Assessment**: We have the ability to utilise the iOS app to send a photo to AWS and have AWS Rekognition analyse the photograph and itdentify what the user has claimed, for example determine if it's a valid picture of a flood, or people with Weapons etc... to give commanders confidence false reports aren't coming in.
- **Operational Weather Outlook**: This uses an API to fetch local weather and display it on the site to enable commanders to gain greater environmental insights.
- **Evacuation & Assistance Request Table**: A placeholder area to display a current list of all people on the map.
- **Quick Contacts Area**: Highlighting to the Commander a list of quick key contacts they may need, including PJHQ, FCDO, UK Embassy etc...
- **Doctrine & Support References**: An area to display JDP-3-51, the FCDO Policy and Allied Joint Doctrine for NEO.

## Future Features Roadmap

- **Ability to drop Pins, Polygons, Other Shapes Manually**: Currentley the operator of the Dashboard cannot add these features manually on the dashboard they are fed in from AWS, it's a high priority to allow them to do this.
- **Real time News Feed**: We'd like to connect GNews, Guardian and GDELT API's to automatically pull in real news stories based on the region the map is centred on, firther on from this it would include LLM analysis and summaries.
- **News Feed and Weather LLM Analysis**: We'd like to use AWS hosted LLM's to analyse the news and weather that come in and present concise summaries to thew commander.
- **Real time tracking**: Currentley the user sends their position once and that's it, we would look to actually implement AWS Real time tracking to enable us to track the user if they give permission locally.
- **Greater Accesibility**: The dashboard has both a dark and light mode but further work to check if it's suitable for screen readers, the ability to interact using voice, potentially using OpenAI realtime voice/vision services would improve accesibility.
- **Support for other languages**: Utilising AWS hosted Machine Translation this will enable greater interoperability with foreign partners.
- **Offline Mode**: The ability to utilise the application disconnected, you could save things locally and set it to send automatically to the backend once re-connected.

## Troubleshooting

- **Missing API key**: Set `VITE_AWS_LOCATION_KEY` and restart the dev server if the map reports an authentication error.
- **Feed parsing issues**: `NewsFeed` performs light sanitisation on malformed JSON; persistent failures will surface in the console for investigation.
- **Map display problems**: Confirm network access to AWS Location Service and verify CORS configuration on any custom GeoJSON endpoints.

## Related Projects

This dashboard pairs with the **[SafePassage iOS app](https://github.com/AstraAppivate/hackathon-2025-team-3/blob/main/SafePassage/README.md)**, which collects field reports and entitled-person data. The app lives in the `SafePassage/` directory of the same repository.
