import React, { useContext, useState, useEffect, createContext } from 'react';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Combine Firebase Auth User with a potential Firestore profile
export type AppUser = User & {
    // Add any custom profile properties here
    // e.g. bio?: string;
};

interface AuthContextType {
    currentUser: AppUser | null;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null });

export function useAuth() {
    return useContext(AuthContext);
}

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in, get their profile from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    // Combine auth data and firestore data
                    setCurrentUser({ ...user, ...userDoc.data() });
                } else {
                    // User exists in Auth, but not in Firestore.
                    // This can happen on first social sign-in.
                    // You might want to create the document here.
                    setCurrentUser(user);
                }
            } else {
                // User is signed out
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const signOut = () => {
    return firebaseSignOut(auth);
}
