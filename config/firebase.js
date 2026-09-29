/**
 * Firebase Admin initialisation.
 *
 * Credentials are resolved from the environment so a new Firebase project can
 * be plugged in without touching any code. In order of precedence:
 *
 *   FIREBASE_SERVICE_ACCOUNT_JSON  the whole service-account JSON, inline
 *   FIREBASE_SERVICE_ACCOUNT_PATH  path to the service-account JSON file
 *   (fallback)                     ./firebase_privateKey.json
 *
 * iOS may point at a different Firebase project via
 * FIREBASE_IOS_SERVICE_ACCOUNT_JSON / FIREBASE_IOS_SERVICE_ACCOUNT_PATH; when
 * those are unset it falls back to ./firebase_privateKey_ios.json and then to
 * the credential above.
 *
 * When nothing is configured the module still loads: every app is replaced by
 * a no-op stub that logs instead of sending, so the server boots and every
 * sendNotification() call path stays safe.
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

require('dotenv').config();

const PROJECT_ROOT = path.resolve(__dirname, '..');

/** Resolves a path from .env against the project root. */
function resolveFromRoot(filePath) {
  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(PROJECT_ROOT, filePath);
}

/**
 * Builds a service-account object from the environment.
 * @param {string} jsonVar name of the env var holding inline JSON
 * @param {string} pathVar name of the env var holding a file path
 * @param {string} legacyPath path used before credentials moved to .env
 * @returns {object|null} the parsed service account, or null when unavailable
 */
function loadServiceAccount(jsonVar, pathVar, legacyPath) {
  const inline = process.env[jsonVar];
  if (inline && inline.trim() !== '') {
    try {
      return JSON.parse(inline);
    } catch (error) {
      console.error(`[firebase] ${jsonVar} is not valid JSON:`, error.message);
      return null;
    }
  }

  const configuredPath = process.env[pathVar];
  const filePath = resolveFromRoot(
    configuredPath && configuredPath.trim() !== '' ? configuredPath : legacyPath
  );

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`[firebase] could not read ${filePath}:`, error.message);
    return null;
  }
}

const androidServiceAccount = loadServiceAccount(
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_SERVICE_ACCOUNT_PATH',
  'firebase_privateKey.json'
);

const iosServiceAccount =
  loadServiceAccount(
    'FIREBASE_IOS_SERVICE_ACCOUNT_JSON',
    'FIREBASE_IOS_SERVICE_ACCOUNT_PATH',
    'firebase_privateKey_ios.json'
  ) || androidServiceAccount;

/**
 * A stand-in for an admin app when no credentials are configured. It swallows
 * sends so notification call sites keep working while Firebase is being set up.
 */
function createStubApp(label) {
  const warn = (method) =>
    console.warn(
      `[firebase] ${label}: ${method}() skipped, no credentials configured`
    );

  return {
    name: `${label}-stub`,
    isStub: true,
    messaging: () => ({
      send: async () => {
        warn('send');
        return null;
      },
      sendEachForMulticast: async (payload) => {
        warn('sendEachForMulticast');
        const tokens = (payload && payload.tokens) || [];
        return {
          successCount: 0,
          failureCount: tokens.length,
          responses: tokens.map(() => ({ success: false })),
        };
      },
      sendEach: async (messages) => {
        warn('sendEach');
        const list = messages || [];
        return {
          successCount: 0,
          failureCount: list.length,
          responses: list.map(() => ({ success: false })),
        };
      },
    }),
  };
}

/**
 * Initialises a named admin app, reusing it if it already exists.
 * @param {object|null} serviceAccount credential, or null to get a stub
 * @param {string} [name] app name; omit for the default app
 */
function initApp(serviceAccount, name) {
  const label = name || 'default';

  if (!serviceAccount) {
    return createStubApp(label);
  }

  const existing = admin.apps.find((app) => {
    if (!app) return false;
    return name ? app.name === name : app.name === '[DEFAULT]';
  });
  if (existing) {
    return existing;
  }

  try {
    const options = { credential: admin.credential.cert(serviceAccount) };
    return name
      ? admin.initializeApp(options, name)
      : admin.initializeApp(options);
  } catch (error) {
    console.error(
      `[firebase] ${label} app failed to initialise:`,
      error.message
    );
    return createStubApp(label);
  }
}

const defaultApp = initApp(androidServiceAccount);
const androidFirebaseAdmin = initApp(androidServiceAccount, 'android');
const iosFirebaseAdmin = initApp(iosServiceAccount, 'ios');

const isConfigured = Boolean(androidServiceAccount);

if (!isConfigured) {
  console.warn(
    '[firebase] no service account found — push notifications are disabled. ' +
      'Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON to enable them.'
  );
}

/**
 * Picks the app to send through for a given device type.
 * @param {string} [deviceType] 'ios' for the iOS app, anything else for Android
 */
function getMessagingApp(deviceType) {
  return deviceType && String(deviceType).toLowerCase() === 'ios'
    ? iosFirebaseAdmin
    : androidFirebaseAdmin;
}

module.exports = {
  admin,
  defaultApp,
  androidFirebaseAdmin,
  iosFirebaseAdmin,
  getMessagingApp,
  isConfigured,
};
