import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, provider, db, isUsingDemoConfig } from '@/lib/firebase';
import { UserInitializationService } from '@/lib/userInitialization';

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  isInitialized: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearError = () => setAuthError(null);

  async function signup(email: string, password: string, displayName?: string) {
    try {
      clearError();
      setLoading(true);

      if (!auth) {
        // Demo mode - simulate successful signup
        const demoUser = {
          uid: 'demo-user',
          email: email,
          displayName: displayName || 'Demo User'
        } as User;
        setUser(demoUser);
        setIsInitialized(true);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Initialize new user with default data
      if (userCredential.user) {
        console.log('Initializing new user...');
        if (!isUsingDemoConfig && db) {
          const initSuccess = await UserInitializationService.initializeNewUser(userCredential.user);
          setIsInitialized(initSuccess);
        } else {
          console.log('Using demo config, skipping Firebase user initialization');
          setIsInitialized(true);
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setAuthError(error.message || 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      clearError();
      setLoading(true);

      if (!auth) {
        // Demo mode - simulate successful login
        const demoUser = {
          uid: 'demo-user',
          email: email,
          displayName: 'Demo User'
        } as User;
        setUser(demoUser);
        setIsInitialized(true);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Update last login time
      if (userCredential.user && !isUsingDemoConfig && db) {
        await UserInitializationService.updateLastLogin(userCredential.user.uid);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Failed to log in');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    if (!auth || !provider) {
      // Demo mode - simulate successful Google login
      try {
        clearError();
        setLoading(true);
        const demoUser = {
          uid: 'demo-user',
          email: 'demo@example.com',
          displayName: 'Demo User'
        } as User;
        setUser(demoUser);
        setIsInitialized(true);
        return;
      } catch (error: any) {
        setAuthError('Demo login failed');
        throw error;
      } finally {
        setLoading(false);
      }
    }

    try {
      clearError();
      setLoading(true);

      const userCredential = await signInWithPopup(auth, provider);

      if (userCredential.user) {
        if (!isUsingDemoConfig && db) {
          // Check if this is a new user and initialize if needed
          const isAlreadyInitialized = await UserInitializationService.checkUserInitialization(userCredential.user.uid);

          if (!isAlreadyInitialized) {
            console.log('Initializing new Google user...');
            const initSuccess = await UserInitializationService.initializeNewUser(userCredential.user);
            setIsInitialized(initSuccess);
          } else {
            setIsInitialized(true);
          }

          // Update last login time
          await UserInitializationService.updateLastLogin(userCredential.user.uid);
        } else {
          console.log('Using demo config, skipping Firebase user initialization');
          setIsInitialized(true);
        }
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      setAuthError(error.message || 'Failed to log in with Google');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    if (!auth) {
      // In demo mode, just reset the state
      setIsInitialized(false);
      setUser(null);
      return;
    }

    try {
      clearError();
      await signOut(auth);
      setIsInitialized(false);
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setAuthError(error.message || 'Failed to log out');
      throw error;
    }
  }

  async function resetPassword(email: string) {
    if (!auth) {
      setAuthError('Password reset not available in demo mode');
      throw new Error('Password reset not available in demo mode');
    }

    try {
      clearError();
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setAuthError(error.message || 'Failed to send password reset email');
      throw error;
    }
  }

  useEffect(() => {
    // Skip Firebase auth listener if auth is not available
    if (!auth || isUsingDemoConfig || !db) {
      setLoading(false);
      setIsInitialized(true);
      // Set up demo user for navigation to work
      setUser({
        uid: 'demo-user',
        email: 'demo@example.com',
        displayName: 'Demo User'
      } as User);
      console.log('Using demo mode, setting up demo user');
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);

        if (user) {
          try {
            if (!isUsingDemoConfig && db) {
              // Check user initialization status
              const initStatus = await UserInitializationService.checkUserInitialization(user.uid);
              setIsInitialized(initStatus);

              // If user exists but not initialized, initialize them
              if (!initStatus) {
                console.log('User exists but not initialized, initializing...');
                const initSuccess = await UserInitializationService.initializeNewUser(user);
                setIsInitialized(initSuccess);
              }
            } else {
              console.log('Using demo config, skipping Firebase user initialization check');
              setIsInitialized(true);
            }
          } catch (error) {
            console.error('Error checking user initialization:', error);
            setIsInitialized(true); // Fall back to initialized state
          }
        } else {
          setIsInitialized(false);
        }

        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Failed to set up auth state listener:', error);
      setLoading(false);
      setIsInitialized(true);
      return () => {}; // Return empty cleanup function
    }
  }, []);

  const value: AuthContextType = {
    user,
    currentUser: user,
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword,
    loading,
    isInitialized,
    authError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
