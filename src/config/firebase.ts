import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

import { env } from './env';

const { functionsRegion, ...firebaseConfig } = env.firebase;

// Reuse the existing app instance on Fast Refresh to avoid "app already exists" errors.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const firestore = getFirestore(app);
const functions = getFunctions(app, functionsRegion);

export { app, auth, firestore, functions, onAuthStateChanged };

