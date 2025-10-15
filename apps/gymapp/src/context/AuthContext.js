// src/context/AuthContext.js
import { createContext, useEffect, useContext, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import apiClient from '../api/apiClient';
import * as authService from '../api/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const {
    isAuthenticated: isAuth0Authenticated,
    user: auth0User,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
    isLoading: isAuth0Loading,
  } = useAuth0();

  // Persisted JWT from our backend
  const [internalToken, setInternalToken] = useState(() => localStorage.getItem('authToken'));

  // Persisted user object from our backend
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('authUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Initialize with token from localStorage if available
  useEffect(() => {
    if (internalToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${internalToken}`;
    }
  }, []);

  // Sync Auth0 login with our backend and obtain internal JWT
  useEffect(() => {
    const syncUser = async () => {
      // Only proceed when Auth0 has finished loading
      if (!isAuth0Loading) {
        try {
          // Case 1: User is authenticated with Auth0 but we don't have an internal token
          if (isAuth0Authenticated && auth0User && !internalToken) {
            const auth0Token = await getAccessTokenSilently();
            const response = await authService.verifyAuth0User(auth0Token);

            if (response.success) {
              const { token, user: backendUser } = response.data;
              localStorage.setItem('authToken', token);
              localStorage.setItem('authUser', JSON.stringify(backendUser));
              setInternalToken(token);
              setUser(backendUser);
            }
          }
          // Case 2: We have an internal token but Auth0 says user is not authenticated
          // This could happen on page refresh when Auth0 state is lost
          else if (!isAuth0Authenticated && internalToken) {
            // We have a token, so we'll consider the user authenticated
            // You might want to validate the token with your backend here
            console.log('Using stored authentication token');
          }
          // Case 3: Neither Auth0 nor internal token is available
          else if (!isAuth0Authenticated && !internalToken) {
            // User is not authenticated, clear any stale data
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setInternalToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Error during authentication sync:', error);
          // If there's an error, clear any potentially invalid auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          setInternalToken(null);
          setUser(null);
        } finally {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    syncUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth0Authenticated, auth0User, getAccessTokenSilently, isAuth0Loading, internalToken]);

  // Attach or detach the JWT on Axios instance when it changes
  useEffect(() => {
    if (internalToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${internalToken}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [internalToken]);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setInternalToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  /**
   * Helper to set token & user from other components (e.g., onboarding steps)
   */
  const setAuthData = (token, userData) => {
    if (token) {
      localStorage.setItem('authToken', token);
      setInternalToken(token);
    }
    if (userData) {
      localStorage.setItem('authUser', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const value = {
    user,
    isAuthenticated: !!internalToken && !!user,
    loading: loading || isAuth0Loading,
    isLoading: loading || isAuth0Loading, // alias for existing usages
    authChecked,
    login: loginWithRedirect,
    logout,
    setAuthData,
  };

  return (
    <AuthContext.Provider value={value}>
      {authChecked && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);