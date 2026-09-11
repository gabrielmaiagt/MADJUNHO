import { initializeApp, getApps, App, cert, AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig as clientFirebaseConfig } from '@/firebase/config';

let app: App;

// Shared Firebase Admin SDK init, reused by every server-side flow that
// needs Firestore (webhook processing, PIX creation, etc).
export function getFirebaseAdmin() {
    if (getApps().length) {
        app = getApps()[0];
        return { db: getFirestore(app) };
    }

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
        throw new Error('Firebase Admin credentials missing.');
    }

    const serviceAccount = {
        projectId: clientFirebaseConfig.projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
    };

    const firebaseConfig: AppOptions = {
        credential: cert(serviceAccount),
        databaseURL: `https://${clientFirebaseConfig.projectId}.firebaseio.com`,
    };
    app = initializeApp(firebaseConfig);

    return { db: getFirestore(app) };
}
