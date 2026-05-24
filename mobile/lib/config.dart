// API base URL for the ICT Realtors backend.
//
// In production, the deployed backend is at:
//   https://ictrealestate.innocubetechnologies.com
//
// For local dev (running this Flutter app against a Next.js server on your
// dev machine), use http://10.0.2.2:3011 on Android emulator, or your LAN IP
// on a real device. (The Next.js server listens on port 3011 — port 3010 is
// reserved for the ict_services app on the production server.)
class AppConfig {
  static const String apiBase = "https://ictrealestate.innocubetechnologies.com";
}
