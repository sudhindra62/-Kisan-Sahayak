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
    console.error('Anonymous sign-in failed:', error);
  });
}

// -- Firestore --

export function setDocument(
  docRef: DocumentReference,
  data: any,
  options?: SetOptions
) {
  firestoreSetDoc(docRef, data, options || {}).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: (options as any)?.merge ? 'update' : 'create',
        requestResourceData: data,
      })
    );
  });
}

export function addDocument(colRef: CollectionReference, data: any) {
  const promise = firestoreAddDoc(colRef, data).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
    // Re-throw to allow local catch blocks if needed, though global handler is primary
    throw error;
  });
  return promise;
}

export function updateDocument(docRef: DocumentReference, data: any) {
  firestoreUpdateDoc(docRef, data).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
}

export function deleteDocument(docRef: DocumentReference) {
  firestoreDeleteDoc(docRef).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      })
    );
  });
}
