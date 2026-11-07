import Constants from 'expo-constants';

/** App display name & version, read from app.json at runtime. */
export const APP_NAME = Constants.expoConfig?.name ?? 'CaféGo';
export const APP_VERSION = Constants.expoConfig?.version ?? '8.0.0';

/** Local SQLite database file name. */
export const DATABASE_NAME = 'qlcafe.db';

