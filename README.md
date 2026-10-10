# DALAN

## Prerequisites

- [Node.js](https://nodejs.org/) LTS (v18 or newer)
- npm or yarn
- [Git](https://git-scm.com/)
- **Expo Go** app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)), or an Android emulator / iOS simulator
  - Android emulator: [Android Studio](https://developer.android.com/studio)
  - iOS simulator: Xcode (macOS only)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd dalan
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```


> Expo exposes only variables prefixed with `EXPO_PUBLIC_` to the app.

### 4. Start the development server

```bash
npx expo start
```

A QR code appears in the terminal.

### 5. Run the app

| Target | How |
| --- | --- |
| **Physical phone** | Open Expo Go and scan the QR code (Android: scan inside Expo Go; iOS: use the Camera app). Phone and computer must be on the same Wi-Fi. |
| **Android emulator** | Start an emulator in Android Studio, then press `a` in the terminal. |
| **iOS simulator** (macOS) | Press `i` in the terminal. |
| **Web** | Press `w` in the terminal. |

## Useful Commands

```bash
npx expo start -c        # start with cleared cache
npx expo start --tunnel  # use a tunnel if LAN connection fails
npx expo install <pkg>   # install a package version compatible with your Expo SDK
npx expo-doctor          # diagnose project issues
```

## Running a Development Build (optional)

Needed when using native modules not supported by Expo Go.

```bash
npx expo run:android
npx expo run:ios   # macOS only
```

