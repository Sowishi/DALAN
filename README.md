# DALAN

> **TODO:** One-sentence description of what DALAN is and who it's for.

DALAN is a mobile app built with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/).

## About

<!-- Replace this section with the real details -->

- **Purpose:** _what problem DALAN solves_
- **Target users:** _who uses it_
- **Platforms:** Android, iOS (via Expo Go or development build)

## Features

- _Feature 1_
- _Feature 2_
- _Feature 3_

## Tech Stack

- React Native + Expo
- _Navigation (e.g. Expo Router / React Navigation)_
- _Backend / API_
- _State management_

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

### 3. Set up environment variables

If the project uses a `.env` file, copy the example and fill in the values:

```bash
cp .env.example .env
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

## Building for Production

Using [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # or ios / all
```

## Troubleshooting

- **QR code won't connect:** make sure both devices share the same network, or run `npx expo start --tunnel`.
- **Stale errors or odd behavior:** run `npx expo start -c`.
- **Dependency mismatch:** run `npx expo install --fix`.
- **Android emulator not detected:** confirm it's running (`adb devices`) and that `ANDROID_HOME` is set.

## Project Structure

```
dalan/
├── app/ or src/      # screens and navigation
├── assets/           # images, fonts
├── components/       # reusable UI components
├── app.json          # Expo configuration
└── package.json
```

_Adjust to match the actual structure._

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feature/my-feature`)
2. Commit your changes
3. Push and open a pull request

## License

_Add license information._
