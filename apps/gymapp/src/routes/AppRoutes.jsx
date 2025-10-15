// src/AppRoutes.js
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import Layout and Pages
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../pages/LoginPage';
import SelectRolePage from '../pages/SelectRolePage';
import ProtectedRoute from './ProtectedRoute';

// Import Onboarding Forms
import GymProfileForm from '../pages/GymProfileForm';
import TrainerProfileForm from '../pages/TrainerProfileForm';
import MerchantProfileForm from '../pages/MerchantProfileForm';

// Import Main App Pages
// ===== GYM OWNER =====
import GymDashboard from '../pages/Gym/GymDashboard';
import GymMembers from '../pages/Gym/GymMembers';
import GymPayments from '../pages/Gym/GymPayments';
import GymProfile from '../pages/Gym/GymProfile';

// ===== TRAINER =====
import TrainerDashboard from '../pages/Trainer/TrainerDashboard';
import TrainerClients from '../pages/Trainer/TrainerClients';
import TrainerMessages from '../pages/Trainer/TrainerMessages'; // Added import for messages
import TrainerPayments from '../pages/Trainer/TrainerPayments';
import TrainerProfile from '../pages/Trainer/TrainerProfile';

// ===== MERCHANT =====
import MerchantDashboard from '../pages/Merchant/MerchantDashboard';
import MerchantProductsPage from '../pages/Merchant/MerchantProductsPage';
import MerchantOrdersPage from '../pages/Merchant/MerchantOrdersPage';
import MerchantProfile from '../pages/Merchant/MerchantProfile';
import AddProductPage from '../pages/Merchant/AddProductPage';
import MerchantAnalyticsPage from '../pages/Merchant/MerchantAnalyticsPage';

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      {/* ✅ FIXED: Redirect based on role */}
      <Route 
        path="/" 
        element={
          !isAuthenticated ? 
            <LoginPage /> : 
          user?.role?.toUpperCase() === 'GYM_OWNER' ? 
            <Navigate to="/gym/dashboard" replace /> :
          user?.role?.toUpperCase() === 'TRAINER' ? 
            <Navigate to="/trainer/dashboard" replace /> :
          user?.role?.toUpperCase() === 'MERCHANT' ? 
            <Navigate to="/merchant/dashboard" replace /> :
            <Navigate to="/select-role" replace />
        } 
      />

      {/* ✅ FIXED: app-redirect also respects role */}
      <Route 
        path="/app-redirect" 
        element={
          !isAuthenticated ? 
            <Navigate to="/" replace /> :
          user?.role?.toUpperCase() === 'GYM_OWNER' ? 
            <Navigate to="/gym/dashboard" replace /> :
          user?.role?.toUpperCase() === 'TRAINER' ? 
            <Navigate to="/trainer/dashboard" replace /> :
          user?.role?.toUpperCase() === 'MERCHANT' ? 
            <Navigate to="/merchant/dashboard" replace /> :
            <Navigate to="/select-role" replace />
        } 
      />
      
      <Route element={<ProtectedRoute />}>
        {/* Universal /dashboard route for direct access */}
        <Route
          path="/dashboard"
          element={
            user?.role?.toUpperCase() === 'GYM_OWNER' ? <Navigate to="/gym/dashboard" replace /> :
            user?.role?.toUpperCase() === 'TRAINER' ? <Navigate to="/trainer/dashboard" replace /> :
            user?.role?.toUpperCase() === 'MERCHANT' ? <Navigate to="/merchant/dashboard" replace /> :
            <Navigate to="/select-role" replace />
          }
        />
        <Route path="/select-role" element={<SelectRolePage />} />
        <Route path="/create-gym-profile" element={<GymProfileForm />} />
        <Route path="/create-trainer-profile" element={<TrainerProfileForm />} />
        <Route path="/create-merchant-profile" element={<MerchantProfileForm />} />

        {/* ===== GYM OWNER ROUTES ===== */}
        <Route path="/gym/*" element={<MainLayout />}>
          <Route index element={<GymDashboard />} />
          <Route path="dashboard" element={<GymDashboard />} />
          <Route path="members" element={<GymMembers />} />
          <Route path="payments" element={<GymPayments />} />
          <Route path="gym-profile" element={<GymProfile />} />
        </Route>

        {/* ===== TRAINER ROUTES ===== */}
        <Route path="/trainer/*" element={<MainLayout />}>
          <Route index element={<TrainerDashboard />} />
          <Route path="dashboard" element={<TrainerDashboard />} />
          <Route path="clients" element={<TrainerClients />} />
          <Route path="messages" element={<TrainerMessages />} /> {/* Added messages route */}
          <Route path="payments" element={<TrainerPayments />} />
          <Route path="profile" element={<TrainerProfile />} />
        </Route>

        {/* ===== MERCHANT ROUTES ===== */}
        <Route path="/merchant/*" element={<MainLayout />}>
          <Route index element={<MerchantDashboard />} />
          <Route path="dashboard" element={<MerchantDashboard />} />
          <Route path="products" element={<MerchantProductsPage />} />
          <Route path="add-product" element={<AddProductPage />} />
          <Route path="orders" element={<MerchantOrdersPage />} />
          <Route path="analytics" element={<MerchantAnalyticsPage />} />
          <Route path="profile" element={<MerchantProfile />} />

        </Route>
      </Route>
      
      <Route path="*" element={<h1>404: Not Found</h1>} />
    </Routes>
  );
};

export default AppRoutes;