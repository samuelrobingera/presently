import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { isSuperAdmin } from '../utils/superAdmin';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [userRole, setUserRole] = useState('member');
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };
        setUser(userData);
        setIsDemo(false);

        // Check super-admin status first
        const isSuperAdminCheck = isSuperAdmin(firebaseUser.email);
        setIsSuperAdminUser(isSuperAdminCheck);

        try {
          const org = await authService.lookupOrganization(firebaseUser.email, false);
          setOrganization(org);

          if (org) {
            if (org.ownerId === firebaseUser.uid) {
              setUserRole('owner');
            } else if (org.adminIds && org.adminIds.includes(firebaseUser.uid)) {
              setUserRole('admin');
            } else {
              setUserRole('member');
            }
          }
        } catch (error) {
          console.error('Error during auth initialization:', error);
        }
      } else {
        setUser(null);
        setOrganization(null);
        setUserRole('member');
        setIsSuperAdminUser(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (provider, demo = false) => {
    setLoading(true);
    try {
      const loggedInUser = await authService.login(provider, demo);
      setUser(loggedInUser);
      setIsDemo(demo);

      // Check super-admin status
      const isSuperAdminCheck = isSuperAdmin(loggedInUser.email);
      setIsSuperAdminUser(isSuperAdminCheck);

      const org = await authService.lookupOrganization(loggedInUser.email, demo);
      setOrganization(org);

      if (demo && org) {
        setUserRole('owner'); // Default to owner in demo mode for Acme
      } else if (org) {
        if (org.ownerId === loggedInUser.uid) {
          setUserRole('owner');
        } else if (org.adminIds?.includes(loggedInUser.uid)) {
          setUserRole('admin');
        } else {
          setUserRole('member');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout(isDemo);
      setUser(null);
      setOrganization(null);
      setUserRole('member');
      setIsSuperAdminUser(false);
      setIsDemo(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    organization,
    userRole,
    isSuperAdminUser,
    loading,
    isDemo,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
