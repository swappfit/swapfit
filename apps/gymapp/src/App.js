// src/App.js
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import config from './config';
import './index.css';

function App() {
  return (
    <Auth0Provider
      domain={config.auth0.domain}
      clientId={config.auth0.clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: config.auth0.audience,
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </Auth0Provider>
  );
}

export default App;