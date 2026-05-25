# ICT Realtors — Mobile App

Flutter mobile client for the ICT Realtors real estate marketplace.

Points at the production backend at `https://ictrealestate.innocubetechnologies.com` by default. To use a local Next.js dev server, edit `lib/config.dart`.

## Run on your phone

Prerequisite: [Flutter SDK installed](https://docs.flutter.dev/get-started/install) and either:
- An Android phone with USB debugging on (plug it in via cable), OR
- An Android emulator running, OR
- An iPhone + Xcode (macOS only).

### 1. Install dependencies

```bash
cd mobile
flutter pub get
```

### 2. List available devices

```bash
flutter devices
```

You should see your phone or emulator. If not, run `flutter doctor` to diagnose.

### 3. Run the app

```bash
flutter run
```

Hot reload: press `r` in the terminal after each code change.

### 4. Build a release APK locally

```bash
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk` — sideload onto any Android phone.

### 4b. Or grab the prebuilt APK from GitHub Actions

Every push to `master` that touches `mobile/` automatically triggers a CI build. To download:

1. Go to <https://github.com/mcabico-blip/ict-realestate/actions>
2. Click the most recent **"Build Mobile APK"** workflow run
3. Scroll to **Artifacts** at the bottom
4. Download `ict-realtors-apk` (a zip containing the APK named `ict-realtors-<sha>.apk`)
5. Transfer the APK to your Android phone and sideload (enable "Install unknown apps" for your file manager / browser when prompted).

## Test credentials

Same as the web app:

| Role | Email | Password |
|------|-------|----------|
| Buyer | `carlo.reyes@gmail.com` | `buyer123456` |
| Broker | `broker@ictrealtors.ph` | `broker123456` |
| Lawyer | `lawyer@ictrealtors.ph` | `lawyer123456` |

You can also tap **"Browse without signing in →"** on the login screen to see properties without authenticating.

## Features

- **Browse** properties with filters by listing type (Buy / Rent / Lease) and city
- **Property detail** with image carousel, full specs, amenities, and contact buttons (tap to call/email the lister)
- **Save favorites** (heart button) — synced with web account
- **Contracts** — view your engagements (buyer or lawyer view depending on role) with status, document count, and last-updated date

## Architecture

- `lib/main.dart` — entry, splash, theme
- `lib/config.dart` — backend URL config
- `lib/api_client.dart` — HTTP wrapper with Bearer auth + secure token storage
- `lib/models.dart` — data classes mirroring `/api/mobile/*` response shapes
- `lib/format.dart` — currency, label, and date formatters
- `lib/screens/` — login, home (tab shell), properties list, property detail, favorites, contracts
- `lib/widgets/` — shared widgets (PropertyCardTile)

Backend endpoints used:
- `POST /api/mobile/login` — email/password → JWT
- `GET /api/mobile/me` — validate stored JWT
- `GET /api/mobile/properties` — list (public, no auth)
- `GET /api/mobile/properties/{id}` — detail (public)
- `GET|POST /api/mobile/favorites` — list / toggle (auth)
- `GET /api/mobile/engagements` — list contracts (auth)
