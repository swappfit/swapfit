// src/pages/SelectRolePage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../api/authService';
import { useAuth } from '../context/AuthContext';
import parseApiError from '../utils/parseApiError';

export default function SelectRolePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, setAuthData } = useAuth(); // Get the current user for logging

  const handleRoleSelection = async (role) => {
    setLoading(true);
    setError('');

    // --- DEBUG STEP 1: Log the state BEFORE the API call ---
    console.log('--- Role Selection Initiated ---');
    console.log('Role Clicked:', role);
    console.log('User object in context BEFORE API call:', user);

    try {
      const response = await authService.selectRole(role);
      
      // --- DEBUG STEP 2: Log the ENTIRE response from the backend ---
      console.log('Backend Response Received:', response);

      if (response.success && response.data) {
        
        // --- DEBUG STEP 3: Check if the necessary data exists ---
        console.log('Does response have a token?', !!response.data.token);
        console.log('Does response have a user object?', !!response.data.user);
        
        if (response.data.token && response.data.user) {
          console.log('UPDATING AUTH CONTEXT with new token and user object.');
          setAuthData(response.data.token, response.data.user);
          
          // --- DEBUG STEP 4: Log the navigation destination ---
          console.log('NAVIGATION: Attempting to navigate to:', response.data.redirectTo);
          navigate(response.data.redirectTo);

        } else {
          console.error('CRITICAL ERROR: The backend response is missing the token or user object.');
          setError('An unexpected error occurred. The server response was incomplete.');
        }
      } else {
        throw new Error(response.message || 'Failed to select role.');
      }
    } catch (err) {
      console.error('An error occurred during role selection:', err);
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">How will you use FitFlex?</h2>
          <p className="text-gray-600">Choose your primary role to get started.</p>
          {error && <p className="text-red-500">{error}</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <button
              onClick={() => handleRoleSelection('GYM_OWNER')}
              disabled={loading}
              className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition text-left disabled:opacity-50"
            >
              <div className="text-4xl mb-2">🏢</div>
              <h3 className="font-semibold text-lg">Gym Owner</h3>
              <p className="text-gray-500 text-sm">Manage my gym and members</p>
            </button>

            <button
              onClick={() => handleRoleSelection('TRAINER')}
              disabled={loading}
              className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition text-left disabled:opacity-50"
            >
              <div className="text-4xl mb-2">🏋️‍♂️</div>
              <h3 className="font-semibold text-lg">Trainer</h3>
              <p className="text-gray-500 text-sm">Train clients and build plans</p>
            </button>

            <button
              onClick={() => handleRoleSelection('MERCHANT')}
              disabled={loading}
              className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition text-left disabled:opacity-50"
            >
              <div className="text-4xl mb-2">🛍️</div>
              <h3 className="font-semibold text-lg">Merchant</h3>
              <p className="text-gray-500 text-sm">Sell products on the marketplace</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}