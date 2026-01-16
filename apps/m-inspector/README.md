# Kealee Inspector - Mobile Field Inspection App

A comprehensive React Native mobile application for field inspectors with offline-first capabilities, AI assistance, and route optimization.

## Features

### 🔄 Offline-First Inspection
- **Download inspection checklists** for the day before going into the field
- **Offline photo capture** with automatic GPS tagging
- **Sketch tools** for field diagrams and annotations
- **Voice-to-text notes** for hands-free documentation
- **Digital signature collection** for approvals and sign-offs

### 🤖 AI Field Assistance
- **Real-time photo analysis** for code compliance checking
- **Barcode/QR scanning** for permit verification
- **AR overlay** for dimension verification (ready for integration)
- **Historical data lookup** for same address inspections

### 🗺️ Route Optimization
- **Daily route planning** with AI optimization
- **Traffic-aware scheduling** (server-side integration)
- **Contractor availability integration** (server-side)
- **Weather-dependent rescheduling** (server-side)

### 🔄 Real-time Sync
- **Background sync** when connectivity is available
- **Conflict resolution** for offline edits
- **Progress auto-save** to prevent data loss
- **Push notifications** for schedule changes (server-side)

### 🔒 Security
- **Biometric authentication** (Face ID, Touch ID, Fingerprint)
- **Encrypted storage** for sensitive data
- **Secure API communication** with token-based auth

## Prerequisites

- Node.js 18+
- pnpm 8+
- React Native development environment:
  - For iOS: Xcode 14+, CocoaPods
  - For Android: Android Studio, JDK 17+
- iOS Simulator or Android Emulator, or physical device

## Installation

1. **Install dependencies:**
   ```bash
   cd apps/m-inspector
   pnpm install
   ```

2. **iOS setup:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API endpoint
   ```

4. **Configure permissions:**
   
   For iOS, add to `ios/InspectorApp/Info.plist`:
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>We need access to your camera to capture inspection photos</string>
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>We need your location to tag inspection photos</string>
   <key>NSMicrophoneUsageDescription</key>
   <string>We need access to your microphone for voice notes</string>
   <key>NSFaceIDUsageDescription</key>
   <string>We use Face ID for secure authentication</string>
   ```

   For Android, add to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.INTERNET" />
   ```

## Running the App

### iOS
```bash
pnpm ios
```

### Android
```bash
pnpm android
```

### Metro Bundler
```bash
pnpm start
```

## Project Structure

```
apps/m-inspector/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── PhotoCapture.tsx
│   │   ├── SketchCanvas.tsx
│   │   ├── SignatureCapture.tsx
│   │   └── BarcodeScanner.tsx
│   ├── screens/             # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── InspectionListScreen.tsx
│   │   ├── InspectionDetailScreen.tsx
│   │   └── RouteScreen.tsx
│   ├── services/            # Business logic
│   │   ├── api.ts          # API client
│   │   ├── storage.ts      # Local storage
│   │   ├── sync.ts         # Sync service
│   │   ├── location.ts     # GPS service
│   │   └── route-optimization.ts
│   ├── hooks/              # Custom React hooks
│   │   ├── useOffline.ts
│   │   ├── useVoiceToText.ts
│   │   └── useCamera.ts
│   ├── store/              # State management (Zustand)
│   │   └── inspectionStore.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   └── utils/              # Utility functions
│       ├── image.ts
│       └── biometric.ts
├── App.tsx                 # Root component
├── index.js                # Entry point
└── package.json
```

## Key Technologies

- **React Native 0.73** - Mobile framework
- **React Navigation** - Navigation library
- **Zustand** - State management
- **AsyncStorage** - Local storage
- **EncryptedStorage** - Secure storage
- **React Native Vision Camera** - Camera with barcode scanning
- **React Native Maps** - Map integration
- **React Native Skia** - Drawing/sketching
- **React Native Voice** - Voice-to-text
- **React Native Biometrics** - Biometric authentication

## Offline Capabilities

The app is designed to work fully offline:

1. **Data Download**: Inspections are downloaded when online
2. **Local Storage**: All data is stored locally using AsyncStorage
3. **Offline Queue**: Changes are queued when offline
4. **Auto-sync**: Automatically syncs when connectivity is restored
5. **Conflict Resolution**: Handles conflicts when both local and server data changed

## API Integration

The app expects the following API endpoints:

- `GET /api/inspections` - Get inspections
- `GET /api/inspections/:id` - Get inspection details
- `POST /api/inspections` - Create inspection
- `PUT /api/inspections/:id` - Update inspection
- `POST /api/inspections/:id/photos` - Upload photo
- `POST /api/inspections/:id/sketches` - Upload sketch
- `POST /api/inspections/:id/notes` - Add note
- `POST /api/inspections/:id/signatures` - Add signature
- `GET /api/routes/optimize` - Get optimized route
- `POST /api/ai/analyze-photo` - Analyze photo for compliance
- `GET /api/inspections/historical` - Get historical data

## Performance Optimizations

- **Image Compression**: Photos are compressed before upload
- **Lazy Loading**: Components load on demand
- **Background Sync**: Syncs in background without blocking UI
- **Battery Efficient**: Uses efficient location tracking
- **Low Bandwidth**: Optimized data transfer

## Security Features

- **Biometric Authentication**: Face ID, Touch ID, Fingerprint
- **Encrypted Storage**: Sensitive data encrypted at rest
- **Token-based Auth**: JWT tokens for API authentication
- **Secure Communication**: HTTPS only

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage
```

## Building for Production

### iOS
```bash
cd ios
xcodebuild -workspace InspectorApp.xcworkspace -scheme InspectorApp -configuration Release archive
```

### Android
```bash
cd android
./gradlew assembleRelease
```

## Troubleshooting

### Camera not working
- Check permissions in Info.plist (iOS) or AndroidManifest.xml (Android)
- Ensure device has camera hardware
- Check if another app is using the camera

### GPS not working
- Check location permissions
- Ensure location services are enabled on device
- Try restarting the app

### Sync issues
- Check internet connectivity
- Verify API endpoint is correct
- Check authentication token is valid

## Contributing

1. Follow the existing code style
2. Write TypeScript types for all new data structures
3. Add tests for new features
4. Update documentation

## License

Private - Kealee Platform V10
