
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useFirestore, FirestorePermissionError, errorEmitter, useUser } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getCountFromServer, updateDoc, increment, arrayUnion } from 'firebase/firestore';

type DetailedEvent = Record<string, any>;
type AppError = {
    timestamp: string;
    message: string;
    fullError?: string;
};

export type AnalyticsData = {
    uniqueVisitors: number;
    pageViews: Record<string, number>;
    events: Record<string, number | any>; // Allow for nested objects
    detailedEvents: Record<string, DetailedEvent[]>;
    errors: AppError[];
};

type AnalyticsContextType = {
    analyticsData: AnalyticsData;
    trackEvent: (eventName: string, value?: number) => void;
    trackDetailedEvent: (eventName: string, details: DetailedEvent) => void;
    trackError: (error: Error | { message: string }) => void;
    clearAnalytics: () => void;
    isLoaded: boolean;
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const defaultAnalyticsData: AnalyticsData = {
    uniqueVisitors: 0,
    pageViews: {},
    events: {},
    detailedEvents: {},
    errors: [],
};

// Helper to remove undefined values from an object
const removeUndefined = (obj: Record<string, any>): Record<string, any> => {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};


export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const pathname = usePathname();
    const firestore = useFirestore();
    const { isUserLoading, user } = useUser();

    const getAnalyticsRef = React.useCallback(() => {
        if (!firestore) return null;
        return doc(firestore, 'analytics', 'summary');
    }, [firestore]);

    const updatePresence = useCallback(async () => {
        if (!firestore || !user) return;
        const visitorId = user.uid; // Visitor ID is now the user's UID
        const presenceRef = doc(firestore, 'presence', visitorId);
        const data = { last_seen: serverTimestamp() };
        setDoc(presenceRef, data, { merge: true })
            .catch(error => {
                const contextualError = new FirestorePermissionError({
                    path: presenceRef.path,
                    operation: 'write',
                    requestResourceData: data,
                });
                errorEmitter.emit('permission-error', contextualError);
            });
    }, [firestore, user]);

    const initializeVisitor = React.useCallback(async () => {
        if (!firestore || !user) return;
        
        const visitorId = user.uid;
        localStorage.setItem('visitorId', visitorId);

        const analyticsRef = getAnalyticsRef();
        if (!analyticsRef) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const refSource = urlParams.get('ref');

        const visitorRef = doc(firestore, 'visitors', visitorId);
        try {
            const visitorDoc = await getDoc(visitorRef);
            if (!visitorDoc.exists()) {
                const countData = { uniqueVisitors: increment(1) };
                updateDoc(analyticsRef, countData).catch(async (e) => {
                    if (e.code === 'not-found') {
                        const initialData = { ...defaultAnalyticsData, uniqueVisitors: 1 };
                        setDoc(analyticsRef, initialData).catch(error => {
                            const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'create', requestResourceData: initialData });
                            errorEmitter.emit('permission-error', contextualError);
                        });
                    } else {
                        const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'update', requestResourceData: countData });
                        errorEmitter.emit('permission-error', contextualError);
                    }
                });

                const data = { createdAt: serverTimestamp(), events: [], source: refSource || 'direct' };
                setDoc(visitorRef, data).catch(error => {
                    const contextualError = new FirestorePermissionError({ path: visitorRef.path, operation: 'create', requestResourceData: data });
                    errorEmitter.emit('permission-error', contextualError);
                });
            }
        } catch (error) {
             const contextualError = new FirestorePermissionError({ path: visitorRef.path, operation: 'get' });
             errorEmitter.emit('permission-error', contextualError);
             return;
        }
        
        const hasTrackedSource = localStorage.getItem('hasTrackedSource') === 'true';
        if (refSource && !hasTrackedSource) {
            const eventName = `visitor_from_${refSource}`;
            const data = { [`events.${eventName}`]: increment(1) };
            updateDoc(analyticsRef, data).catch(async (e) => {
                if (e.code === 'not-found') {
                    const initialData = { ...defaultAnalyticsData, events: { [eventName]: 1 }};
                     setDoc(analyticsRef, initialData).catch(error => {
                        const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'create', requestResourceData: initialData });
                        errorEmitter.emit('permission-error', contextualError);
                    });
                } else {
                     const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'update', requestResourceData: data });
                    errorEmitter.emit('permission-error', contextualError);
                }
            });
            localStorage.setItem('visitorSource', refSource);
            localStorage.setItem('hasTrackedSource', 'true');
        }

        updatePresence();

    }, [firestore, getAnalyticsRef, updatePresence, user]);

    React.useEffect(() => {
        if (!isUserLoading && user) {
            initializeVisitor();
            const presenceInterval = setInterval(updatePresence, 60 * 1000); // every minute
            setIsLoaded(true);
            return () => clearInterval(presenceInterval);
        }
        if (!isUserLoading && !user) {
            console.warn("AnalyticsProvider: No authenticated user. Visitor tracking will be disabled.");
            setIsLoaded(true);
        }
    }, [isUserLoading, user, initializeVisitor, updatePresence]);

    const trackInVisitorDoc = React.useCallback(async (event: Record<string, any>) => {
        if (!firestore || !user) return;
        const visitorId = user.uid;
        if (visitorId) {
            const visitorRef = doc(firestore, 'visitors', visitorId);
            const sanitizedEvent = removeUndefined(event);
            const data = { events: arrayUnion(sanitizedEvent) };
            setDoc(visitorRef, data, { merge: true }).catch(error => {
                const contextualError = new FirestorePermissionError({ path: visitorRef.path, operation: 'update', requestResourceData: data });
                errorEmitter.emit('permission-error', contextualError);
            });
        }
    }, [firestore, user]);

    const trackPageView = React.useCallback(async (path: string) => {
        const analyticsRef = getAnalyticsRef();
        if (isLoaded && analyticsRef && !path.startsWith('/admin')) {
             const data = { [`pageViews.${path.replace(/\//g, '_') || 'root'}`]: increment(1) };
             updateDoc(analyticsRef, data).catch(async (e) => {
                if (e.code === 'not-found') {
                    const initialData = { pageViews: { [path.replace(/\//g, '_') || 'root']: 1 } };
                    setDoc(analyticsRef, initialData).catch(error => {
                        const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'create', requestResourceData: initialData });
                        errorEmitter.emit('permission-error', contextualError);
                    });
                } else {
                     const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'update', requestResourceData: data });
                    errorEmitter.emit('permission-error', contextualError);
                }
            });
            await trackInVisitorDoc({ type: 'pageView', path, timestamp: new Date().toISOString() });
        }
    }, [isLoaded, getAnalyticsRef, trackInVisitorDoc]);

    const trackEvent = React.useCallback(async (eventName: string, value?: number) => {
        const analyticsRef = getAnalyticsRef();
        if (isLoaded && analyticsRef) {
            const updates: Record<string, any> = {
                [`events.${eventName}`]: increment(1)
            };

            if (value !== undefined) {
                updates[`events.${eventName}_amount`] = increment(value);
            }

            updateDoc(analyticsRef, updates).catch(async (e) => {
                if (e.code === 'not-found') {
                    const initialData: Record<string, any> = { events: { [eventName]: 1 }};
                    if (value !== undefined) {
                        initialData.events[`${eventName}_amount`] = value;
                    }
                    setDoc(analyticsRef, initialData).catch(error => {
                         const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'create', requestResourceData: initialData });
                         errorEmitter.emit('permission-error', contextualError);
                    });
                } else {
                    const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'update', requestResourceData: updates });
                    errorEmitter.emit('permission-error', contextualError);
                }
            });
            await trackInVisitorDoc({ type: 'event', name: eventName, value, timestamp: new Date().toISOString() });
        }
    }, [isLoaded, getAnalyticsRef, trackInVisitorDoc]);

    const trackDetailedEvent = React.useCallback(async (eventName: string, details: DetailedEvent) => {
         const analyticsRef = getAnalyticsRef();
        if (isLoaded && analyticsRef) {
            
            const visitorSource = localStorage.getItem('visitorSource') || 'direct';
            const eventDetailWithSource = { ...details, timestamp: new Date().toISOString(), source: details.source || visitorSource };
            
            const updates: Record<string, any> = {
                [`events.${eventName}`]: increment(1),
                [`detailedEvents.${eventName}`]: arrayUnion(eventDetailWithSource)
            };
            
            if (details.price) {
                updates[`events.${eventName}_amount`] = increment(details.price);
            }

            updateDoc(analyticsRef, updates).catch(async (e) => {
                 if (e.code === 'not-found') {
                    const initialData: any = {
                        events: { [eventName]: 1 },
                        detailedEvents: { [eventName]: [eventDetailWithSource] }
                    };
                     if (details.price) {
                        initialData.events[`${eventName}_amount`] = details.price;
                    }
                    setDoc(analyticsRef, initialData).catch(error => {
                        const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'create', requestResourceData: initialData });
                        errorEmitter.emit('permission-error', contextualError);
                    });
                 } else {
                    const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'update', requestResourceData: updates });
                    errorEmitter.emit('permission-error', contextualError);
                 }
            });
             await trackInVisitorDoc({ type: 'detailedEvent', name: eventName, details, timestamp: new Date().toISOString() });
        }
    }, [isLoaded, getAnalyticsRef, trackInVisitorDoc]);

    const trackError = React.useCallback(async (error: any) => {
        const analyticsRef = getAnalyticsRef();
        if (isLoaded && analyticsRef) {
            const newError: AppError = {
                timestamp: new Date().toISOString(),
                message: error.message,
                fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
            };
            
            const data = { errors: arrayUnion(newError) };
            updateDoc(analyticsRef, data).catch(async (e) => {
                if (e.code === 'not-found') {
                    const initialData = { errors: [newError] };
                    setDoc(analyticsRef, initialData).catch(error => {
                        const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'create', requestResourceData: initialData });
                        errorEmitter.emit('permission-error', contextualError);
                    });
                } else {
                    const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'update', requestResourceData: data });
                    errorEmitter.emit('permission-error', contextualError);
                }
            });
        }
    }, [isLoaded, getAnalyticsRef]);

    const clearAnalytics = React.useCallback(async () => {
        const analyticsRef = getAnalyticsRef();
        if (analyticsRef) {
            const data = defaultAnalyticsData;
            setDoc(analyticsRef, data).catch(error => {
                const contextualError = new FirestorePermissionError({ path: analyticsRef.path, operation: 'write', requestResourceData: data });
                errorEmitter.emit('permission-error', contextualError);
            });
        }
    }, [getAnalyticsRef]);

    React.useEffect(() => {
        if (isLoaded && pathname) {
            trackPageView(pathname);
        }
    }, [isLoaded, pathname, trackPageView]);

    return (
        <AnalyticsContext.Provider value={{ analyticsData: defaultAnalyticsData, trackEvent, trackDetailedEvent, trackError, clearAnalytics, isLoaded }}>
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => {
    const context = React.useContext(AnalyticsContext);
    if (context === undefined) {
        throw new Error('useAnalytics must be used within an AnalyticsProvider');
    }
    return context;
};
