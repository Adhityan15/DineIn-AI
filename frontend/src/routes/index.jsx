import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Register from '../pages/Register';

import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Profile from '../pages/Profile';
import Dashboard from '../pages/Dashboard';
import Reservations from '../pages/Reservations';
import Inventory from '../pages/Inventory';
import Menu from '../pages/Menu';
import Staff from '../pages/Staff';
import Customers from '../pages/Customers';
import Analytics from '../pages/Analytics';
import Reports from '../pages/Reports';
import Communication from '../pages/Communication';
import Settings from '../pages/Settings';
import Branches from '../pages/Branches';
import DesignSystemShowcase from '../pages/DesignSystemShowcase';
import POS from '../pages/POS';
import KDS from '../pages/KDS';
import PublicTableMenu from '../pages/PublicTableMenu';
import PublicReservation from '../pages/PublicReservation';

// Layout
import DashboardLayout from '../layouts/DashboardLayout';

// Guard component for authenticated paths
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  console.log("=== PROTECTED ROUTE ===");
  console.log("loading:", loading);
  console.log("user exists:", !!user);
  console.log("access token exists:", !!localStorage.getItem("access_token"));
  console.log("isAuthenticated:", isAuthenticated);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#00D9FF] border-t-transparent animate-spin"></div>
          <span className="text-xs font-semibold font-mono">Verifying secure session...</span>
        </div>
      </div>
    );
  }

  // Fallback: If user state is not in memory yet but access_token and user JSON exist in localStorage, do not bounce!
  const hasStoredToken = !!localStorage.getItem('access_token');
  const hasStoredUser = !!localStorage.getItem('user');

  if (!isAuthenticated && (!hasStoredToken || !hasStoredUser)) {
    console.log("[PROTECTED ROUTE REDIRECT] No auth state or storage token -> Redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    console.log("[PROTECTED ROUTE REDIRECT] Role mismatch -> Redirecting to /dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Guard component for guest-only paths
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const hasStoredToken = !!localStorage.getItem('access_token');
  const hasStoredUser = !!localStorage.getItem('user');

  console.log("=== GUEST ROUTE ===");
  console.log("loading:", loading);
  console.log("isAuthenticated:", isAuthenticated);
  console.log("hasStoredToken:", hasStoredToken);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 rounded-full border-4 border-[#00D9FF] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated || (hasStoredToken && hasStoredUser)) {
    console.log("[GUEST ROUTE REDIRECT] Authenticated user -> Redirecting to /dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Unauthenticated / Guest Pages */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
      <Route path="/table/:table_id/menu" element={<PublicTableMenu />} />
      <Route path="/reserve" element={<PublicReservation />} />

      {/* Authenticated Dashboard Subtree */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route 
          path="pos" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'receptionist']}>
              <POS />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="kds" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'kitchen_staff', 'receptionist']}>
              <KDS />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="reservations" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'receptionist']}>
              <Reservations />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="inventory" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'inventory_manager']}>
              <Inventory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="menu" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'receptionist']}>
              <Menu />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="staff" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
              <Staff />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="customers" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'receptionist']}>
              <Customers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="analytics" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="reports" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="communication" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner']}>
              <Communication />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="branches" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner']}>
              <Branches />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="settings" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner']}>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route path="profile" element={<Profile />} />
        <Route path="showcase" element={<DesignSystemShowcase />} />
      </Route>

      {/* Initial Opening Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<LandingPage />} />

      {/* Wildcard Fallbacks */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};


export default AppRoutes;
