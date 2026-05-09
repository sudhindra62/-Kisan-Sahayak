'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  signInAnonymously,
} from 'firebase/auth';
import {
  getFirestore,
  setDoc as firestoreSetDoc,
  addDoc as firestoreAddDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(
          'Automatic initialization failed. Falling back to firebase config object.',
          e
        );
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
  };
}

// Re-export core hooks and providers
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';


// == Non-Blocking Auth & Data Operations ==

// -- Authentication --

export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error) => {
    // Although non-blocking for the UI, log auth errors for debugging
    console.warn('Anonymous sign-in failed:', error);
  });
}

// -- Firestore --

/**
 * Enhanced Firestore mutation wrappers that handle permission errors via the errorEmitter.
 * This ensures developers get rich contextual errors while the app stays interactive.
 */

export function setDocument(
  docRef: DocumentReference,
  data: any,
  options?: SetOptions
) {
  firestoreSetDoc(docRef, data, options || {}).catch(async (error) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: options && 'merge' in options ? 'update' : 'write',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function addDocument(colRef: CollectionReference, data: any) {
  return firestoreAddDoc(colRef, data).catch(async (error) => {
    const permissionError = new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function updateDocument(docRef: DocumentReference, data: any) {
  firestoreUpdateDoc(docRef, data).catch(async (error) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function deleteDocument(docRef: DocumentReference) {
  firestoreDeleteDoc(docRef).catch(async (error) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
