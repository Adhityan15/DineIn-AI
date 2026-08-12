import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const BranchContext = createContext(null);

export const BranchProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentBranches, setRecentBranches] = useState([]);

  // Load recently used branches from localStorage
  useEffect(() => {
    const savedRecents = localStorage.getItem('recent_branches');
    if (savedRecents) {
      try {
        setRecentBranches(JSON.parse(savedRecents));
      } catch (e) {
        console.error('Failed to parse recent branches:', e);
      }
    }
  }, []);

  // Filter available branches based on user roles
  const getAvailableBranches = useCallback((allBranches) => {
    if (!user) return [];
    
    const role = user.role;
    const userBranchId = user.branch;
    
    if (role === 'owner' || role === 'admin' || role === 'manager') {
      return allBranches;
    } else {
      // Staff roles: receptionist, kitchen_staff, inventory_manager, etc.
      if (userBranchId) {
        return allBranches.filter(b => b.id === userBranchId);
      }
      return allBranches.slice(0, 1);
    }
  }, [user]);

  const loadBranchData = useCallback(async () => {
    if (!user) {
      setCurrentBranch(null);
      setBranches([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await client.get('/branches/');
      const allBranches = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.data || []);
      
      const filteredBranches = getAvailableBranches(allBranches);
      setBranches(filteredBranches);
      
      let savedBranchId = localStorage.getItem('selected_branch') || localStorage.getItem('branch_id');
      let active = null;
      
      if (savedBranchId && savedBranchId !== 'undefined' && savedBranchId !== 'null') {
        active = filteredBranches.find(b => b.id === savedBranchId);
      }
      
      // Fallback to ADAMBAKKAM-CHENNAI or first available branch
      if (!active && filteredBranches.length > 0) {
        active = filteredBranches.find(b => b.name?.toLowerCase().includes('adambakkam')) || 
                 filteredBranches.find(b => b.is_default) || 
                 filteredBranches[0];
      }
      
      if (active) {
        setCurrentBranch(active);
        localStorage.setItem('selected_branch', active.id);
        localStorage.setItem('branch_id', active.id);
        localStorage.setItem('branch_name', active.name);
        localStorage.setItem('is_cloud_kitchen', active.is_cloud_kitchen ? 'true' : 'false');
      } else {
        setCurrentBranch(null);
      }
    } catch (err) {
      console.error('Failed to load branches data:', err);
      addToast('Failed to load restaurant branches.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, getAvailableBranches, addToast]);

  useEffect(() => {
    loadBranchData();
  }, [loadBranchData]);

  // Synchronous Branch Selector Handler
  const selectBranch = useCallback((branchId) => {
    const matched = branches.find(b => b.id === branchId || b.branch_code === branchId);
    if (!matched) {
      console.warn('[BranchContext] Branch not found for ID:', branchId);
      return;
    }
    
    // 1. Immediately update localStorage synchronously
    localStorage.setItem('selected_branch', matched.id);
    localStorage.setItem('branch_id', matched.id);
    localStorage.setItem('branch_name', matched.name);
    localStorage.setItem('is_cloud_kitchen', matched.is_cloud_kitchen ? 'true' : 'false');
    
    // 2. Immediately update React State
    setCurrentBranch(matched);
    
    // 3. Immediately dispatch branchUpdate event to refresh all active page components
    window.dispatchEvent(new Event('branchUpdate'));
    
    // 4. Update recent branches list
    setRecentBranches(prev => {
      const filtered = prev.filter(b => b.id !== matched.id);
      const updated = [matched, ...filtered].slice(0, 5);
      localStorage.setItem('recent_branches', JSON.stringify(updated));
      return updated;
    });

    addToast(`Switched active branch to ${matched.name}`, 'success');
  }, [branches, addToast]);

  return (
    <BranchContext.Provider value={{
      currentBranch,
      setCurrentBranch: selectBranch,
      selectBranch,
      availableBranches: branches,
      branches,
      loading,
      recentBranches,
      refreshBranch: loadBranchData
    }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
