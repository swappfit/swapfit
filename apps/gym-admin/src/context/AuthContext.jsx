// src/context/AuthContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import apiClient from '../api/apiClient';
// Removed * as authService import, as we are calling the API directly

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const {
    isAuthenticated: isAuth0Authenticated,
    user: auth0User, // ✅ This must be checked
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
    isLoading: isAuth0Loading,
  } = useAuth0();

  const [internalToken, setInternalToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('authUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync Auth0 login with our backend and obtain internal JWT
  useEffect(() => {
    const syncUser = async () => {
      // 1. If we are internally logged in, skip Auth0 checks.
      if (internalToken && user) {
        setLoading(false);
        return;
      }
      
      // 2. We must wait until Auth0 has both authenticated the user AND provided the user object.
      if (isAuth0Authenticated && auth0User) {
        try {
          const auth0Token = await getAccessTokenSilently();
          
          // CRITICAL: Call the specific ADMIN verification endpoint
          const response = await apiClient.post(
            '/auth/verify-user-admin', 
            {}, 
            {
              headers: { Authorization: `Bearer ${auth0Token}` }
            }
          );

          const { token, user: backendUser } = response.data.data;

          // Store our internal token and user
          localStorage.setItem('authToken', token);
          localStorage.setItem('authUser', JSON.stringify(backendUser));
          setInternalToken(token);
          setUser(backendUser);
          
          // Update apiClient to use our internal token for subsequent requests
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        } catch (error) {
          // CRITICAL: Log out on failure to prevent loop.
          console.error('Error during token exchange (Admin App):', error.response ? error.response.data : error.message);
          
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          setInternalToken(null);
          setUser(null);
          delete apiClient.defaults.headers.common['Authorization'];
          // auth0Logout({ logoutParams: { returnTo: window.location.origin } }); 
        }
      }
      setLoading(false);
    };

    // The dependencies are correct and force a rerun when state changes.
    syncUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth0Authenticated, auth0User, getAccessTokenSilently]); // REVERTED TO ORIGINAL DEPENDENCY ARRAY

  // Attach or detach the JWT on Axios instance when it changes
  useEffect(() => {
    if (internalToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${internalToken}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [internalToken]);

  const logout = () => {
    // Clear our internal auth state
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setInternalToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];

    // Log out from Auth0
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const value = {
    user,
    isAuthenticated: !!internalToken && !!user,
    isLoading: loading || isAuth0Loading,
    login: loginWithRedirect,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!value.isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};