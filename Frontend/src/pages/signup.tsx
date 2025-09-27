import React, { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase-config';
import { useNavigate, Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Signup = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const displayName = user.email?.split('@')[0] || 'New User';
            const photoURL = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`;

            // Update Firebase Auth profile
            await updateProfile(user, { displayName, photoURL });

            // Create user document in Firestore
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
                email: user.email,
                displayName: displayName,
                photoURL: photoURL,
                createdAt: new Date(),
            });

            navigate('/chat'); // Redirect to chat on successful signup
        } catch (error: unknown) {
            let errorMessage = "An unknown error occurred during sign up.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            console.error("Signup error:", error);
            setError(errorMessage);
        }
    };

    const onGoogleSignup = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user document exists, if not, create it
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    createdAt: new Date(),
                });
            }
            
            navigate('/chat');
        } catch (error: unknown) {
            let errorMessage = "An unknown error occurred.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            console.error("Google signup error:", error);
            setError("Failed to sign up with Google. Please try again.");
        }
    }

    return (
        <main className="flex items-center justify-center h-screen bg-background">
            <section className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-2xl shadow-primary/10">
                <div className="flex flex-col items-center space-y-2">
                    <Scale className="h-10 w-10 text-primary" />
                    <h1 className="text-2xl font-bold text-center text-card-foreground">Sign up for LawGPT</h1>
                </div>
                <div>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    type="email"
                                    id="email-address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Email address"
                                    className="relative block w-full px-3 py-2 border border-input bg-transparent rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Password"
                                    className="relative block w-full px-3 py-2 border border-input bg-transparent rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-center text-destructive">{error}</p>}

                        <div>
                            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary">
                                Sign up
                            </button>
                        </div>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-input"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div>
                        <button onClick={onGoogleSignup} className="group relative w-full flex justify-center items-center gap-2 py-2 px-4 border text-sm font-medium rounded-md text-foreground border-input bg-transparent hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary">
                            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 1.98-4.84 1.98-5.84 0-10.6-4.67-10.6-10.5s4.76-10.5 10.6-10.5c3.11 0 5.24 1.24 6.4 2.32l2.5-2.5C20.09 1.92 16.71 0 12.48 0 5.6 0 0 5.52 0 12.3s5.6 12.3 12.48 12.3c6.92 0 12.08-4.76 12.08-12.3 0-.76-.07-1.52-.2-2.26H12.48z" fill="currentColor"/></svg>
                            Google
                        </button>
                    </div>

                    <p className="mt-6 text-sm text-center text-muted-foreground">
                        Already have an account?
                        <Link to="/login" className="font-medium text-primary hover:text-primary/90">
                            Sign in
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
};

export default Signup;