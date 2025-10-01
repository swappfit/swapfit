
// src/pages/LoginPage.jsx
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Flexi-Fit</h1>
        <p className="text-gray-600 mb-8">Your ultimate fitness companion. Please log in or sign up to continue.</p>
        <button 
          onClick={() => login()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-transform transform hover:scale-105"
        >
          Login or Sign Up
        </button>
      </div>
    </div>
  );
}
