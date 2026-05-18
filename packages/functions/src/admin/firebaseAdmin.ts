import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp();
}

export const adminDb: Firestore = getFirestore();
export const adminAuth: Auth = getAuth();
