import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithCredential,
  GoogleAuthProvider,
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, firebaseConfig } from '../firebase/config';
import { 
  checkEmailWhitelist, 
  verifyLicenseKey, 
  isRootAdminEmail, 
  ROOT_ADMIN_EMAIL,
  ensureRootAdminInitialized 
} from '../firebase/teamService';
import { AuthUserProfile, WhitelistUser } from '../types';
import { safeStorage } from '../utils/storage';

interface AuthContextType {
  currentUser: User | null;
  userProfile: AuthUserProfile | null;
  loading: boolean;
  isWhitelisted: boolean;
  isAdmin: boolean;
  isRootAdmin: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithLicense: (key: string, email?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_LICENSE_SESSION = 'gmaps_license_session_user';
const STORAGE_KEY_GOOGLE_SESSION = 'gmaps_google_session_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const verifyAndLoadProfile = async (email: string, userObj?: User | null, isFromGoogle = false) => {
    setLoading(true);
    setAuthError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const isTargetRootEmail = isRootAdminEmail(cleanEmail);

      const result = await checkEmailWhitelist(cleanEmail);
      
      if (result.isWhitelisted && result.user) {
        const isRoot = isTargetRootEmail;
        const profile: AuthUserProfile = {
          uid: userObj?.uid || `user_${result.user.email}`,
          email: result.user.email,
          displayName: result.user.name || userObj?.displayName || email.split('@')[0],
          photoURL: userObj?.photoURL || undefined,
          role: isRoot ? 'admin' : result.user.role,
          status: result.user.status,
          licenseKey: result.user.licenseKey,
          isRootAdmin: isRoot
        };
        setUserProfile(profile);
        setIsWhitelisted(true);
        if (isFromGoogle || userObj) {
          safeStorage.setItem(STORAGE_KEY_GOOGLE_SESSION, JSON.stringify(profile));
        }
      } else {
        setUserProfile(null);
        setIsWhitelisted(false);
        setAuthError(result.reason || 'Email Anda belum didaftarkan dalam Whitelist.');
      }
    } catch (err: any) {
      console.error('Error verifying profile:', err);
      setUserProfile(null);
      setIsWhitelisted(false);
      setAuthError(err?.message || 'Gagal memverifikasi izin akun.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if there is an active Firebase Auth user
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        setCurrentUser(user);
        await verifyAndLoadProfile(user.email, user, true);
      } else {
        // Check if there is a saved Google Session (from GIS fallback)
        const savedGoogle = safeStorage.getItem(STORAGE_KEY_GOOGLE_SESSION);
        if (savedGoogle) {
          try {
            const parsed = JSON.parse(savedGoogle) as AuthUserProfile;
            if (parsed && parsed.email) {
              const res = await checkEmailWhitelist(parsed.email);
              if (res.isWhitelisted && res.user && res.user.status === 'active') {
                const isRoot = isRootAdminEmail(parsed.email);
                setUserProfile({
                  ...parsed,
                  role: isRoot ? 'admin' : res.user.role,
                  isRootAdmin: isRoot
                });
                setIsWhitelisted(true);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Invalid saved google session:', e);
          }
        }

        // Check if there is a saved License Session
        const savedSession = safeStorage.getItem(STORAGE_KEY_LICENSE_SESSION);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession) as WhitelistUser;
            if (parsed && parsed.email) {
              const res = await checkEmailWhitelist(parsed.email);
              if (res.isWhitelisted && res.user && res.user.status === 'active') {
                const isRoot = isRootAdminEmail(parsed.email);
                setUserProfile({
                  uid: `license_${res.user.email}`,
                  email: res.user.email,
                  displayName: res.user.name,
                  role: isRoot ? 'admin' : res.user.role,
                  status: res.user.status,
                  licenseKey: res.user.licenseKey,
                  isRootAdmin: isRoot
                });
                setIsWhitelisted(true);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Invalid saved license session:', e);
          }
        }
        
        setCurrentUser(null);
        setUserProfile(null);
        setIsWhitelisted(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);

    // Helper: Google Identity Services (GSI) OAuth Flow
    const tryGoogleIdentityServices = (): Promise<boolean> => {
      return new Promise((resolve) => {
        const oAuthClientId = (firebaseConfig as any)?.oAuthClientId;
        if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2 || !oAuthClientId) {
          resolve(false);
          return;
        }

        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: oAuthClientId,
            scope: 'email profile openid',
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                console.warn('GSI Token error:', tokenResponse.error);
                resolve(false);
                return;
              }

              try {
                // Fetch profile info from Google API
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await res.json();
                if (userInfo && userInfo.email) {
                  const googleUserObj: any = {
                    uid: `google_${userInfo.sub || userInfo.email}`,
                    email: userInfo.email,
                    displayName: userInfo.name || userInfo.email.split('@')[0],
                    photoURL: userInfo.picture
                  };
                  setCurrentUser(googleUserObj);
                  await verifyAndLoadProfile(userInfo.email, googleUserObj, true);
                  resolve(true);
                } else {
                  resolve(false);
                }
              } catch (fetchErr) {
                console.error('Error fetching Google user profile:', fetchErr);
                resolve(false);
              }
            },
            error_callback: (err: any) => {
              console.warn('GSI error_callback:', err);
              resolve(false);
            }
          });

          client.requestAccessToken({ prompt: 'select_account' });
        } catch (initErr) {
          console.warn('GSI init error:', initErr);
          resolve(false);
        }
      });
    };

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        await verifyAndLoadProfile(result.user.email, result.user, true);
        return;
      }
    } catch (err: any) {
      console.warn('Standard Google popup encountered issue:', err?.code || err?.message);

      // If domain unauthorized or popup blocked, automatically attempt GSI flow
      if (
        err?.code === 'auth/unauthorized-domain' || 
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('unauthorized-domain')
      ) {
        const gsiSuccess = await tryGoogleIdentityServices();
        if (gsiSuccess) {
          return;
        }

        // If GSI popup was also blocked or dismissed, display helpful instructions
        setAuthError(
          'Akses Google Popup dibatasi oleh domain preview. Silakan masuk menggunakan tab "Kunci Lisensi Tim" dengan memasukkan Email Anda atau tambahkan domain ini ke Firebase Console > Authentication > Authorized Domains.'
        );
      } else {
        setAuthError(err?.message || 'Gagal masuk dengan Akun Google.');
      }
      setLoading(false);
    }
  };

  const signInWithLicense = async (key: string, email?: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);

    try {
      const result = await verifyLicenseKey(key, email);
      if (result.isValid && result.user) {
        const isRoot = isRootAdminEmail(result.user.email);
        const profile: AuthUserProfile = {
          uid: `license_${result.user.email}`,
          email: result.user.email,
          displayName: result.user.name,
          role: isRoot ? 'admin' : result.user.role,
          status: result.user.status,
          licenseKey: result.user.licenseKey,
          isRootAdmin: isRoot
        };
        setUserProfile(profile);
        setIsWhitelisted(true);
        safeStorage.setItem(STORAGE_KEY_LICENSE_SESSION, JSON.stringify(result.user));
        setLoading(false);
        return true;
      } else {
        setAuthError(result.reason || 'Kunci lisensi atau email tidak valid.');
        setLoading(false);
        return false;
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Gagal memvalidasi lisensi.');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fbSignOut(auth).catch(() => {});
      safeStorage.removeItem(STORAGE_KEY_LICENSE_SESSION);
      safeStorage.removeItem(STORAGE_KEY_GOOGLE_SESSION);
      setCurrentUser(null);
      setUserProfile(null);
      setIsWhitelisted(false);
      setAuthError(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (userProfile?.email) {
      await verifyAndLoadProfile(userProfile.email, currentUser);
    }
  };

  const isAdmin = !!(userProfile && (userProfile.role === 'admin' || userProfile.isRootAdmin));
  const isRootAdmin = !!(userProfile && userProfile.isRootAdmin);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isWhitelisted,
        isAdmin,
        isRootAdmin,
        authError,
        signInWithGoogle,
        signInWithLicense,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
