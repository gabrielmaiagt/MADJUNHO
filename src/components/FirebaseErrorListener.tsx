'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * In development it throws the error so it surfaces loudly via Next.js's error
 * overlay. In production a Firestore permission error is routine (rules denying
 * an anonymous write, a stale security-rules deploy, etc.) and must never crash
 * the whole app for a real visitor, so it's only logged there.
 */
export function FirebaseErrorListener() {
  // Use the specific error type for the state for type safety.
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // The callback now expects a strongly-typed error, matching the event payload.
    const handleError = (error: FirestorePermissionError) => {
      if (IS_DEV) {
        // Set error in state to trigger a re-render (and the throw below).
        setError(error);
      } else {
        console.error('Firestore permission error:', error);
      }
    };

    // The typed emitter will enforce that the callback for 'permission-error'
    // matches the expected payload type (FirestorePermissionError).
    errorEmitter.on('permission-error', handleError);

    // Unsubscribe on unmount to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // On re-render, if an error exists in state, throw it (dev only — see above).
  if (error) {
    throw error;
  }

  // This component renders nothing.
  return null;
}
