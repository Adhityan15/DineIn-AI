import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Users, Clock, Compass, Phone, User, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import {
  GlassCard,
  PrimaryButton,
  Input,
  Select,
  Textarea
} from '../components/DesignSystem';

const PublicReservation = () => {
  const { addToast } = useToast();
  
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    branch: '',
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    party_size: 2,
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    notes: '',
    is_vip: false
  });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await client.get('/branches/');
        // Resolve response formats dynamically
        const list = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.results || []);
        setBranches(list);
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, branch: list[0].id }));
        }
      } catch (err) {
        addToast('Failed to load restaurant locations.', 'error');
      }
    };
    fetchBranches();
  }, [addToast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const errs = {};
    if (!formData.branch) errs.branch = 'Branch location is required';
    if (!formData.guest_name.trim()) errs.guest_name = 'Name is required';
    if (!formData.guest_phone.trim()) errs.guest_phone = 'Phone number is required';
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.time) errs.time = 'Time is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      addToast('Please fill all required fields.', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Combine date and time to ISO format start_time
      const start_time = `${formData.date}T${formData.time}:00`;
      
      const payload = {
        branch: formData.branch,
        guest_name: formData.guest_name,
        guest_phone: formData.guest_phone,
        guest_email: formData.guest_email || undefined,
        party_size: parseInt(formData.party_size, 10),
        start_time,
        notes: formData.notes,
        status: 'pending' // Online bookings start as pending manager review
      };

      const response = await client.post('/reservation/bookings/', payload);
      if (response.data?.success) {
        setSuccess(true);
        addToast('Reservation requested successfully!', 'success');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit reservation booking.';
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedBranchName = branches.find(b => b.id === formData.branch)?.name || 'Restaurant';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-md w-full space-y-8 z-10">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <CalendarDays size={24} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Reserve a Table
          </h2>
          <p className="mt-2 text-center text-xs text-slate-400 font-medium">
            Book a dining experience at any of our premier locations
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="booking-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard className="p-8 border border-white/5 bg-slate-900/60 backdrop-blur-xl rounded-3xl space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Select
                    label="Choose Location"
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    error={errors.branch}
                    options={[
                      { value: '', label: 'Select Location' },
                      ...branches.map(b => ({ value: b.id, label: b.name }))
                    ]}
                  />

                  <Input
                    label="Full Name"
                    id="guest_name"
                    name="guest_name"
                    value={formData.guest_name}
                    onChange={handleChange}
                    error={errors.guest_name}
                    placeholder="e.g. John Doe"
                    icon={User}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      id="guest_phone"
                      name="guest_phone"
                      value={formData.guest_phone}
                      onChange={handleChange}
                      error={errors.guest_phone}
                      placeholder="e.g. +91 98765 43210"
                      icon={Phone}
                    />
                    <Input
                      label="Guests Count"
                      id="party_size"
                      name="party_size"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.party_size}
                      onChange={handleChange}
                      icon={Users}
                    />
                  </div>

                  <Input
                    label="Email Address (Optional)"
                    id="guest_email"
                    name="guest_email"
                    type="email"
                    value={formData.guest_email}
                    onChange={handleChange}
                    placeholder="e.g. john@example.com"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Preferred Date"
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      error={errors.date}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                      label="Preferred Time"
                      id="time"
                      name="time"
                      type="time"
                      value={formData.time}
                      onChange={handleChange}
                      error={errors.time}
                    />
                  </div>

                  <Textarea
                    label="Special Notes or Requests"
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="e.g. Quiet table, wheelchair access, food allergies..."
                  />

                  <PrimaryButton
                    type="submit"
                    loading={loading}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-indigo-900/30 text-xs font-bold"
                  >
                    Confirm Table Request
                  </PrimaryButton>
                </form>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="booking-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <GlassCard className="p-8 border border-white/5 bg-slate-900/60 backdrop-blur-xl rounded-3xl space-y-6 flex flex-col items-center">
                <span className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-2 animate-bounce">
                  <CheckCircle size={32} />
                </span>
                
                <div className="space-y-2">
                  <h3 className="text-white text-lg font-bold">Request Received</h3>
                  <p className="text-xs text-slate-400 font-semibold px-4 leading-normal">
                    We've received your booking request for <strong>{formData.party_size} guests</strong> at <strong>{selectedBranchName}</strong>.
                  </p>
                </div>

                <div className="w-full bg-slate-950/40 border border-white/5 p-4 rounded-2xl text-left text-slate-300 text-[11px] leading-relaxed space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Preferred Date:</span>
                    <span className="font-bold text-white">{formData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Preferred Time:</span>
                    <span className="font-bold text-white">{formData.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Guest Contact:</span>
                    <span className="font-bold text-white">{formData.guest_phone}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  A verification confirmation alert will be sent once the manager accepts.
                </p>

                <PrimaryButton
                  onClick={() => {
                    setSuccess(false);
                    setFormData({
                      branch: branches[0]?.id || '',
                      guest_name: '',
                      guest_phone: '',
                      guest_email: '',
                      party_size: 2,
                      date: new Date().toISOString().split('T')[0],
                      time: '19:00',
                      notes: '',
                      is_vip: false
                    });
                  }}
                  className="w-full h-10 mt-2 text-xs font-bold"
                >
                  Book Another Table
                </PrimaryButton>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PublicReservation;
