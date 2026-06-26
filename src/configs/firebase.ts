import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Auth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });

    console.log('✅ Firebase Admin Initialized');
  } catch (error) {
    console.error('❌ Firebase Initialization Error:', error);
    process.exit(1);
  }
}

export const firebaseAuth: Auth = getAuth();
export { getApps };