// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-1de0bowjvfbbcx7q.us.auth0.com"
      clientId="xeqwBZVDu0UwBB93r8cdemCb9SF3gKU0"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: 'https://api.fitnessclub.com',
        // ✅✅✅ THE DEFINITIVE FIX IS HERE: ADD ALL REQUIRED SCOPES TO THE TOP LEVEL
         scope: 'openid profile email read:admin_dashboard', 
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </Auth0Provider>
  </React.StrictMode>,
);