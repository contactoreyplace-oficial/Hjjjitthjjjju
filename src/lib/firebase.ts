import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SecurityEvent, RecordedMedia, DetectionConfig, DetectionProfile } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Test Connection on application boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
      return false;
    }
    return true;
  }
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    if (user) {
      // Sync user profile
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    return user;
  } catch (err) {
    console.error('Google Sign-in Error', err);
    return null;
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign-out error', err);
  }
}

// Cloud Sync Functions for Incidents
export async function syncIncidentToCloud(incident: SecurityEvent, userId: string): Promise<void> {
  const path = `users/${userId}/incidents/${incident.id}`;
  try {
    const incidentRef = doc(db, 'users', userId, 'incidents', incident.id);
    await setDoc(incidentRef, {
      ...incident,
      userId,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Cloud Sync Functions for Recordings Metadata
export async function syncRecordingMetadataToCloud(recording: RecordedMedia, userId: string): Promise<void> {
  const path = `users/${userId}/recordings/${recording.id}`;
  try {
    const recRef = doc(db, 'users', userId, 'recordings', recording.id);
    await setDoc(recRef, {
      id: recording.id,
      userId,
      name: recording.name,
      timestamp: recording.timestamp,
      duration: recording.duration,
      sizeFormatted: recording.sizeFormatted,
      type: recording.type,
      trigger: recording.trigger,
      thumbnailUrl: recording.thumbnailUrl ? recording.thumbnailUrl.substring(0, 500000) : '',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Cloud Sync for Device Configuration
export async function syncConfigToCloud(config: DetectionConfig, userId: string): Promise<void> {
  const path = `users/${userId}/config/main`;
  try {
    const cfgRef = doc(db, 'users', userId, 'config', 'main');
    await setDoc(cfgRef, {
      ...config,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
export async function saveProfile(userId: string, profile: DetectionProfile): Promise<void> {
  try {
    const profileRef = doc(db, 'users', userId, 'profiles', profile.id);
    await setDoc(profileRef, { ...profile, createdAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/profiles/${profile.id}`);
  }
}

export async function loadProfiles(userId: string): Promise<DetectionProfile[]> {
  try {
    const profilesRef = collection(db, 'users', userId, 'profiles');
    const querySnapshot = await getDocs(profilesRef);
    return querySnapshot.docs.map((doc) => doc.data() as DetectionProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/profiles`);
    return [];
  }
}

export async function deleteProfile(userId: string, profileId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'profiles', profileId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/profiles/${profileId}`);
  }
}
