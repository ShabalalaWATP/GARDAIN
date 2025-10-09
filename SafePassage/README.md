# SafePassage iOS App

SafePassage is a native iOS application that enables users to report hazardous locations and situations in real-time. Built with SwiftUI and AWS Amplify, it provides a simple interface for field personnel to document safety concerns, upload photos, and share critical information with command centres.

## What This App Does

SafePassage allows users in the field to:
- **Report hazards** with photos, descriptions, and GPS coordinates
- **View existing reports** submitted by themselves and other users
- **Mark evacuation priorities** for critical situations
- **Sync data in real-time** with AWS cloud services
- **Authenticate securely** using AWS Cognito

Think of it as a digital incident report system that immediately shares safety information with decision-makers monitoring the web dashboard.

## Tech Stack

We built SafePassage using Apple's modern iOS development tools and AWS's enterprise-grade backend:

- **SwiftUI** - Apple's declarative UI framework for building native iOS interfaces
- **AWS Amplify** - Unified development framework for cloud-powered apps
- **AWS Cognito** - User authentication and authorization
- **AWS AppSync (GraphQL)** - Real-time data synchronisation
- **AWS S3** - Scalable image storage
- **Combine** - Apple's reactive programming framework

<img width="2310" height="945" alt="image" src="https://github.com/user-attachments/assets/00fd6355-97b7-4dff-969b-c83949506e47" />

## Getting Started

### Prerequisites

Before you begin, make sure you have:
- **macOS** (Ventura or later recommended)
- **Xcode 14+** - Download from the Mac App Store
- **AWS Account** - For Amplify backend configuration
- **Amplify CLI** - Install globally: `npm install -g @aws-amplify/cli`
- **iOS 16+ device or simulator** - For testing the app

### Installation

Clone the repository and navigate to the SafePassage directory:

```bash
git clone https://github.com/your-org/hackathon-2025-team-3.git
cd hackathon-2025-team-3/SafePassage
```

Install CocoaPods dependencies (if using):

```bash
pod install
```

Open the project in Xcode:

```bash
open SafePassage.xcworkspace
# or if not using CocoaPods:
open SafePassage.xcodeproj
```

### Amplify Configuration

The app expects an `amplifyconfiguration.json` file in the root directory. This file contains your AWS backend configuration.

If you're setting up a new backend:

```bash
# Initialize Amplify in the project
amplify init

# Add authentication
amplify add auth

# Add API (GraphQL)
amplify add api

# Add storage (S3)
amplify add storage

# Push the configuration to AWS
amplify push
```

This will generate the `amplifyconfiguration.json` file automatically.

### Running the App

1. Select a simulator or connected iOS device in Xcode
2. Press `Cmd+R` or click the Play button
3. The app will build and launch

On first launch, you'll see the sign-in screen. You can create a new account or use existing credentials if you've configured Cognito user pools.

## How It Works

### App Architecture

SafePassage follows the MVVM (Model-View-ViewModel) architectural pattern, separating concerns cleanly:

```
SafePassage/
├── SafePassageApp.swift        # App entry point & Amplify setup
├── Model/
│   └── Report.swift            # Data models (auto-generated)
├── View/
│   ├── LandingView.swift       # Initial auth screen
│   ├── ReportsView.swift       # List of all reports
│   ├── ReportView.swift        # Single report row
│   └── SaveReportView.swift    # Form for creating reports
├── ViewModel/
│   ├── AuthenticationService.swift  # Handles sign-in/out
│   ├── ReportsService.swift         # CRUD operations for reports
│   └── StorageService.swift         # S3 image uploads
└── amplify/
    ├── amplifyconfiguration.json    # AWS backend config
    └── generated/models/            # GraphQL models
```

### Application Flow

**1. Launch & Authentication**

When you open SafePassage, the app starts at `LandingView`. Here's what happens:

```swift
// SafePassageApp.swift initialises Amplify plugins
init() {
    try Amplify.add(plugin: AWSCognitoAuthPlugin())
    try Amplify.add(plugin: AWSAPIPlugin())
    try Amplify.add(plugin: AWSS3StoragePlugin())
    try Amplify.configure()
}
```

The landing view checks if you're already signed in. If not, it presents the Cognito-hosted UI for authentication. This uses your device's Safari browser for a secure, familiar login experience.

**2. Viewing Reports**

Once authenticated, you'll see `ReportsView` - a list of all hazard reports. The app fetches these from AWS AppSync using GraphQL:

```swift
func fetchReports() async {
    let result = try await Amplify.API.query(request: .list(Report.self))
    // Updates the @Published reports array
    reports = reportsList.elements
}
```

The query respects Amplify's authorization rules, so you only see reports you're permitted to view (in this case, your own reports due to the `@auth` rule in the GraphQL schema).

**3. Creating a Report**

Tap the "⨁ New Report" button to open `SaveReportView`. This form collects:
- **Name** - Reporter's full name or incident title
- **Description** - Detailed information about the hazard
- **Photo** - Optional image captured or selected from the library
- **Location** - GPS coordinates (currently hard-coded, but ready for integration with CoreLocation)
- **Evacuation flag** - Whether immediate evacuation is recommended

When you tap "Save Report":

```swift
// 1. Upload the image to S3 (if provided)
if let image, let imageName {
    await storageService.upload(image, name: imageName)
}

// 2. Create the report in the database
await reportsService.save(report)
```

The image uploads asynchronously to S3, whilst the report metadata saves to DynamoDB via AppSync. The image filename is stored in the report's `image` field for later retrieval.

**4. Deleting Reports**

Swipe left on any report in the list to reveal the delete action. This removes both the database record and the associated S3 image:

```swift
await reportsService.delete(report)
if let image = report.image {
    await storageService.remove(withName: image)
}
```

### Data Model

Reports are defined in the GraphQL schema and auto-generated into Swift code:

```swift
public struct Report: Model {
    public let id: String
    public var name: String
    public var description: String?
    public var image: String?        // S3 object key
    public var lat: Double?          // Latitude
    public var lon: Double?          // Longitude
    public var toEvacuate: Bool      // Evacuation priority flag
    public var createdAt: Temporal.DateTime?
    public var updatedAt: Temporal.DateTime?
}
```

The model includes authorization rules (see `Report+Schema.swift`) that restrict operations to the report owner, enforced automatically by AppSync.

### Services Layer

We created three service classes to handle different concerns:

**AuthenticationService**
- Manages user sign-in and sign-out
- Checks current authentication status
- Provides the Cognito UI presentation anchor

**ReportsService**
- Fetches all reports from the API
- Creates new reports
- Deletes existing reports
- Publishes changes to the UI via `@Published var reports`

**StorageService**
- Uploads images to S3 with unique keys
- Downloads images for display
- Removes images when reports are deleted
- Handles data conversion (UIImage ↔ Data)

All services are `@MainActor` classes conforming to `ObservableObject`, ensuring UI updates happen on the main thread.

### Image Handling

Images follow this workflow:

1. **Capture/Select** - User picks a photo using `PicturePicker` (UIImagePicker wrapper)
2. **Convert** - Image converts to `Data` format
3. **Generate Key** - Create a unique filename using `UUID().uuidString`
4. **Upload** - Send to S3 using `Amplify.Storage.uploadData()`
5. **Store Reference** - Save the key in the report's `image` field
6. **Display** - `RemoteImage` component fetches and caches the image for display

The `RemoteImage` view handles async loading with a progress indicator whilst downloading.

## Key Features

### Offline-First Architecture
Amplify DataStore can be enabled to provide offline support. Reports created without internet connectivity will sync automatically when the connection returns.

### Real-Time Sync
AppSync subscriptions mean updates from other users appear instantly. If another user creates a report, it'll show up in your list without refreshing.

### Secure by Default
- Authentication required for all operations
- Owner-based authorization ensures users only modify their own reports
- Images stored in private S3 buckets with signed URLs
- HTTPS everywhere for data in transit

### Native iOS Experience
- SwiftUI for responsive, adaptive layouts
- System fonts and colours for familiarity
- Standard iOS gestures (swipe to delete, pull to refresh)
- Integration with device features (camera, photo library)

## Configuration Files

### amplifyconfiguration.json
Generated by Amplify CLI, contains:
- API endpoints
- Cognito user pool IDs
- S3 bucket names
- Region information

Never commit this file with real credentials to version control.

### GraphQL Schema
Located in `amplify/backend/api/safepassage/schema.graphql`, defines:

```graphql
type Report @model @auth(rules: [{allow: owner}]) {
  id: ID!
  name: String!
  description: String
  image: String
  lat: Float
  lon: Float
  toEvacuate: Boolean!
}
```

The `@auth` directive restricts CRUD operations to the report creator.

## Development Workflow

### Building
```bash
# Clean build folder
Cmd+Shift+K

# Build
Cmd+B

# Run on simulator
Cmd+R
```

### Testing on Device
1. Connect your iPhone via USB
2. Trust the computer on your device
3. Select your device in Xcode's scheme menu
4. Enable "Automatically manage signing" in project settings
5. Run the app (Cmd+R)



### Customising the UI
All views are in the `View/` directory. Modify colours, fonts, and layouts by editing the SwiftUI view files. The app uses system colours by default for automatic dark mode support.

### Adding New Fields
To add fields to reports:

1. Update the GraphQL schema
2. Run `amplify push`
3. Regenerate models with `amplify codegen models`
4. Update the UI forms to collect the new data

## Troubleshooting

### "Amplify has not been configured"
Make sure `amplifyconfiguration.json` exists in the project root and that the Amplify initialization code runs in `SafePassageApp.init()`.

## Deployment

### TestFlight Distribution

1. Archive the app (Product → Archive)
2. Upload to App Store Connect
3. Add beta testers
4. Distribute via TestFlight

### App Store Release

Follow Apple's standard App Store submission process:
1. Prepare app metadata (screenshots, description, keywords)
2. Set pricing and availability
3. Submit for review
4. Wait for approval (typically 24-48 hours)

## Security Considerations

- **Never commit** `amplifyconfiguration.json` with production credentials
- Use separate AWS environments for development and production
- Implement certificate pinning for additional API security
- Enable CloudWatch logging to monitor for suspicious activity
- Regularly rotate API keys and credentials
- Use AWS WAF to protect your API endpoints

## Future Enhancements

We have plans to expand SafePassage's capabilities:

- **Live location tracking** - Automatic GPS coordinate capture
- **Push notifications** - Alert users to nearby hazards
- **Offline mode** - Enable full functionality without connectivity
- **Photo annotation** - Draw on images to highlight specific hazards
- **Voice dictation** - Hands-free report creation
- **Emergency contacts** - Quick access to local emergency services
- **Report categories** - Filter by hazard type (fire, flood, chemical, etc.)
- **Interactive map view** - Show reports on a map within the app

## Related Projects

SafePassage will work with the **NEO Dashboard**, a React-based web application that displays reports on an interactive map. Find it in the `Dashboard/` directory of this repository.

## Resources

- [AWS Amplify iOS Documentation](https://docs.amplify.aws/lib/q/platform/ios/)
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [AWS AppSync Developer Guide](https://docs.aws.amazon.com/appsync/)
- [Cognito Authentication Flows](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)

<img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/5b095baf-af28-465d-8c42-52a28f44ab3e" />



