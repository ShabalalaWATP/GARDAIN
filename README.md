# GARDIAN SafePassage System

Coordinated reporting and situational awareness for Non-Combatant Evacuation Operations (NEO).

![GARDIAN Dashboard Overview](Dashboard/image-1.png)

SafePassage Platform brings together the SafePassage iOS app used by evacuees and field teams with the GARDIAN real-time dashboard monitored by command posts. Data captured on mobile flows through AWS services to populate the live map, intelligence panels, and messaging tools that power decision-making during crisis response. The solution was built during a 48-hour hackathon and lays the groundwork for a production-ready evacuation management suite.

## Platform Overview
- Field operators capture hazard reports, imagery, and evacuation priorities directly from the incident zone.
- AWS Amplify, AppSync, Cognito, and S3 synchronise structured data and media into shared mission datasets.
- The GARDIAN Dashboard renders hazard overlays, entitled-person locations, and curated intelligence as a single operational view.
- Messaging and planned automations close the loop between command guidance and citizens awaiting extraction.

## Component Highlights

### GARDIAN Dashboard (React + MapLibre)
- MapLibre plus AWS Location Service tiles deliver fast, styleable mapping with hazard polygons sourced from S3 or configurable GeoJSON endpoints.
- Entitled-person feeds render colour-coded pins, aggregate evacuation statistics, and support targeted messaging via the messaging router.
- Intelligence, weather, contacts, and doctrine panels surface the wider mission context while maintaining a command-centre look and feel.
- Built with Vite for rapid iteration, linting (`npm run lint`), and production builds ready for static hosting.

### SafePassage iOS App (SwiftUI + Amplify)
- SwiftUI guides users through authentication, hazard capture, photo upload, and evacuation prioritisation in the field.
- Amplify-configured Cognito, AppSync (GraphQL), and S3 provide secure sync, image storage, and real-time data propagation.
- MVVM architecture separates views, models, and services so new data fields or workflows can be added quickly.
- Designed for iOS 16+ with Combine for reactive updates and native gestures for a familiar mobile experience.

## Data and Services

| Service / Resource | Used By | Purpose |
| --- | --- | --- |
| AWS Cognito | SafePassage, GARDIAN | Authentication and session management for field and command users. |
| AWS AppSync (GraphQL) | SafePassage | Real-time mutation and subscription layer for reports, status, and metadata. |
| AWS S3 | SafePassage, GARDIAN | Storage for imagery, hazard GeoJSON, and other mission assets. |
| AWS Location Service + MapLibre | GARDIAN | Base maps, navigation controls, and responsive hazard rendering. |
| Messaging Router API | GARDIAN (planned SafePassage integration) | Sends instructions from command staff back to individuals in the field. |

## Repository Layout

```text
hackathon-2025-team-3/
  Dashboard/          # GARDIAN dashboard source, assets, and build scripts
  SafePassage/        # SafePassage iOS workspace and Amplify backend config
  potentialmaplibre.jsx
  README.md           # Combined platform overview (this file)
```

Refer to `Dashboard/README.md` and `SafePassage/README.md` for deep dives, API references, and component-specific setup.

## Getting Started

### Dashboard

Prerequisites: Node.js 18+, npm, AWS Location Service API key.

```bash
cd Dashboard
npm install
# create .env with VITE_AWS_LOCATION_KEY, VITE_GEOJSON_URL, VITE_NEWS_FEED_URL
npm run dev
```

The dev server runs on `http://localhost:5173`. Use `npm run build` to emit production assets to `dist/`.

### iOS App

Prerequisites: macOS (Ventura or later), Xcode 14+, Amplify CLI (`npm install -g @aws-amplify/cli`), AWS account.

```bash
cd SafePassage
amplify init           # or reuse the provided Amplify backend configuration
amplify push
open SafePassage.xcodeproj   # open SafePassage.xcworkspace when using CocoaPods
```

Select an iOS 16+ simulator or device and run with `Cmd+R`. Ensure `amplifyconfiguration.json` and `awsconfiguration.json` contain the credentials for your Amplify environment.

## Operational Flow

1. Field personnel authenticate through Cognito and submit hazard reports, photos, and prioritisation flags via SafePassage.
2. Amplify propagates structured data and media to AppSync, DynamoDB, and S3.
3. GARDIAN Dashboard fetches hazard overlays, entitled-person feeds, and mission intelligence to present a single operational view.
4. Command staff monitor metrics, review reports, and craft instructions that flow back through the messaging router.
5. Planned enhancements add live tracking, richer analytics, and offline resilience for both sides of the platform.

## Roadmap

- Enable manual pin and polygon creation on the dashboard to capture ad-hoc intelligence.
- Add live location tracking, push notifications, and offline mode to the mobile experience.
- Expand news, weather, and doctrinal feeds with automated summarisation tied to map context.
- Promote API endpoints and polling intervals to environment variables for flexible deployments.
- Strengthen accessibility, localisation, and assistive interactions (voice, screen reader) across web and mobile clients.

## License

MIT – see the repository root for details.
