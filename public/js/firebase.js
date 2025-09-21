// Firebase bootstrap (CDN ESM)
// Docs: https://firebase.google.com/docs/web/setup#add-sdks-initialize

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { getAnalytics, isSupported as analyticsSupported } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js';

// Read config from global set in HTML before this script
const FIREBASE_CONFIG = window.__FIREBASE_CONFIG__;
if (!FIREBASE_CONFIG) {
  console.error('[Firebase] Missing window.__FIREBASE_CONFIG__');
}

let app = null;
try {
  app = initializeApp(FIREBASE_CONFIG);
} catch (e) {
  console.error('[Firebase] initializeApp failed:', e);
  throw e;
}

const auth = getAuth(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

let analytics = null;
try {
  if (await analyticsSupported()) {
    analytics = getAnalytics(app);
  }
} catch (_) { /* ignore */ }

window.firebaseServices = { app, auth, rtdb, storage, analytics };
export function getFirebase() { return window.firebaseServices; }
