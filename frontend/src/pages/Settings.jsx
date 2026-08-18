import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Sparkles, 
  MapPin, 
  Bell, 
  Globe, 
  Save, 
  CheckCircle,
  RefreshCw,
  Lock,
  Database,
  Palette,
  Eye,
  EyeOff,
  Cpu,
  Plus,
  Trash2,
  Edit,
  Check
} from 'lucide-react';
import Modal from '../components/Modal';

import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import {
  AppCard,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  Badge,
  Input,
  Select,
  Textarea
} from '../components/DesignSystem';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
};

const Settings = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Forms states
  const [branchForm, setBranchForm] = useState({
    name: 'Bangalore Main',
    address: '456 Side St, Bangalore, India',
    latitude: '12.971598',
    longitude: '77.594562',
    geofence_radius: '100'
  });

  const [alertForm, setAlertForm] = useState({
    burnout_threshold: '75',
    reorder_threshold: '15',
    rating_alert_threshold: '2'
  });

  const [apiKey, setApiKey] = useState('google_places_api_mock_secret_key_12345');

  const [restaurantNameInput, setRestaurantNameInput] = useState(
    localStorage.getItem('restaurant_name') || 'DineIn AI'
  );

  // Theme configuration states
  const [themeMode, setThemeMode] = useState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  const [branches, setBranches] = useState([]);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null); // null means adding new
  const [manageBranchForm, setManageBranchForm] = useState({
    name: '',
    branch_code: '',
    latitude: '',
    longitude: '',
    geofence_radius: '100',
    address: '',
    is_active: true
  });

  const loadBranches = async () => {
    try {
      const res = await client.get('/branches/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setBranches(list);
    } catch (err) {
      console.error('Failed to load branch list:', err);
    }
  };

  // Load current branch metadata from API and branches list
  useEffect(() => {
    const loadBranch = async () => {
      const activeBranchId = localStorage.getItem('branch_id') || user?.branch;
      if (!activeBranchId) return;
      setLoading(true);
      try {
        const res = await client.get(`/branches/${activeBranchId}/`);
        setBranchForm({
          name: res.data.name || '',
          address: res.data.address || '',
          latitude: res.data.latitude || '',
          longitude: res.data.longitude || '',
          geofence_radius: String(res.data.geofence_radius || 100)
        });
      } catch (err) {
        console.error('Failed to load branch details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBranch();
    loadBranches();

    window.addEventListener('branchUpdate', loadBranch);
    return () => window.removeEventListener('branchUpdate', loadBranch);
  }, [user?.branch]);

  const handleCreateOrEditBranch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: manageBranchForm.name,
        branch_code: manageBranchForm.branch_code,
        latitude: manageBranchForm.latitude ? parseFloat(manageBranchForm.latitude) : null,
        longitude: manageBranchForm.longitude ? parseFloat(manageBranchForm.longitude) : null,
        geofence_radius: parseInt(manageBranchForm.geofence_radius) || 100,
        address: manageBranchForm.address,
        is_active: manageBranchForm.is_active
      };

      if (editingBranch) {
        await client.patch(`/branches/${editingBranch.id}/`, payload);
        addToast('Branch details updated successfully.', 'success');
      } else {
        await client.post('/branches/', payload);
        addToast('New branch registered successfully.', 'success');
      }
      setBranchModalOpen(false);
      setEditingBranch(null);
      loadBranches();
      window.dispatchEvent(new Event('branchUpdate'));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save branch details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultBranch = async (branchObj) => {
    setLoading(true);
    try {
      await client.patch(`/branches/${branchObj.id}/`, { is_default: true });
      addToast(`${branchObj.name} is now the default enterprise branch.`, 'success');
      loadBranches();
      localStorage.setItem('branch_id', branchObj.id);
      localStorage.setItem('branch_name', branchObj.name);
      window.dispatchEvent(new Event('branchUpdate'));
    } catch (err) {
      addToast('Failed to set default branch.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch? All associated tables will be removed.')) return;
    setLoading(true);
    try {
      await client.delete(`/branches/${branchId}/`);
      addToast('Branch removed from directory.', 'info');
      loadBranches();
      window.dispatchEvent(new Event('branchUpdate'));
    } catch (err) {
      addToast('Failed to delete branch.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSave = async (e) => {
    e.preventDefault();
    const activeBranchId = localStorage.getItem('branch_id') || user?.branch;
    if (!activeBranchId) return;
    setLoading(true);
    try {
      const payload = {
        name: branchForm.name,
        address: branchForm.address,
        latitude: branchForm.latitude ? parseFloat(branchForm.latitude) : null,
        longitude: branchForm.longitude ? parseFloat(branchForm.longitude) : null,
        geofence_radius: parseInt(branchForm.geofence_radius) || 100
      };
      const res = await client.patch(`/branches/${activeBranchId}/`, payload);
      localStorage.setItem('branch_name', res.data.name);
      window.dispatchEvent(new Event('branchUpdate'));
      addToast('Branch coordinates and boundary limits updated.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save branch parameters.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAlertsSave = (e) => {
    e.preventDefault();
    addToast('Operational alert thresholds updated.', 'success');
  };

  const handleApiSave = (e) => {
    e.preventDefault();
    addToast('Google Places API integration key updated.', 'success');
  };

  const handleBrandingSave = (e) => {
    e.preventDefault();
    localStorage.setItem('restaurant_name', restaurantNameInput);
    window.dispatchEvent(new Event('restaurantNameUpdate'));
    addToast('Restaurant branding name updated successfully!', 'success');
  };

  const handleThemeToggle = (mode) => {
    setThemeMode(mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    addToast(`Switched theme mode to ${mode.toUpperCase()}.`, 'info');
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-app-24 animate-fade-in relative min-h-[85vh] text-text-secondary"
    >
      {/* 1. EXECUTIVE SETTINGS HEADER */}
      <motion.div variants={itemVariants}>
        <GlassCard className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-app-20 border-app-primary/20 shadow-[0_4px_24px_rgba(99,102,241,0.06)]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-primary/10 text-app-primary border border-app-primary/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                <SettingsIcon size={12} className="text-app-primary animate-spin-slow" />
                Enterprise Config active
              </span>
              <Badge status="success">System Version: v2.4.1-AI</Badge>
              <Badge status="info">Backup Status: Automated daily</Badge>
            </div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Enterprise Control Center
            </h1>
            <p className="text-xs text-text-secondary font-medium">
              Configure geofence coordinates boundary, setup operational threshold alerts, and integrate Google Places credentials.
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Grid forms settings layout */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-app-24">
        
        <div className="space-y-app-24">
          {/* Branch Directory / Management Card */}
          <AppCard className="space-y-5">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-app-md bg-app-primary/10 text-app-primary flex items-center justify-center border border-app-primary/15">
                  <Globe size={16} />
                </span>
                <div>
                  <h2 className="text-text-primary text-xs font-bold uppercase tracking-wider">Enterprise Branch Directory</h2>
                  <p className="text-[10px] text-text-muted font-semibold mt-0.5">Manage physical locations and default settings</p>
                </div>
              </div>
              
              <PrimaryButton 
                onClick={() => {
                  setEditingBranch(null);
                  setManageBranchForm({
                    name: '',
                    branch_code: '',
                    latitude: '',
                    longitude: '',
                    geofence_radius: '100',
                    address: '',
                    is_active: true
                  });
                  setBranchModalOpen(true);
                }}
                icon={Plus}
                className="h-8 text-[10px] font-bold px-3"
              >
                Add Branch
              </PrimaryButton>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {branches.map(b => (
                <div key={b.id} className="bg-app-bg border border-app-border rounded-app-xl p-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-text-primary">{b.name}</h4>
                      {b.is_default && <Badge status="success">DEFAULT</Badge>}
                      {!b.is_active && <Badge status="default">INACTIVE</Badge>}
                    </div>
                    <p className="text-[10px] text-text-muted">Code: {b.branch_code} | Radius: {b.geofence_radius}m</p>
                    <p className="text-[9px] text-text-muted">{b.address}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!b.is_default && (
                      <SecondaryButton 
                        onClick={() => handleSetDefaultBranch(b)}
                        className="px-2 py-1 text-[9px] h-7 font-bold"
                      >
                        Set Default
                      </SecondaryButton>
                    )}
                    <button
                      onClick={() => {
                        setEditingBranch(b);
                        setManageBranchForm({
                          name: b.name || '',
                          branch_code: b.branch_code || '',
                          latitude: b.latitude || '',
                          longitude: b.longitude || '',
                          geofence_radius: String(b.geofence_radius || 100),
                          address: b.address || '',
                          is_active: !!b.is_active
                        });
                        setBranchModalOpen(true);
                      }}
                      className="text-text-muted hover:text-app-primary transition-colors p-1"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(b.id)}
                      className="text-text-muted hover:text-app-danger transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AppCard>

          {/* Branch Geofencing settings */}
          <AppCard className="space-y-5">
          <div className="flex items-center gap-2.5 border-b border-app-border pb-3">
            <span className="w-9 h-9 rounded-app-md bg-app-primary/10 text-app-primary flex items-center justify-center border border-app-primary/15">
              <MapPin size={16} />
            </span>
            <div>
              <h2 className="text-text-primary text-xs font-bold uppercase tracking-wider">Branch Geofence Coordinates</h2>
              <p className="text-[10px] text-text-muted font-semibold mt-0.5">Define clock-in perimeter guidelines</p>
            </div>
          </div>

          <form onSubmit={handleBranchSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Branch Name"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                required
              />
              <Input
                label="Geofence Radius (meters)"
                type="number"
                value={branchForm.geofence_radius}
                onChange={(e) => setBranchForm({ ...branchForm, geofence_radius: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Latitude"
                value={branchForm.latitude}
                onChange={(e) => setBranchForm({ ...branchForm, latitude: e.target.value })}
              />
              <Input
                label="Longitude"
                value={branchForm.longitude}
                onChange={(e) => setBranchForm({ ...branchForm, longitude: e.target.value })}
              />
            </div>

            <Textarea
              label="Address location"
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              rows={2}
            />

            <div className="flex justify-end pt-2">
              <PrimaryButton type="submit" icon={Save} className="shadow-app-md">
                Save Coordinates
              </PrimaryButton>
            </div>
          </form>
        </AppCard>
        </div>

        {/* Alerts & Integrations (Right Panel) */}
        <div className="space-y-app-24">
          
          {/* Alerts thresholds form */}
          <AppCard className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-app-border pb-3">
              <span className="w-9 h-9 rounded-app-md bg-app-warning/10 text-app-warning flex items-center justify-center border border-app-warning/15">
                <Bell size={16} />
              </span>
              <div>
                <h2 className="text-text-primary text-xs font-bold uppercase tracking-wider">Alert & Alarm Parameters</h2>
                <p className="text-[10px] text-text-muted font-semibold mt-0.5">Threshold limits for trigger notifications</p>
              </div>
            </div>

            <form onSubmit={handleAlertsSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Burnout Limit (%)"
                  type="number"
                  value={alertForm.burnout_threshold}
                  onChange={(e) => setAlertForm({ ...alertForm, burnout_threshold: e.target.value })}
                  required
                />
                <Input
                  label="Reorder Limit (kg)"
                  type="number"
                  value={alertForm.reorder_threshold}
                  onChange={(e) => setAlertForm({ ...alertForm, reorder_threshold: e.target.value })}
                  required
                />
                <Input
                  label="Rating Alert (★)"
                  type="number"
                  value={alertForm.rating_alert_threshold}
                  onChange={(e) => setAlertForm({ ...alertForm, rating_alert_threshold: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <PrimaryButton type="submit" icon={Save} className="shadow-app-md">
                  Save Thresholds
                </PrimaryButton>
              </div>
            </form>
          </AppCard>

          {/* Third party keys integrations */}
          <AppCard className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-app-border pb-3">
              <span className="w-9 h-9 rounded-app-md bg-app-danger/10 text-app-danger flex items-center justify-center border border-app-danger/15">
                <Globe size={16} />
              </span>
              <div>
                <h2 className="text-text-primary text-xs font-bold uppercase tracking-wider">Third-Party Key Registries</h2>
                <p className="text-[10px] text-text-muted font-semibold mt-0.5">Mock external server aggregations</p>
              </div>
            </div>

            <form onSubmit={handleApiSave} className="space-y-4">
              <div className="relative">
                <Input
                  label="Google Places API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3.5 top-8 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <PrimaryButton type="submit" icon={Save} className="shadow-app-md">
                  Update Keys
                </PrimaryButton>
              </div>
            </form>
          </AppCard>

          {/* Theme customizer configuration */}
          <AppCard className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-app-border pb-3">
              <span className="w-9 h-9 rounded-app-md bg-app-primary/10 text-app-primary flex items-center justify-center border border-app-primary/15">
                <Palette size={16} />
              </span>
              <div>
                <h2 className="text-text-primary text-xs font-bold uppercase tracking-wider">Interface Styling Theme</h2>
                <p className="text-[10px] text-text-muted font-semibold mt-0.5">Toggle light or dark modes layout settings</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleThemeToggle('light')}
                className={`flex-1 py-3 px-4 border rounded-app-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${ themeMode === 'light' ? 'bg-white text-slate-900 border-app-primary shadow-app-md' : 'bg-app-elevated border-app-border text-text-muted hover:text-text-primary' }`}
              >
                🌞 Light Mode
              </button>
              <button
                type="button"
                onClick={() => handleThemeToggle('dark')}
                className={`flex-1 py-3 px-4 border rounded-app-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${ themeMode === 'dark' ? 'bg-slate-900 text-white border-app-primary shadow-app-md' : 'bg-app-elevated border-app-border text-text-muted hover:text-text-primary' }`}
              >
                🌙 Dark Mode
              </button>
            </div>
          </AppCard>

          {/* Restaurant Branding configuration */}
          <AppCard className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-app-border pb-3">
              <span className="w-9 h-9 rounded-app-md bg-app-primary/10 text-app-primary flex items-center justify-center border border-app-primary/15">
                <Sparkles size={16} />
              </span>
              <div>
                <h2 className="text-text-primary text-xs font-bold uppercase tracking-wider">Restaurant Branding</h2>
                <p className="text-[10px] text-text-muted font-semibold mt-0.5">Customize your restaurant brand name displayed at the top header</p>
              </div>
            </div>

            <form onSubmit={handleBrandingSave} className="space-y-4">
              <Input
                label="Restaurant/Brand Name"
                value={restaurantNameInput}
                onChange={(e) => setRestaurantNameInput(e.target.value)}
                placeholder="e.g. Gusteau's Kitchen"
                required
              />
              <div className="flex justify-end pt-2">
                <PrimaryButton type="submit" className="shadow-app-md">
                  <Save size={14} className="mr-1.5" />
                  Save Branding Name
                </PrimaryButton>
              </div>
            </form>
          </AppCard>

        </div>

      </motion.div>

      {/* BRANCH ADD/EDIT MODAL */}
      <Modal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        title={editingBranch ? 'Edit Physical Branch details' : 'Register New Branch Location'}
      >
        <form onSubmit={handleCreateOrEditBranch} className="space-y-4">
          <Input
            label="Branch Name"
            value={manageBranchForm.name}
            onChange={(e) => setManageBranchForm({ ...manageBranchForm, name: e.target.value })}
            placeholder="e.g. Indiranagar branch"
            required
          />
          <Input
            label="Branch Code Slug (Unique)"
            value={manageBranchForm.branch_code}
            onChange={(e) => setManageBranchForm({ ...manageBranchForm, branch_code: e.target.value })}
            placeholder="e.g. indiranagar-branch"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              value={manageBranchForm.latitude}
              onChange={(e) => setManageBranchForm({ ...manageBranchForm, latitude: e.target.value })}
              placeholder="e.g. 12.9715"
            />
            <Input
              label="Longitude"
              value={manageBranchForm.longitude}
              onChange={(e) => setManageBranchForm({ ...manageBranchForm, longitude: e.target.value })}
              placeholder="e.g. 77.5945"
            />
          </div>
          <Input
            label="Geofence Radius (meters)"
            type="number"
            value={manageBranchForm.geofence_radius}
            onChange={(e) => setManageBranchForm({ ...manageBranchForm, geofence_radius: e.target.value })}
            required
          />
          <Textarea
            label="Physical Address Location"
            value={manageBranchForm.address}
            onChange={(e) => setManageBranchForm({ ...manageBranchForm, address: e.target.value })}
            placeholder="Complete address line..."
            rows={2}
          />
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active_branch"
              checked={manageBranchForm.is_active}
              onChange={(e) => setManageBranchForm({ ...manageBranchForm, is_active: e.target.checked })}
              className="rounded border-app-border text-app-primary bg-app-bg focus:ring-0 w-4 h-4"
            />
            <label htmlFor="is_active_branch" className="text-xs font-bold text-text-primary select-none">
              Mark Branch Active for Bookings
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
            <SecondaryButton onClick={() => setBranchModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="shadow-app-md">
              Save Branch
            </PrimaryButton>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
};

export default Settings;
