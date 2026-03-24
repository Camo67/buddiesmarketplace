# Buddies Worldwide Mobile

Expo-based iOS and Android shell for the Buddies Worldwide marketplace.

## What it does

- loads the live mobile app experience from `https://app.buddiesworldwide.online`
- keeps marketplace, auth, and Keycloak traffic inside the app
- opens phone, email, SMS, and WhatsApp links in native apps
- supports Android back navigation inside the embedded marketplace

## Local development

```bash
npm install
npm run start
```

Then press:

- `a` for Android
- `i` for iOS on macOS
- or scan the Expo QR code with Expo Go

## Cloud builds

Use Expo Application Services to build installable binaries:

```bash
npx eas login
npx eas build -p android --profile preview
npx eas build -p ios --profile preview
```

Production builds:

```bash
npx eas build -p android --profile production
npx eas build -p ios --profile production
```

The mobile shell targets `https://app.buddiesworldwide.online` while the main website stays on `https://buddiesworldwide.online`.

Current identifiers:

- iOS bundle ID: `online.buddiesworldwide.mobile`
- Android package: `online.buddiesworldwide.mobile`
