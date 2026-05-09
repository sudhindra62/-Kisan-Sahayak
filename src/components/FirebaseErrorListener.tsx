'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * A component that listens for globally emitted 'permission-error' events.
 * It surfaces a non-intrusive toast instead of throwing a hard exception,
 * ensuring the app remains interactive "at any cost" on localhost.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (permissionError: FirestorePermissionError) => {
      // Log for developer reference in the background without crashing
      console.warn('[Firestore Access Restricted]:', permissionError.request.path);
      
      // Surface a silent toast for feedback
      toast({
        variant: "default",
        title: "Development Note",
        description: "A background save was restricted by security rules. You can continue using the app locally.",
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  // This component never throws, preventing the Next.js global error overlay.
  return null;
}