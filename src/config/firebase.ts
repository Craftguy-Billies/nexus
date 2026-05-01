import * as admin from 'firebase-admin';
import { config } from './index';

let firebaseApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  if (!config.firebase.serviceAccountBase64) {
    console.warn('Firebase service account not configured — auth will use local JWT only');
    return null as unknown as admin.app.App;
  }

  const serviceAccountJson = Buffer.from(
    config.firebase.serviceAccountBase64,
    'base64'
  ).toString('utf-8');

  const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: config.firebase.projectId,
  });

  console.log('Firebase Admin SDK initialized');
  return firebaseApp;
}

export async function verifyFirebaseToken(
  idToken: string
): Promise<admin.auth.DecodedIdToken | null> {
  const app = getFirebaseAdmin();
  if (!app) return null;

  try {
    return await admin.auth(app).verifyIdToken(idToken);
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    return null;
  }
}
