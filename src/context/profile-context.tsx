'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp, updateDoc, increment, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { Profile as ProfileType } from '@/lib/types';


type ProfileContextType = {
    profile: ProfileType;
    updateProfile: (newProfile: Partial<ProfileType>) => void;
    isProfileCreated: boolean;
    completeOnboarding: (profileData: Partial<ProfileType> & { anonymousVisitorId?: string | null }) => void;
    updateUserSpent: (userId: string, amount: number) => void;
    hasTiktokAccess: boolean;
    setTiktokAccess: (hasAccess: boolean) => void;
    hasEarningsDoubled: boolean;
    setHasEarningsDoubled: (hasDoubled: boolean) => void;
    unlockedChats: string[];
    unlockChat: (chatId: string) => void;
    adminUnlocked: boolean;
    setAdminUnlock: (unlocked: boolean) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const defaultProfile: ProfileType = {
    id: '',
    name: '',
    avatarUrl: '',
    pixKey: '',
};

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const [profile, setProfile] = useState<ProfileType>(defaultProfile);
    const [isProfileCreated, setIsProfileCreated] = useState(false);
    const [hasTiktokAccess, setHasTiktokAccessState] = useState(false);
    const [hasEarningsDoubled, setHasEarningsDoubledState] = useState(false);
    const [unlockedChats, setUnlockedChats] = useState<string[]>([]);
    const [adminUnlocked, setAdminUnlockedState] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // This function re-reads all state from localStorage.
    const loadStateFromLocal = useCallback(() => {
        try {
            const onboarding = localStorage.getItem('onboardingComplete') === 'true';
            setIsProfileCreated(onboarding);

            const profileStr = localStorage.getItem('userProfile');
            const avatar = localStorage.getItem('userAvatar');
            const storedProfile = profileStr ? JSON.parse(profileStr) : {};
            setProfile({ ...defaultProfile, ...storedProfile, avatarUrl: avatar || '' });

            setHasTiktokAccessState(localStorage.getItem('hasTiktokAccess') === 'true');
            setHasEarningsDoubledState(localStorage.getItem('hasEarningsDoubled') === 'true');
            setUnlockedChats(JSON.parse(localStorage.getItem('unlockedChats') || '[]'));
            setAdminUnlockedState(localStorage.getItem('adminUnlocked') === 'true');
        } catch (e) {
            console.error("Error loading profile state from localStorage", e);
            // In case of error, reset to default to avoid broken state
            setIsProfileCreated(false);
            setProfile(defaultProfile);
            setHasTiktokAccessState(false);
            setHasEarningsDoubledState(false);
            setUnlockedChats([]);
            setAdminUnlockedState(false);
        } finally {
            if (!isLoaded) {
                setIsLoaded(true);
            }
        }
    }, [isLoaded]);

    // Initial load and cross-tab synchronization
    useEffect(() => {
        loadStateFromLocal(); // Initial load

        const handleStorageChange = (event: StorageEvent) => {
            // When a change happens in another tab, reload the state.
            loadStateFromLocal();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [loadStateFromLocal]);

    // This effect handles the pending Firestore write after authentication is complete.
    useEffect(() => {
        const writePendingData = () => {
            if (isUserLoading || !user || !firestore) {
                return; // Wait until auth is ready and we have a user
            }

            const pendingDataStr = localStorage.getItem('pendingFirestoreWrite');
            if (pendingDataStr) {
                const pendingData = JSON.parse(pendingDataStr);
                // **FIX**: Use the actual authenticated user's UID as the document ID.
                const userDocRef = doc(firestore, 'users', user.uid);
                
                // **FIX**: Ensure data to write uses the correct UID and removes avatarUrl
                const { avatarUrl, id, ...restOfData } = pendingData;
                const dataToWrite = {
                    ...restOfData,
                    id: user.uid, // Ensure data integrity
                    createdAt: serverTimestamp(),
                };

                // Use non-blocking write with .catch() for permission errors.
                setDoc(userDocRef, dataToWrite, { merge: true })
                    .then(() => {
                        // Clear the pending data on success
                        localStorage.removeItem('pendingFirestoreWrite');
                    })
                    .catch(serverError => {
                        errorEmitter.emit(
                            'permission-error',
                            new FirestorePermissionError({
                                path: userDocRef.path,
                                operation: 'write',
                                requestResourceData: dataToWrite,
                            })
                        );
                    });
            }
        };

        writePendingData();
    }, [isUserLoading, user, firestore]);
    
    const updateProfile = (newProfile: Partial<ProfileType>) => {
        setProfile(prev => {
            const updatedProfile = { ...prev, ...newProfile };
             try {
                if (newProfile.avatarUrl) {
                    // Always save the potentially large avatar URL only to localStorage
                    localStorage.setItem('userAvatar', newProfile.avatarUrl);
                }

                // Save other profile info to a different key
                const profileToSave = { id: updatedProfile.id, name: updatedProfile.name, pixKey: updatedProfile.pixKey };
                localStorage.setItem('userProfile', JSON.stringify(profileToSave));

                if (updatedProfile.id) {
                    localStorage.setItem('userId', updatedProfile.id);
                }
            } catch (error) {
                console.error("Failed to write profile to localStorage", error);
            }
            return updatedProfile;
        });
    };

    const completeOnboarding = (profileData: Partial<ProfileType> & { anonymousVisitorId?: string | null }) => {
        const userId = profileData.id || uuidv4();
        
        let utms = {};
        try {
            // Try to get UTMs from localStorage first
            const localUtms = localStorage.getItem('utm_params');
            if (localUtms) {
                utms = JSON.parse(localUtms);
            }

            // If localStorage is empty, try to get from URL as a fallback
            if (Object.keys(utms).length === 0 && typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'xcod', 'sck', 'ref', 'src'];
                let hasUtm = false;
                utmKeys.forEach(key => {
                    const value = params.get(key);
                    if (value) {
                        (utms as Record<string, string>)[key] = value;
                        hasUtm = true;
                    }
                });
            }
        } catch(e) {
            console.error("Error parsing UTMs", e);
        }

        const trackingData = {
            utm_source: (utms as any).utm_source || null,
            utm_medium: (utms as any).utm_medium || null,
            utm_campaign: (utms as any).utm_campaign || null,
            utm_id: (utms as any).utm_id || null,
            utm_term: (utms as any).utm_term || null,
            utm_content: (utms as any).utm_content || null,
            sck: (utms as any).sck || null,
            ref: (utms as any).xcod || (utms as any).ref, // Handle both xcod and ref
            src: (utms as any).src || null,
        };

        const { avatarUrl, ...firestoreData } = profileData;

        const finalProfileForState = {
            ...profile,
            ...profileData,
            id: userId,
            pixKey: profileData.pixKey || '', // Ensure pixKey is not undefined
        };
        
        // This is the object that will be saved to Firestore. Notice it doesn't include avatarUrl.
        const finalProfileForFirestore = {
            ...profile,
            ...firestoreData,
            id: userId,
            totalSpent: 0,
            events: [],
            anonymousVisitorId: profileData.anonymousVisitorId || null,
            tracking: trackingData, // Add tracking data
        };
        
        updateProfile(finalProfileForState);
        setIsProfileCreated(true);
        
        try {
            localStorage.setItem('onboardingComplete', 'true');
            localStorage.setItem('userId', userId);
            // Instead of writing directly, store it as pending. avatarUrl is handled by updateProfile.
            localStorage.setItem('pendingFirestoreWrite', JSON.stringify(finalProfileForFirestore));

        } catch (error) {
            console.error("Failed to set onboarding flag in localStorage", error);
        }
    };

    const updateUserSpent = (userId: string, amount: number) => {
        if (!firestore || !userId) return;
        const userDocRef = doc(firestore, 'users', userId);
        const data = { totalSpent: increment(amount) };
        updateDoc(userDocRef, data).catch(error => {
             errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: data,
                })
            )
        });
    };
    
    const setTiktokAccess = (hasAccess: boolean) => {
        setHasTiktokAccessState(hasAccess);
        try {
            localStorage.setItem('hasTiktokAccess', String(hasAccess));
            if (hasAccess) {
                // Apenas reinicia a contagem se o usuário já tiver recebido a notificação (3 vídeos curtidos)
                const likedSession = sessionStorage.getItem('liked_videos_session');
                if (likedSession) {
                    try {
                        const likedArray = JSON.parse(likedSession);
                        if (Array.isArray(likedArray) && likedArray.length >= 3) {
                            sessionStorage.removeItem('liked_videos_session');
                        }
                    } catch (e) {
                        // Se houver erro no parse, limpa por segurança
                        sessionStorage.removeItem('liked_videos_session');
                    }
                }
            }
             if (firestore && profile.id) {
                const docRef = doc(firestore, 'users', profile.id);
                const data = { hasTiktokAccess: hasAccess };
                updateDoc(docRef, data).catch(error => {
                    const contextualError = new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: data,
                    });
                    errorEmitter.emit('permission-error', contextualError);
                });
            }
        } catch (error) {
            console.error("Failed to set TikTok access flag", error);
        }
    };
    
    const setHasEarningsDoubled = (hasDoubled: boolean) => {
        setHasEarningsDoubledState(hasDoubled);
        try {
            localStorage.setItem('hasEarningsDoubled', String(hasDoubled));
            if (firestore && profile.id) {
                const docRef = doc(firestore, 'users', profile.id);
                const data = { hasEarningsDoubled: hasDoubled };
                updateDoc(docRef, data).catch(error => {
                    const contextualError = new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: data,
                    });
                    errorEmitter.emit('permission-error', contextualError);
                });
            }
        } catch (error) {
            console.error("Failed to set earnings doubled flag", error);
        }
    };

    const unlockChat = (chatId: string) => {
        setUnlockedChats(prev => {
            const newUnlocked = [...new Set([...prev, chatId])];
            try {
                localStorage.setItem('unlockedChats', JSON.stringify(newUnlocked));
                 if (firestore && profile.id) {
                    const docRef = doc(firestore, 'users', profile.id);
                    const data = { unlockedChats: newUnlocked };
                    updateDoc(docRef, data).catch(error => {
                        const contextualError = new FirestorePermissionError({
                            path: docRef.path,
                            operation: 'update',
                            requestResourceData: data,
                        });
                        errorEmitter.emit('permission-error', contextualError);
                    });
                }
            } catch (error) {
                console.error("Failed to save unlocked chats", error);
            }
            return newUnlocked;
        });
    };

    const setAdminUnlock = (unlocked: boolean) => {
        setAdminUnlockedState(unlocked);
        try {
            localStorage.setItem('adminUnlocked', String(unlocked));
        } catch (error) {
            console.error("Failed to set admin unlock flag", error);
        }
    };
    
    if (!isLoaded) {
        return null; // or a loading component
    }

    return (
        <ProfileContext.Provider value={{ profile, updateProfile, isProfileCreated, completeOnboarding, updateUserSpent, hasTiktokAccess, setTiktokAccess, hasEarningsDoubled, setHasEarningsDoubled, unlockedChats, unlockChat, adminUnlocked, setAdminUnlock }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
