# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ pnpm 8+ installed
- ✅ React Native CLI installed globally: `npm install -g react-native-cli`
- ✅ For iOS: Xcode 14+ and CocoaPods
- ✅ For Android: Android Studio and JDK 17+

## Initial Setup

1. **Navigate to the app directory:**
   ```bash
   cd apps/m-inspector
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **iOS Setup (if building for iOS):**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Configure environment:**
   Create a `.env` file in the app root:
   ```env
   API_BASE_URL=https://api.kealee.com
   ```

## Running the App

### Development Mode

**Start Metro Bundler:**
```bash
pnpm start
```

**In a new terminal, run:**

For iOS:
```bash
pnpm ios
```

For Android:
```bash
pnpm android
```

### Testing on Physical Device

**iOS:**
1. Connect iPhone via USB
2. Trust the computer on iPhone
3. Open Xcode
4. Select your device
5. Run `pnpm ios`

**Android:**
1. Enable USB debugging on Android device
2. Connect via USB
3. Run `pnpm android`

## First Run Checklist

1. ✅ App launches successfully
2. ✅ Login screen appears
3. ✅ Can login with credentials (or use biometric if configured)
4. ✅ Inspection list loads
5. ✅ Can navigate to inspection details
6. ✅ Camera permission requested (first time)
7. ✅ Location permission requested (first time)

## Common Issues

### "Unable to resolve module"
- Run `pnpm install` again
- Clear Metro cache: `pnpm start --reset-cache`
- Delete `node_modules` and reinstall

### iOS Build Fails
- Run `cd ios && pod install && cd ..`
- Clean build folder in Xcode: Product > Clean Build Folder
- Check Xcode version compatibility

### Android Build Fails
- Check Android SDK is properly configured
- Ensure `ANDROID_HOME` environment variable is set
- Run `cd android && ./gradlew clean && cd ..`

### Camera Not Working
- Check permissions in Info.plist (iOS) or AndroidManifest.xml (Android)
- Ensure device has camera hardware
- Restart the app

### GPS Not Working
- Check location permissions are granted
- Ensure location services are enabled on device
- Check device has GPS hardware

## Next Steps

1. **Configure API Endpoint**: Update `.env` with your API URL
2. **Test Offline Mode**: Turn off WiFi/cellular and test app functionality
3. **Test Sync**: Make changes offline, then go online and verify sync
4. **Test Features**: Try photo capture, sketches, voice notes, signatures

## Development Tips

- Use React Native Debugger for debugging
- Enable "Debug JS Remotely" in developer menu
- Use Flipper for advanced debugging
- Check logs: `npx react-native log-android` or `npx react-native log-ios`

## Building for Production

See README.md for production build instructions.
