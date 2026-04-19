import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

interface ServiceAccountPayload {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

function parseServiceAccountFromEnv(): ServiceAccountPayload | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ServiceAccountPayload;
    return parsed;
  } catch {
    return null;
  }
}

function resolveProjectId(serviceAccount: ServiceAccountPayload | null): string | undefined {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    serviceAccount?.project_id
  );
}

function createAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccount = parseServiceAccountFromEnv();
  const projectId = resolveProjectId(serviceAccount);

  if (
    serviceAccount?.client_email &&
    serviceAccount.private_key
  ) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
      }),
      projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

function getAdminApp(): App {
  return getApps().length > 0 ? getApp() : createAdminApp();
}

export function getFirebaseAdminAuth() {
  return getAuth(getAdminApp());
}

export function getFirebaseAdminFirestore() {
  return getFirestore(getAdminApp());
}
