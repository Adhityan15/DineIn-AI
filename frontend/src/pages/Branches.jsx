import React, { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { 
  Plus, 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  BadgePercent, 
  User, 
  Trash2, 
  Edit2, 
  Compass, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  AppCard, 
  GlassCard, 
  PrimaryButton, 
  SecondaryButton, 
  Input, 
  Select, 
  Drawer, 
  Badge 
} from '../components/DesignSystem';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    branch_code: '',
    address: '',
    contact_number: '',
    gst_number: '',
    tax_percentage: 18.00,
    business_hours: '09:00 AM - 11:00 PM',
    kitchen_type: 'Dine-in & Takeaway',
    delivery_radius: 5,
    is_cloud_kitchen: false,
    is_active: true,
    branch_manager: ''
  });

  const { addToast } = useToast();

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/branches/');
      const branchesList = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.data || []);
      setBranches(branchesList);
      
      const empRes = await client.get('/users/');
      const usersList = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.results || empRes.data?.data || []);
      const managers = usersList.filter(u => u.role === 'manager' || u.role === 'owner' || u.role === 'admin');
      setEmployees(managers);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to load branches data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      branch_code: '',
      address: '',
      contact_number: '',
      gst_number: '',
      tax_percentage: 18.00,
      business_hours: '09:00 AM - 11:00 PM',
      kitchen_type: 'Dine-in & Takeaway',
      delivery_radius: 5,
      is_cloud_kitchen: false,
      is_active: true,
      branch_manager: ''
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      branch_code: branch.branch_code,
      address: branch.address,
      contact_number: branch.contact_number || '',
      gst_number: branch.gst_number || '',
      tax_percentage: branch.tax_percentage || 18.00,
      business_hours: branch.business_hours || '09:00 AM - 11:00 PM',
      kitchen_type: branch.kitchen_type || 'Dine-in & Takeaway',
      delivery_radius: branch.delivery_radius || 5,
      is_cloud_kitchen: branch.is_cloud_kitchen || false,
      is_active: branch.is_active,
      branch_manager: branch.branch_manager || ''
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.branch_manager) delete payload.branch_manager;
      
      let res;
      if (editingBranch) {
        res = await client.put(`/branches/${editingBranch.id}/`, payload);
      } else {
        res = await client.post('/branches/', payload);
      }
      
      if (res.data?.success || res.status === 200 || res.status === 201) {
        addToast(editingBranch ? 'Branch configurations updated.' : 'Branch created successfully.', 'success');
        setDrawerOpen(false);
        fetchBranches();
        window.dispatchEvent(new Event('branchUpdate'));
      }
    } catch (err) {
      console.error(err);
      let errMsg = 'Error saving branch details.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errMsg = err.response.data;
        } else if (typeof err.response.data === 'object') {
          errMsg = Object.entries(err.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
        }
      }
      addToast(errMsg, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch? All linked operational tables, menu transactions, and bookings will be permanently archived.')) return;
    try {
      await client.delete(`/branches/${id}/`);
      addToast('Branch removed successfully.', 'success');
      fetchBranches();
      window.dispatchEvent(new Event('branchUpdate'));
    } catch (err) {
      console.error(err);
      addToast('Error removing branch.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-app-primary/20">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
            <Building2 className="text-app-primary" />
            Enterprise Branch Control
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Configure multi-location GST configurations, managers allocation, contact numbers, and delivery metrics.
          </p>
        </div>
        <PrimaryButton onClick={handleOpenCreate} icon={Plus}>
          Add New Branch
        </PrimaryButton>
      </GlassCard>

      {branches.length === 0 ? (
        <AppCard className="text-center py-12 space-y-3">
          <AlertCircle className="mx-auto text-text-muted" size={40} />
          <p className="text-sm font-bold text-text-secondary">No Branches Found</p>
          <p className="text-xs text-text-muted">Register a location to start isolation nodes.</p>
        </AppCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map(branch => (
            <AppCard key={branch.id} className="relative flex flex-col justify-between overflow-hidden border border-app-border">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-extrabold text-sm text-text-primary">{branch.name}</h2>
                    <span className="text-[10px] text-text-muted uppercase font-black tracking-wider">CODE: {branch.branch_code}</span>
                  </div>
                  <Badge variant={branch.is_active ? 'success' : 'danger'}>
                    {branch.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs font-semibold text-text-secondary">
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-app-primary" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-app-primary" />
                    <span>{branch.contact_number || '--'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-app-primary" />
                    <span>{branch.business_hours || '--'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgePercent size={13} className="text-app-primary" />
                    <span>GST: {branch.gst_number || '--'} ({branch.tax_percentage}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-app-primary" />
                    <span>Manager: {branch.manager_name || 'Not Configured'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Compass size={13} className="text-app-primary" />
                    <span>Delivery Range: {branch.delivery_radius} KM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={13} className="text-app-primary" />
                    <span>Type: {branch.kitchen_type}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-app-border pt-4">
                <SecondaryButton 
                  onClick={() => handleOpenEdit(branch)} 
                  icon={Edit2}
                  className="px-3 py-1.5 text-[10px]"
                >
                  Edit
                </SecondaryButton>
                <SecondaryButton 
                  onClick={() => handleDelete(branch.id)} 
                  icon={Trash2}
                  className="px-3 py-1.5 text-[10px] text-app-danger hover:bg-app-danger/5 hover:border-app-danger/30"
                >
                  Delete
                </SecondaryButton>
              </div>
            </AppCard>
          ))}
        </div>
      )}

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingBranch ? 'Update Location Config' : 'Register Location Node'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Branch Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
            />
            <Input
              label="Branch Slug Code"
              name="branch_code"
              value={formData.branch_code}
              onChange={handleFormChange}
              placeholder="e.g. downtown-express"
              required
            />
          </div>

          <Input
            label="Street Address"
            name="address"
            value={formData.address}
            onChange={handleFormChange}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleFormChange}
            />
            <Input
              label="GST Registration ID"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleFormChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tax Percentage (%)"
              name="tax_percentage"
              type="number"
              step="0.01"
              value={formData.tax_percentage}
              onChange={handleFormChange}
            />
            <Select
              label="Branch Manager"
              name="branch_manager"
              value={formData.branch_manager}
              onChange={handleFormChange}
            >
              <option value="">Select Manager</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.user}>
                  {emp.name} ({emp.designation_name})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Operating Hours"
              name="business_hours"
              value={formData.business_hours}
              onChange={handleFormChange}
              placeholder="e.g. 09:00 AM - 11:00 PM"
            />
            <Input
              label="Kitchen Type / Mode"
              name="kitchen_type"
              value={formData.kitchen_type}
              onChange={handleFormChange}
              placeholder="e.g. Fine Dining, Buffet"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Delivery Range Radius (KM)"
              name="delivery_radius"
              type="number"
              value={formData.delivery_radius}
              onChange={handleFormChange}
            />
            <div className="flex flex-col justify-end pb-1.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-text-secondary select-none">
                <input
                  type="checkbox"
                  name="is_cloud_kitchen"
                  checked={formData.is_cloud_kitchen}
                  onChange={handleFormChange}
                  className="rounded border-app-border text-app-primary focus:ring-app-primary/10"
                />
                Is Cloud Kitchen Node
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-text-secondary select-none">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleFormChange}
              className="rounded border-app-border text-app-primary focus:ring-app-primary/10"
            />
            Location Node Operational (Active)
          </div>

          <PrimaryButton type="submit" className="w-full mt-4">
            {editingBranch ? 'Save Branch Changes' : 'Register Location Node'}
          </PrimaryButton>
        </form>
      </Drawer>
    </div>
  );
}
