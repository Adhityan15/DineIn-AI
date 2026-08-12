import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';

const RealTimeContext = createContext(null);

export const RealTimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    today_revenue: 0,
    active_reservations: 0,
    available_tables: 0,
    occupied_tables: 0,
    waitlist_count: 0,
    inventory_alerts: 0,
    staff_attendance: 0,
    avg_rating: 4.9,
    emails_sent: 0,
    ai_notifications_count: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchRealTimeStats = useCallback(async () => {
    if (!user) return;
    try {
      const activeBranchId = localStorage.getItem('branch_id') || user?.branch || '';
      if (!activeBranchId) return;

      const res = await client.get(`/branches/realtime-dashboard/?branch=${activeBranchId}`);
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching real-time dashboard stats:', err);
    }
  }, [user]);

  // Sync polling logic
  useEffect(() => {
    if (!user) return;

    // Fetch immediately on mount or user change
    fetchRealTimeStats();

    // Poll every 12 seconds
    const interval = setInterval(fetchRealTimeStats, 12000);

    // Listen to local branch updates
    const handleBranchUpdate = () => {
      fetchRealTimeStats();
    };
    window.addEventListener('branchUpdate', handleBranchUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('branchUpdate', handleBranchUpdate);
    };
  }, [user, fetchRealTimeStats]);

  return (
    <RealTimeContext.Provider value={{ stats, loading, refreshStats: fetchRealTimeStats }}>
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};
