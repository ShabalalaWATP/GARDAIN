# SafePassage

A real-time hazard reporting and mapping system built for emergency response scenarios. SafePassage combines a native iOS app for field reporting with a react based web dashboard for command centre monitoring.

## What We Built

During a 48-hour hackathon, we've created two seperate apps one aimed at Commanders and one aimed at eligible citizens to help coordinate safety during crisis situations:

**SafePassage iOS App** - Field personnel use this to request NEO evacuation, report hazards, take photos, and mark locations requiring evacuation. Everything syncs instantly to the cloud.

**NEO Dashboard** - Command centres see all reports on an interactive map with hazard zones displayed as coloured polygons and individual reports as markers. Eventually info from the SafePassage app will display on the dashboard.

The name "NEO" stands for Non-Combatant Evacuation Operation - This is the military term for getting civilians out of danger zones quickly and safely.

## The Stack

We've leveraged AWS services to build something robust in a short time:

- **iOS App**: SwiftUI + AWS Amplify
- **Web Dashboard**: React + Vite + MapLibre GL
- **Backend**: AWS Amplify, AWS Cognito (auth), AppSync (GraphQL API), S3 (storage), Location Service (maps)

Everything talks to each other through AWS AppSync's GraphQL API with real-time subscriptions for instant updates.

## Quick Start

### iOS App

```bash
cd SafePassage
pod install
open SafePassage.xcworkspace
```

Configure your `amplifyconfiguration.json`, then build and run in Xcode. See the SafePassage folder for detailed setup instructions.

### Dashboard

```bash
cd Dashboard
npm install
echo "VITE_AWS_LOCATION_KEY=your-key-here" > .env
npm run dev
```

Open `http://localhost:5173` in your browser. Check the Dashboard folder for more details.

## How It Works

1. Field users sign in to the iOS app via AWS Cognito
2. They create reports with photos, descriptions, and GPS coordinates
3. Reports upload to S3 (images) and DynamoDB (metadata) via AppSync
4. The web dashboard fetches this data and displays it on an AWS Location Service map
5. Command staff see hazard zones (polygons) and individual reports (markers) in real-time

Authorisation rules ensure users only see their own reports - we built this for a demo, so we kept the security model simple.

## What's Next

We've got loads of ideas to expand this:

- Live GPS tracking in the iOS app
- Push notifications for new hazards nearby
- Route planning that avoids danger zones
- Admin tools for command staff to verify reports
- Offline mode for when network connectivity is dodgy
- Integration with existing emergency management systems
- and much much much more!!!

## Project Structure

```
hackathon-2025-team-3/
├── SafePassage/          # iOS app (Swift/SwiftUI)
│   ├── SafePassage/      # App source
│   └── amplify/          # AWS backend config
├── Dashboard/            # Web dashboard (React)
│   └── src/
│       ├── components/
│       └── App.jsx
└── README.md            # You are here
```

## The Team

Built by Team 3 during the 2025 hackathon!

## Licence

MIT - Use this however you like. 
