/**
 * Centralized, typed access to runtime environment variables.
 *
 * Expo inlines every variable prefixed with `EXPO_PUBLIC_` at build time.
 * Define them in `.env` (local) or via `eas env:create` (EAS Build).
 * See `.env.example` for the full list.
 *
 * NOTE: `process.env.EXPO_PUBLIC_*` must be accessed statically (no dynamic keys),
 * otherwise Metro cannot inline the values.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    console.warn(`[env] Missing environment variable: ${name}. Check your .env file.`);
    return '';
  }
  return value;
}

export const env = {
  firebase: {
    apiKey: required('EXPO_PUBLIC_FIREBASE_API_KEY', process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
    authDomain: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: required('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: required(
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    ),
    appId: required('EXPO_PUBLIC_FIREBASE_APP_ID', process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    functionsRegion: process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? 'asia-southeast1',
  },
  api: {
    /** OTP service used for account email verification / email change. */
    accountOtpUrl: required('EXPO_PUBLIC_ACCOUNT_OTP_API_URL', process.env.EXPO_PUBLIC_ACCOUNT_OTP_API_URL),
    /** OTP service used for the forgot-password flow. */
    passwordResetUrl: required('EXPO_PUBLIC_PASSWORD_RESET_API_URL', process.env.EXPO_PUBLIC_PASSWORD_RESET_API_URL),
  },
} as const;

