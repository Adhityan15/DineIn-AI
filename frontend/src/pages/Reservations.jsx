import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, 
  Users, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Edit, 
  AlertCircle, 
  Phone, 
  Sparkles, 
  Plus, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  SlidersHorizontal, 
  AlertTriangle, 
  Coffee, 
  Compass,
  Check,
  ChevronDown,
  User,
  Activity,
  UserCheck,
  CalendarRange,
  QrCode,
  History,
  BarChart3,
  ShieldAlert,
  ArrowRight,
  UserX,
  FileText
} from 'lucide-react';

import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  AppCard,
  GlassCard,
  SectionCard,
  ChartCard,
  KPICard,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  AnimatedCounter,
  Badge,
  LoadingOverlay,
  Input,
  FloatingInput,
  Select,
  Textarea,
  Switch,
  Modal,
  Drawer,
  EmptyState
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

const Reservations = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  
  // State variables
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Navigation & Tabs state
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('floor'); // 'floor', 'timeline', 'list', 'waitlist', 'analytics'
  
  const formatTimeSafe = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'});
    } catch (e) {
      return 'N/A';
    }
  };

  useEffect(() => {
    if (tabParam && ['floor', 'timeline', 'list', 'waitlist', 'analytics', 'walkins'].includes(tabParam)) {
      if (tabParam === 'walkins') {
        setActiveTab('list');
        setStatusFilter('walk_in'); // pre-filter to show walkins
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Filtering & Sorting (List View)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected details
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Guest, 2: Details, 3: Tables, 4: Confirm
  const [bookingType, setBookingType] = useState('walk_in'); // 'walk_in' or 'advance'
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  
  // Layout editor & Zoom States
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState(null);
  const [zoom, setZoom] = useState(1);
  
  // Action Modals & Inputs
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('change_of_plans');
  const [cancelCustomReason, setCancelCustomReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
  const [noShowReason, setNoShowReason] = useState('');
  
  // QR Scan Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrScanInput, setQrScanInput] = useState('');
  const [qrShowModalOpen, setQrShowModalOpen] = useState(false);
  const [qrBooking, setQrBooking] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Form States (Booking Form)
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    party_size: 2,
    start_time: '',
    notes: '',
    is_walk_in: false,
    is_birthday: false,
    is_anniversary: false,
    is_vip: false,
    needs_wheelchair: false,
    needs_baby_chair: false,
    allergy_notes: '',
    special_requests: '',
    preferred_table_id: '',
    status: 'pending' // default to pending for customer
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form States (Waitlist Form)
  const [waitlistFormData, setWaitlistFormData] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    party_size: 2
  });

  // AI recommendations state
  const [aiSuggestions, setAiSuggestions] = useState(null);

  // Fetch core datasets
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tablesRes, bookingsRes, waitlistRes] = await Promise.all([
        client.get('/reservation/tables/', { params: { branch: localStorage.getItem('branch_id') || user?.branch || '' } }),
        client.get('/reservation/bookings/', { params: { start_date: selectedDate, branch: localStorage.getItem('branch_id') || user?.branch || '' } }),
        client.get('/reservation/waitlist/', { params: { branch: localStorage.getItem('branch_id') || user?.branch || '' } })
      ]);

      if (tablesRes.data?.success) {
        const freshTables = tablesRes.data.data;
        setTables(freshTables);
        if (selectedTable) {
          const freshTable = freshTables.find(t => t.id === selectedTable.id);
          setSelectedTable(freshTable || null);
        }
      }
      if (bookingsRes.data?.success) {
        const freshBookings = bookingsRes.data.data;
        setBookings(freshBookings);
        if (selectedBooking) {
          const freshBooking = freshBookings.find(b => b.id === selectedBooking.id);
          setSelectedBooking(freshBooking || null);
          if (!freshBooking) {
            setDrawerOpen(false);
          }
        }
      }
      if (waitlistRes.data?.success) setWaitlist(waitlistRes.data.data);
    } catch (err) {
      console.error('Error fetching reservations data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to sync live reservation data from server.');
      addToast('Failed to sync live reservation data from server.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, addToast]);

  const refreshWithSync = () => {
    fetchData();
    window.dispatchEvent(new Event('branchUpdate'));
  };

  useEffect(() => {
    refreshWithSync();
    window.addEventListener('branchUpdate', fetchData);
    const interval = setInterval(fetchData, 30000);
    return () => {
      window.removeEventListener('branchUpdate', fetchData);
      clearInterval(interval);
    };
  }, [fetchData]);

  // Fetch booking history logs when a booking details view is opened
  const fetchBookingHistory = async (bookingId) => {
    setHistoryLoading(true);
    try {
      const res = await client.get(`/reservation/bookings/${bookingId}/history/`);
      if (res.data?.success) {
        setBookingHistory(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching history logs:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Form field changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleWaitlistFormChange = (e) => {
    const { name, value } = e.target;
    setWaitlistFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Check Table Availability helper via API
  const checkAvailability = async () => {
    if (!formData.start_time || !formData.party_size) {
      addToast('Please input time and party size to evaluate availability.', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      const fullStartTime = `${selectedDate}T${formData.start_time}:00Z`;
      const response = await client.get('/reservation/availability/', {
        params: {
          branch: localStorage.getItem('branch_id') || user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5',
          start_time: fullStartTime,
          party_size: formData.party_size
        }
      });

      if (response.data?.success) {
        const availData = response.data.data;
        if (availData.is_available) {
          setAiSuggestions({
            isAvailable: true,
            recommendedTables: availData.tables,
            suggestedSlots: []
          });
          if (availData.tables.length > 0) {
            setFormData(prev => ({ ...prev, preferred_table_id: availData.tables[0].id }));
          }
          addToast('Matching tables are available!', 'success');
          setBookingStep(3); 
        } else {
          setAiSuggestions({
            isAvailable: false,
            recommendedTables: [],
            suggestedSlots: availData.suggested_slots
          });
          addToast('Time slot conflict! Review alternative AI slot suggestions.', 'error');
          setBookingStep(3);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error checking availability.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit new booking
  const handleBookingSubmit = async () => {
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        branch: localStorage.getItem('branch_id') || user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5',
        start_time: `${selectedDate}T${formData.start_time}:00Z`,
        status: user?.role === 'customer' ? 'pending' : 'confirmed'
      };

      const response = await client.post('/reservation/bookings/', payload);
      if (response.data?.success) {
        addToast(`Reservation logged successfully as ${payload.status.toUpperCase()}!`, 'success');
        setBookingModalOpen(false);
        setBookingStep(1);
        refreshWithSync();
        // Reset form
        setFormData({
          guest_name: '',
          guest_phone: '',
          guest_email: '',
          party_size: 2,
          start_time: '',
          notes: '',
          is_walk_in: false,
          is_birthday: false,
          is_anniversary: false,
          is_vip: false,
          needs_wheelchair: false,
          needs_baby_chair: false,
          allergy_notes: '',
          special_requests: '',
          preferred_table_id: '',
          status: 'pending'
        });
        setAiSuggestions(null);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit reservation details.';
      addToast(errMsg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleQuickWalkInSubmit = async () => {
    if (!formData.preferred_table_id) {
      addToast('Please select a table to seat the customer.', 'warning');
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        branch: localStorage.getItem('branch_id') || user?.branch || '',
        table: formData.preferred_table_id,
        party_size: formData.party_size,
        guest_name: formData.guest_name.trim() || 'Walk-In Customer',
        guest_phone: formData.guest_phone.trim() || '+910000000000'
      };
      const response = await client.post('/reservation/bookings/quick-walk-in/', payload);
      if (response.data?.success) {
        addToast('Quick walk-in seated successfully! Opening POS...', 'success');
        setBookingModalOpen(false);
        refreshWithSync();
        // Reset form
        setFormData({
          guest_name: '',
          guest_phone: '',
          guest_email: '',
          party_size: 2,
          start_time: '',
          notes: '',
          is_walk_in: false,
          is_birthday: false,
          is_anniversary: false,
          is_vip: false,
          needs_wheelchair: false,
          needs_baby_chair: false,
          allergy_notes: '',
          special_requests: '',
          preferred_table_id: '',
          status: 'pending'
        });
        setBookingType('walk_in');
        // Open POS immediately!
        navigate('/dashboard/pos');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to seat quick walk-in guest.';
      addToast(errMsg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleMouseMove = (e) => {
    if (!isEditMode || !draggedTableId) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    
    // Scale coordinate according to svg viewbox 600x500 and zoom level
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 600);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 500);
    
    // Clamp to layout map boundaries
    const clampedX = Math.max(40, Math.min(560, x));
    const clampedY = Math.max(40, Math.min(460, y));

    setTables(prev => (Array.isArray(prev) ? prev : []).map(t => 
      t.id === draggedTableId ? { ...t, x_coord: clampedX, y_coord: clampedY } : t
    ));
  };

  const handleSaveLayout = async () => {
    setLoading(true);
    try {
      await Promise.all((Array.isArray(tables) ? tables : []).map(t => 
        client.patch(`/reservation/tables/${t.id}/`, {
          x_coord: t.x_coord,
          y_coord: t.y_coord
        })
      ));
      addToast('Interactive floor map layout saved successfully!', 'success');
      setIsEditMode(false);
      refreshWithSync();
    } catch (err) {
      addToast('Failed to save updated table layout coordinates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Approve Reservation
  const handleApprove = async (bookingId) => {
    try {
      const res = await client.post(`/reservation/bookings/${bookingId}/approve/`, {
        reason: actionNotes
      });
      if (res.data?.success) {
        addToast('Reservation approved and confirmation email sent!', 'success');
        setActionNotes('');
        refreshWithSync();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(res.data.data);
          fetchBookingHistory(bookingId);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Approval failed.', 'error');
    }
  };

  // Reject Reservation
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      addToast('Please provide a rejection reason.', 'warning');
      return;
    }
    try {
      const res = await client.post(`/reservation/bookings/${selectedBooking.id}/reject/`, {
        reason: rejectReason
      });
      if (res.data?.success) {
        addToast('Reservation rejected and tables released.', 'info');
        setRejectModalOpen(false);
        setRejectReason('');
        refreshWithSync();
        setDrawerOpen(false);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Rejection failed.', 'error');
    }
  };

  // Check-in (Host clicks checked-in)
  const handleCheckIn = async (bookingId) => {
    try {
      const res = await client.post(`/reservation/bookings/${bookingId}/check-in/`);
      if (res.data?.success) {
        addToast('Guest marked as Checked In!', 'success');
        refreshWithSync();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(res.data.data);
          fetchBookingHistory(bookingId);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Check-in failed.', 'error');
    }
  };

  // Seating guest at table (occupying layout)
  const handleSeat = async (bookingId) => {
    try {
      const res = await client.post(`/reservation/bookings/${bookingId}/seat/`);
      if (res.data?.success) {
        addToast('Guest seated successfully! Assigned table is now occupied.', 'success');
        refreshWithSync();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(res.data.data);
          fetchBookingHistory(bookingId);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Seating failed.', 'error');
    }
  };

  const handleStartDining = async (bookingId) => {
    try {
      const res = await client.post(`/reservation/bookings/${bookingId}/start-dining/`);
      if (res.data?.success) {
        addToast('Dining session started successfully!', 'success');
        refreshWithSync();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(res.data.data);
          fetchBookingHistory(bookingId);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to start dining.', 'error');
    }
  };

  const handleRequestCheckout = async (bookingId) => {
    try {
      const res = await client.post(`/reservation/bookings/${bookingId}/request-checkout/`);
      if (res.data?.success) {
        addToast('Checkout request registered.', 'info');
        refreshWithSync();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(res.data.data);
          fetchBookingHistory(bookingId);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to request checkout.', 'error');
    }
  };

  const handleArchive = async (bookingId) => {
    addToast('Reservation archived from active view.', 'success');
    refreshWithSync();
    setDrawerOpen(false);
  };

  // Check-out / Completed
  const handleCheckOut = async (bookingId) => {
    try {
      const res = await client.post(`/reservation/bookings/${bookingId}/check-out/`);
      if (res.data?.success) {
        addToast('Guest checked out. Table released successfully.', 'success');
        refreshWithSync();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(res.data.data);
          fetchBookingHistory(bookingId);
        }
        setDrawerOpen(false);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Check-out failed.', 'error');
    }
  };

  // Mark No Show
  const handleNoShow = async () => {
    try {
      const res = await client.post(`/reservation/bookings/${selectedBooking.id}/no-show/`, {
        reason: noShowReason
      });
      if (res.data?.success) {
        addToast('Guest marked as No Show and tables released.', 'info');
        setNoShowModalOpen(false);
        setNoShowReason('');
        refreshWithSync();
        setDrawerOpen(false);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Operation failed.', 'error');
    }
  };

  // Cancel Reservation Action
  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    const finalReason = cancelReason === 'other' ? cancelCustomReason : cancelReason.replace(/_/g, ' ');
    try {
      const res = await client.post(`/reservation/bookings/${selectedBooking.id}/cancel/`, {
        reason: finalReason
      });
      if (res.data?.success) {
        addToast('Reservation cancelled successfully.', 'info');
        setCancelModalOpen(false);
        setCancelCustomReason('');
        refreshWithSync();
        setDrawerOpen(false);
      }
    } catch (err) {
      addToast('Cancel request failed.', 'error');
    }
  };

  // QR Scanning Simulation Action
  const triggerQRScan = async () => {
    if (!qrScanInput.trim()) {
      addToast('Please enter a booking ID or search term to scan.', 'warning');
      return;
    }
    setScanning(true);
    setScanSuccess(false);
    
    // Simulate camera lock-on delay
    setTimeout(async () => {
      try {
        const response = await client.post('/reservation/bookings/qr-check-in/', {
          reservation_id: qrScanInput
        });
        if (response.data?.success) {
          setScanSuccess(true);
          addToast('QR scan match! Checked-in and seated successfully!', 'success');
          refreshWithSync();
          setTimeout(() => {
            setQrModalOpen(false);
            setQrScanInput('');
            setScanning(false);
            setScanSuccess(false);
          }, 1500);
        }
      } catch (err) {
        addToast(err.response?.data?.message || 'Invalid QR code scan payload.', 'error');
        setScanning(false);
      }
    }, 1200);
  };

  // Waitlist Form submit
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistFormData.guest_name.trim() || !waitlistFormData.guest_phone.trim()) {
      addToast('Name and phone are required for waitlist registry.', 'warning');
      return;
    }

    try {
      const response = await client.post('/reservation/waitlist/join/', {
        ...waitlistFormData,
        branch: localStorage.getItem('branch_id') || user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5'
      });

      if (response.data?.success) {
        addToast('Walk-in added to waitlist queue.', 'success');
        setWaitlistModalOpen(false);
        setWaitlistFormData({ guest_name: '', guest_phone: '', guest_email: '', party_size: 2 });
        refreshWithSync();
      }
    } catch (err) {
      addToast('Failed to join waitlist.', 'error');
    }
  };

  // Waitlist Actions
  const handleNotifyWaitlist = async (id) => {
    try {
      const res = await client.post(`/reservation/waitlist/${id}/notify/`);
      if (res.data?.success) {
        addToast('Notification dispatched to walk-in guest!', 'success');
        refreshWithSync();
      }
    } catch (err) {
      addToast('Failed to notify waitlist guest.', 'error');
    }
  };

  const handlePromoteWaitlist = async (id, tableIds) => {
    try {
      const res = await client.post(`/reservation/waitlist/${id}/promote/`, { tables: tableIds });
      if (res.data?.success) {
        addToast('Waitlist guest successfully seated!', 'success');
        refreshWithSync();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to seat waitlist guest.', 'error');
    }
  };

  const handleCancelWaitlist = async (id) => {
    try {
      await client.post(`/reservation/waitlist/${id}/cancel/`);
      addToast('Waitlist entry cancelled.', 'info');
      refreshWithSync();
    } catch (err) {
      addToast('Failed to cancel waitlist entry.', 'error');
    }
  };

  // Search & Filtered Bookings for List Table
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.guest_phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' ? true : b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Client Side Paging Mappings
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Compute KPI Stats Grid
  const kpiStats = {
    totalReservations: bookings.length,
    pendingCount: bookings.filter(b => b.status === 'pending').length,
    activeSeated: bookings.filter(b => b.status === 'seated').length,
    availableTables: tables.filter(t => t.status === 'available').length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    waitlistCount: waitlist.filter(w => w.status === 'waiting' || w.status === 'notified').length,
    noShowCount: bookings.filter(b => b.status === 'no_show').length,
    cancellationsCount: bookings.filter(b => b.status === 'cancelled').length,
    avgWait: waitlist.length > 0 
      ? Math.round(waitlist.reduce((sum, item) => sum + item.estimated_wait_minutes, 0) / waitlist.length) 
      : 0
  };

  // Booking Success Rate and cancellations calculations
  const successRate = bookings.length > 0
    ? Math.round((bookings.filter(b => b.status === 'completed' || b.status === 'seated' || b.status === 'confirmed').length / bookings.length) * 100)
    : 100;

  const cancellationRate = bookings.length > 0
    ? Math.round((kpiStats.cancellationsCount / bookings.length) * 100)
    : 0;

  const noShowRate = bookings.length > 0
    ? Math.round((kpiStats.noShowCount / bookings.length) * 100)
    : 0;

  // Occupancy rate calculation
  const occupancyRate = tables.length > 0 
    ? Math.round((kpiStats.occupiedTables / tables.length) * 100) 
    : 0;

  const canEditLayout = user?.role === 'admin' || user?.role === 'owner';

  // Handle click on SVG table
  const handleTableClick = (tableObj) => {
    const activeBooking = bookings.find(b => 
      b.assigned_tables?.includes(tableObj.number) && 
      ['confirmed', 'seated', 'checked_in', 'pending', 'arrived', 'dining', 'checkout_requested'].includes(b.status)
    );
    
    setSelectedTable(tableObj);
    if (activeBooking) {
      setSelectedBooking(activeBooking);
      fetchBookingHistory(activeBooking.id);
    } else {
      setSelectedBooking(null);
      setBookingHistory([]);
    }
    setDrawerOpen(true);
  };

  // Colors mapping for statuses
  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'reminder_sent': return 'info';
      case 'checked_in': return 'info';
      case 'arrived': return 'warning';
      case 'seated': return 'info';
      case 'dining': return 'danger';
      case 'checkout_requested': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'default';
      case 'rejected': return 'default';
      case 'no_show': return 'danger';
      default: return 'default';
    }
  };

  const getTableColor = (statusVal) => {
    switch (statusVal) {
      case 'available': return 'var(--color-success)';
      case 'reserved': return 'var(--color-warning)';
      case 'occupied': return 'var(--color-danger)';
      case 'cleaning': return 'var(--color-primary)';
      case 'out_of_service':
      case 'maintenance': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-6 max-w-lg mx-auto text-text-primary">
          <h3 className="text-rose-500 font-bold text-lg mb-2">Database Sync Error</h3>
          <p className="text-text-secondary text-sm mb-4">{error}</p>
          <button 
            onClick={fetchData} 
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-app-24 animate-fade-in relative min-h-[85vh] text-text-secondary"
    >

      {/* 1. EXECUTIVE OPERATIONS HEADER */}
      <motion.div variants={itemVariants}>
        <GlassCard className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-app-20 border-app-primary/20 shadow-[0_4px_24px_rgba(99,102,241,0.06)]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-primary/10 text-app-primary border border-app-primary/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                <Compass size={12} className="animate-spin duration-3000" />
                Live Seating Control
              </span>
              <Badge status="success">Occupancy Rate: {occupancyRate}%</Badge>
              {kpiStats.pendingCount > 0 && (
                <Badge status="warning">{kpiStats.pendingCount} Pending Approvals</Badge>
              )}
            </div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Enterprise Reservation Manager
            </h1>
            <p className="text-xs text-text-secondary font-medium">
              Real-time guest lifecycle management, table conflicts overrides, notifications auditing, and QR checking.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Simulated QR Code Scanning trigger */}
            <SecondaryButton 
              onClick={() => setQrModalOpen(true)} 
              icon={QrCode}
              className="border-app-primary/30 text-app-primary hover:bg-app-primary/5 text-xs font-bold"
            >
              Scan Guest QR Pass
            </SecondaryButton>

            <div className="bg-app-elevated flex items-center border border-app-border rounded-app-xl px-3 py-1.5 gap-2 text-xs">
              <button 
                onClick={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDate(prev.toISOString().split('T')[0]);
                }}
                className="text-text-muted hover:text-text-primary p-0.5 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-text-primary bg-transparent border-none outline-none font-bold text-center w-28 cursor-pointer focus:ring-0"
              />
              <button 
                onClick={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDate(next.toISOString().split('T')[0]);
                }}
                className="text-text-muted hover:text-text-primary p-0.5 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <SecondaryButton onClick={fetchData} icon={RefreshCw}>
              Refresh
            </SecondaryButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* 2. STATS OVERVIEW GRID */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-app-16">
        <KPICard title="Total Bookings" value={<AnimatedCounter value={kpiStats.totalReservations} />} description="Logged today" />
        <KPICard title="Pending Requests" value={<AnimatedCounter value={kpiStats.pendingCount} />} description="Need approval" />
        <KPICard title="Active Seated" value={<AnimatedCounter value={kpiStats.activeSeated} />} trend="up" description="Dining guest count" />
        <KPICard title="Available Tables" value={<AnimatedCounter value={kpiStats.availableTables} />} description="Clean & vacant" />
        <KPICard title="Waitlist Queue" value={<AnimatedCounter value={kpiStats.waitlistCount} />} description="Walk-ins in queue" />
        <KPICard title="Avg Wait" value={`${kpiStats.avgWait}m`} description="Estimated delay" />
        <KPICard title="No-Shows" value={<AnimatedCounter value={kpiStats.noShowCount} />} description="Guest failure rate" />
        <KPICard title="Success Rate" value={`${successRate}%`} trend="up" description="Completed / active" />
      </motion.div>

      {/* 3. TABS TOGGLE SYSTEM */}
      <motion.div variants={itemVariants} className="flex border-b border-app-border gap-2 overflow-x-auto pb-1">
        {[
          { id: 'floor', label: 'Interactive Floor Map', icon: Compass },
          { id: 'timeline', label: 'Timeline Roster', icon: Clock },
          { id: 'list', label: 'Booking Records Manager', icon: SlidersHorizontal },
          { id: 'waitlist', label: `Waitlist Grid (${kpiStats.waitlistCount})`, icon: Users },
          { id: 'analytics', label: 'Analytics Panel', icon: BarChart3 }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 whitespace-nowrap transition-all duration-200 ${ isActive ? 'border-app-primary text-app-primary bg-app-primary/5' : 'border-transparent text-text-muted hover:text-text-primary' }`}
            >
              <TabIcon size={14} className={isActive ? 'text-app-primary' : 'text-text-muted'} />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* 4. ACTIVE TAB RENDERING */}
      <motion.div variants={itemVariants} className="min-h-[480px]">
        
        {/* TAB 1: INTERACTIVE FLOOR MAP */}
        {activeTab === 'floor' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-app-24">
            <AppCard className="lg:col-span-3 flex flex-col min-h-[500px]">
              <div className="w-full flex flex-wrap items-center justify-between border-b border-app-border pb-3 mb-6 gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-text-primary text-xs font-bold flex items-center gap-1.5">
                    <Compass size={14} className="text-app-primary animate-pulse" />
                    Live Room Floor Layout Map
                  </span>
                  {canEditLayout && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        style={{
                          backgroundColor: isEditMode ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
                          borderColor: 'var(--color-border)',
                          color: isEditMode ? '#ffffff' : 'var(--color-text-primary)'
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold border rounded transition-all hover:opacity-90 flex items-center gap-1"
                      >
                        ⚙️ {isEditMode ? 'Exit Edit Mode' : 'Edit Layout'}
                      </button>
                      {isEditMode && (
                        <button
                          onClick={handleSaveLayout}
                          className="px-2.5 py-1 text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white rounded transition-all flex items-center gap-1"
                        >
                          💾 Save Layout
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-[10px] text-text-muted flex flex-wrap gap-4 font-bold">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-warning)' }} />Reserved / Pending</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-danger)' }} />Occupied</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />Cleaning</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)' }} />Maintenance</span>
                </div>
              </div>

              <div className="bg-app-elevated/40 relative w-full border border-app-border rounded-app-xl p-4 overflow-hidden flex items-center justify-center">
                {/* Floating Zoom Controls */}
                <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10 select-none">
                  <button
                    onClick={() => setZoom(prev => Math.min(3, prev + 0.15))}
                    className="w-7 h-7 bg-app-elevated border border-app-border rounded-full hover:bg-app-primary hover:text-white flex items-center justify-center text-xs font-extrabold shadow"
                    title="Zoom In"
                  >
                    ➕
                  </button>
                  <button
                    onClick={() => setZoom(prev => Math.max(0.5, prev - 0.15))}
                    className="w-7 h-7 bg-app-elevated border border-app-border rounded-full hover:bg-app-primary hover:text-white flex items-center justify-center text-xs font-extrabold shadow"
                    title="Zoom Out"
                  >
                    ➖
                  </button>
                  <button
                    onClick={() => setZoom(1)}
                    className="w-7 h-7 bg-app-elevated border border-app-border rounded-full hover:bg-app-primary hover:text-white flex items-center justify-center text-[9px] font-extrabold shadow"
                    title="Reset Zoom"
                  >
                    🔄
                  </button>
                </div>

                {(() => {
                  const viewBoxWidth = 600 / zoom;
                  const viewBoxHeight = 500 / zoom;
                  const viewBoxX = (600 - viewBoxWidth) / 2;
                  const viewBoxY = (500 - viewBoxHeight) / 2;

                  return (
                    <svg 
                      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`} 
                      className="w-full max-w-[550px] h-auto"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setDraggedTableId(null)}
                      onMouseUp={() => setDraggedTableId(null)}
                    >
                      <defs>
                        <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-text-muted/10" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="currentColor" className="text-app-bg" />
                      <rect width="100%" height="100%" fill="url(#floor-grid)" />
                      
                      <text x="35" y="470" fill="var(--color-text-muted)" fontSize="10" fontWeight="extrabold" letterSpacing="1">ENTRANCE</text>
                      <line x1="20" y1="480" x2="100" y2="480" stroke="var(--color-border)" strokeWidth="3.5" />

                      {(Array.isArray(tables) ? tables : []).map((t, index) => {
                        const isRound = t.shape === 'round';
                        const activeBookingForTable = (Array.isArray(bookings) ? bookings : []).find(b => 
                          (b.assigned_tables || []).includes(t.number) && 
                          ['confirmed', 'seated', 'checked_in', 'pending', 'arrived', 'dining', 'checkout_requested'].includes(b.status)
                        );
                        const isSelected = selectedTable?.id === t.id || (selectedBooking && (selectedBooking.assigned_tables || []).includes(t.number));
                        const strokeWidth = isSelected ? 4 : 2;
                        
                        const statusColor = getTableColor(t.status);
                        const animationClass = t.status === 'occupied' ? 'animate-heartbeat' : 
                                               activeBookingForTable?.status === 'pending' ? 'animate-slow-pulse' : '';
                        
                        // Root cause coordinate fix: Auto arrange if coordinates are (0,0) so they do not overlap
                        let x = t.x_coord;
                        let y = t.y_coord;
                        if (x === 0 && y === 0) {
                          const colCount = 5;
                          const col = index % colCount;
                          const row = Math.floor(index / colCount);
                          x = 80 + col * 110;
                          y = 80 + row * 95;
                        }

                        return (
                          <g 
                            key={t.id} 
                            className={`cursor-pointer group select-none transition-all duration-200 ${isEditMode ? 'cursor-move' : ''}`}
                            onClick={(e) => {
                              if (!isEditMode) {
                                handleTableClick(t);
                              }
                            }}
                            onMouseDown={(e) => {
                              if (isEditMode) {
                                setDraggedTableId(t.id);
                              }
                            }}
                          >
                            {isRound ? (
                              <circle 
                                cx={x} 
                                cy={y} 
                                r="36" 
                                fill={statusColor} 
                                fillOpacity="0.1" 
                                stroke={isSelected ? 'var(--color-primary)' : statusColor} 
                                strokeWidth={strokeWidth} 
                                className={`group-hover:stroke-app-primary transition-all ${animationClass}`}
                              />
                            ) : (
                              <rect 
                                x={x - 38} 
                                y={y - 28} 
                                width="76" 
                                height="56" 
                                rx="8"
                                fill={statusColor} 
                                fillOpacity="0.1" 
                                stroke={isSelected ? 'var(--color-primary)' : statusColor} 
                                strokeWidth={strokeWidth}
                                className={`group-hover:stroke-app-primary transition-all ${animationClass}`}
                              />
                            )}
                            
                            <text 
                              x={x} 
                              y={y - 4} 
                              textAnchor="middle" 
                              fill="var(--color-text-primary)"
                              fontSize="11" 
                              fontWeight="extrabold"
                            >
                              T-{t.number}
                            </text>
                            <text 
                              x={x} 
                              y={y + 12} 
                              textAnchor="middle" 
                              fill="var(--color-text-secondary)"
                              fontSize="9" 
                              fontWeight="bold"
                            >
                              👤 {t.capacity} {activeBookingForTable && `[${activeBookingForTable?.status?.slice(0, 4)?.toUpperCase()}]`}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
            </AppCard>

            <div className="space-y-app-24">
              <GlassCard className="p-4 border-app-primary/30 bg-app-primary/5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-app-primary animate-pulse" />
                  <span className="font-extrabold text-xs text-text-primary uppercase tracking-wider">AI Seating Optimizer</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                  "Friday and Saturday evening slots are consistently overbooked. We recommend opening 3 more outdoor tables or merging T-4 and T-5 during peak covers."
                </p>
              </GlassCard>

              <AppCard className="p-5 flex flex-col gap-4">
                <div className="border-b border-app-border pb-3 flex items-center justify-between">
                  <h3 className="text-text-primary font-bold text-xs flex items-center gap-1.5">
                    <Users size={15} className="text-app-warning" />
                    Waitlist Queue
                  </h3>
                  <Badge status="warning">{waitlist.length} Queue</Badge>
                </div>

                {waitlist.length === 0 ? (
                   <EmptyState title="Queue is empty" description="Walk-in guest list is empty." icon={Coffee} />
                ) : (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {waitlist.map((w, index) => (
                      <div key={w.id} className="bg-app-bg border border-app-border p-3.5 rounded-app-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] w-5 h-5 rounded-app-md bg-app-warning/10 text-app-warning flex items-center justify-center font-extrabold">
                              {index + 1}
                            </span>
                            <span className="text-text-primary text-xs font-bold">{w.guest_name}</span>
                          </div>
                          <button 
                            onClick={() => handleCancelWaitlist(w.id)}
                            className="text-text-muted hover:text-app-danger transition-colors p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        
                        <p className="text-[10px] text-text-muted font-medium">
                          👤 Party size: {w.party_size} | ⏳ Wait: {w.estimated_wait_minutes}m
                        </p>
                        
                        <div className="flex gap-2 pt-1">
                          {w.status === 'waiting' ? (
                            <PrimaryButton
                              onClick={() => handleNotifyWaitlist(w.id)}
                              className="px-2.5 py-1 text-[9px] h-7 shadow-app-sm"
                            >
                              Notify WhatsApp
                            </PrimaryButton>
                          ) : (
                            <Badge status="success">Notified</Badge>
                          )}
                          
                          <SecondaryButton
                            onClick={() => {
                              const candidateTable = tables.find(t => t.status === 'available' && t.capacity >= w.party_size);
                              if (candidateTable) {
                                handlePromoteWaitlist(w.id, [candidateTable.id]);
                              } else {
                                addToast('No available matching capacity tables found.', 'warning');
                              }
                            }}
                            className="px-2.5 py-1 text-[9px] h-7"
                          >
                            Seat Guest
                          </SecondaryButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <PrimaryButton onClick={() => setWaitlistModalOpen(true)} icon={Plus} className="w-full text-[10px] font-bold h-9">
                  Add to Waitlist
                </PrimaryButton>
              </AppCard>

              <AppCard className="border-app-primary/20 bg-gradient-to-br from-app-surface to-app-primary/[0.02]">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="flex items-center gap-1.5 text-app-primary font-bold text-[9px] uppercase tracking-wider">
                    <Sparkles size={13} className="animate-pulse" />
                    AI Seating Assistance
                  </span>
                </div>
                <h4 className="text-xs font-bold text-text-primary mb-2">Adjacency Optimization</h4>
                <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                  We suggest pairing adjacent empty tables if walk-in party exceeds Table capacities. Tables within **150 coordinate units** can be connected dynamically by reception desk controls.
                </p>
              </AppCard>
            </div>
          </div>
        )}

        {/* TAB 2: TIMELINE ROSTER CARD-BASED UI */}
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[450px]">
            {/* COLUMN 1: PENDING / WAITING CHECK-IN */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-app-border pb-2">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-tight flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Pending / Waiting ({bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length})
                </h3>
              </div>
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).map(b => (
                  <GlassCard key={b.id} className="p-4 border-app-border hover:border-app-primary/30 hover:-translate-y-0.5 transition-all shadow-app-sm space-y-3 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-text-primary text-sm block">{b.guest_name}</span>
                        <span className="text-[10px] text-text-muted font-bold block">{b.guest_phone}</span>
                      </div>
                      <Badge status="warning">👤 {b.party_size}</Badge>
                    </div>

                    <div className="text-[11px] text-text-secondary space-y-1 bg-app-surface/50 p-2.5 rounded-lg border border-app-border/40 font-semibold">
                      <div className="flex justify-between">
                        <span>Table Assignment:</span>
                        <span className="font-bold text-app-primary">T-{b.assigned_tables?.join(', ') || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Scheduled Time:</span>
                        <span className="font-bold text-text-primary">{formatTimeSafe(b.start_time)}</span>
                      </div>
                      {b.special_requests && (
                        <div className="pt-1 border-t border-app-border/30 mt-1">
                          <span className="text-app-warning text-[10px] italic">"💡 {b.special_requests}"</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <PrimaryButton onClick={() => handleSeat(b.id)} className="w-full text-[10px] py-1 shadow-app-sm">
                        Seat Guest
                      </PrimaryButton>
                      <DangerButton onClick={() => handleCancelClick(b)} className="px-2.5 py-1 text-[10px] shrink-0">
                        Cancel
                      </DangerButton>
                    </div>
                  </GlassCard>
                ))}
                {bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length === 0 && (
                  <p className="text-xs text-text-muted py-8 text-center border border-dashed border-app-border rounded-xl">No pending guests.</p>
                )}
              </div>
            </div>

            {/* COLUMN 2: SEATED / DINING */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-app-border pb-2">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-tight flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Seated / Dining ({bookings.filter(b => ['seated', 'dining', 'checkout_requested'].includes(b.status)).length})
                </h3>
              </div>
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {bookings.filter(b => ['seated', 'dining', 'checkout_requested'].includes(b.status)).map(b => (
                  <GlassCard key={b.id} className="p-4 border-app-success/20 bg-app-success/[0.01] hover:border-app-success/40 hover:-translate-y-0.5 transition-all shadow-app-sm space-y-3 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-text-primary text-sm block">{b.guest_name}</span>
                        <span className="text-[10px] text-text-muted font-bold block">{b.guest_phone}</span>
                      </div>
                      <Badge status="success">👤 {b.party_size}</Badge>
                    </div>

                    <div className="text-[11px] text-text-secondary space-y-1 bg-app-surface/50 p-2.5 rounded-lg border border-app-border/40 font-semibold">
                      <div className="flex justify-between">
                        <span>Occupying Table:</span>
                        <span className="font-bold text-app-success">T-{b.assigned_tables?.join(', ') || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check-In time:</span>
                        <span className="font-bold text-text-primary">{formatTimeSafe(b.start_time)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Live State:</span>
                        <Badge status={b.status === 'checkout_requested' ? 'danger' : 'info'}>{b.status}</Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {b.status === 'seated' && (
                        <PrimaryButton onClick={() => handleStartDining(b.id)} className="w-full text-[10px] py-1 bg-emerald-600 border-emerald-600 hover:bg-emerald-500">
                          Start Dining
                        </PrimaryButton>
                      )}
                      {b.status === 'dining' && (
                        <SecondaryButton onClick={() => handleRequestCheckout(b.id)} className="w-full text-[10px] py-1">
                          Request Bill
                        </SecondaryButton>
                      )}
                      {(b.status === 'checkout_requested' || b.status === 'dining' || b.status === 'seated') && (
                        <PrimaryButton onClick={() => handleCheckOut(b.id)} className="w-full text-[10px] py-1">
                          Release Table
                        </PrimaryButton>
                      )}
                    </div>
                  </GlassCard>
                ))}
                {bookings.filter(b => ['seated', 'dining', 'checkout_requested'].includes(b.status)).length === 0 && (
                  <p className="text-xs text-text-muted py-8 text-center border border-dashed border-app-border rounded-xl">No active dining sessions.</p>
                )}
              </div>
            </div>

            {/* COLUMN 3: COMPLETED */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-app-border pb-2">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-tight flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Completed ({bookings.filter(b => ['completed', 'checked_out'].includes(b.status)).length})
                </h3>
              </div>
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {bookings.filter(b => ['completed', 'checked_out'].includes(b.status)).map(b => (
                  <AppCard key={b.id} className="p-4 border-app-border bg-app-bg hover:-translate-y-0.5 transition-all shadow-app-sm space-y-2 opacity-75">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-text-primary text-xs block">{b.guest_name}</span>
                        <span className="text-[9px] text-text-muted font-bold block">T-{b.assigned_tables?.join(', ') || 'None'}</span>
                      </div>
                      <Badge status="info">👤 {b.party_size}</Badge>
                    </div>
                    <p className="text-[10px] text-text-muted font-bold">Checked out successfully.</p>
                  </AppCard>
                ))}
                {bookings.filter(b => ['completed', 'checked_out'].includes(b.status)).length === 0 && (
                  <p className="text-xs text-text-muted py-8 text-center border border-dashed border-app-border rounded-xl">No completed bookings.</p>
                )}
              </div>
            </div>

            {/* COLUMN 4: CANCELLED / REJECTED */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-app-border pb-2">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-tight flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Cancelled ({bookings.filter(b => ['cancelled', 'no_show', 'rejected'].includes(b.status)).length})
                </h3>
              </div>
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {bookings.filter(b => ['cancelled', 'no_show', 'rejected'].includes(b.status)).map(b => (
                  <AppCard key={b.id} className="p-4 border-app-border bg-app-bg hover:-translate-y-0.5 transition-all shadow-app-sm space-y-2 opacity-75">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-text-primary text-xs block text-app-danger">{b.guest_name}</span>
                        <span className="text-[9px] text-text-muted font-bold block">{b.guest_phone}</span>
                      </div>
                      <Badge status="danger">{b.status}</Badge>
                    </div>
                    <p className="text-[10px] text-text-muted font-bold italic">"Reason: {b.cancellation_reason || 'No show'}"</p>
                  </AppCard>
                ))}
                {bookings.filter(b => ['cancelled', 'no_show', 'rejected'].includes(b.status)).length === 0 && (
                  <p className="text-xs text-text-muted py-8 text-center border border-dashed border-app-border rounded-xl">No cancelled bookings.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BOOKING RECORDS LIST MANAGER */}
        {activeTab === 'list' && (
          <AppCard className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search size={14} className="text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by guest name or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-app-elevated text-text-primary w-full pl-9 pr-4 py-2.5 border border-transparent focus:border-app-primary rounded-app-xl text-xs outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full md:w-48"
                >
                  <option value="all">All Bookings</option>
                  <option value="pending">Pending Approval</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="reminder_sent">Reminder Sent</option>
                  <option value="arrived">Arrived (Checked In)</option>
                  <option value="seated">Seated</option>
                  <option value="dining">Dining</option>
                  <option value="checkout_requested">Checkout Requested</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No Show</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </Select>
                
                <PrimaryButton onClick={() => { setBookingStep(1); setBookingModalOpen(true); }} icon={Plus}>
                  New Booking
                </PrimaryButton>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <EmptyState title="No records found" description="Try refining filters or add a new booking." icon={Coffee} />
            ) : (
              <div className="overflow-x-auto border border-app-border rounded-app-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-app-elevated/40 text-[10px] text-text-muted border-b border-app-border font-extrabold uppercase">
                      <th className="py-4 px-6">Guest / Contact</th>
                      <th className="py-4 px-6">Party Size</th>
                      <th className="py-4 px-6">Assigned Tables</th>
                      <th className="py-4 px-6">Time Slot</th>
                      <th className="py-4 px-6">No-Show Risk</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border text-xs text-text-secondary">
                    {paginatedBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-app-hover/50 transition-colors">
                        <td className="py-4 px-6" onClick={() => { setSelectedBooking(b); fetchBookingHistory(b.id); setDrawerOpen(true); }}>
                          <p className="text-text-primary font-bold cursor-pointer hover:underline">{b.guest_name}</p>
                          <span className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                            <Phone size={10} />
                            {b.guest_phone}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-extrabold text-text-primary">👤 {b.party_size}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1">
                            {(b.assigned_tables || []).map((t, idx) => (
                              <span key={idx} className="bg-app-elevated text-text-primary px-2.5 py-0.5 rounded-app-md font-bold text-[10px] border border-app-border">
                                T-{t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {formatTimeSafe(b.start_time)} - {formatTimeSafe(b.end_time)}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-bold ${b.no_show_probability > 30 ? 'text-app-danger' : 'text-text-muted'}`}>
                            {b.no_show_probability}%
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <Badge status={getStatusBadge(b.status)}>
                            {b.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Actions by lifecycle stage */}
                            {b.status === 'pending' && (
                              <div className="flex gap-1.5">
                                <PrimaryButton onClick={() => handleApprove(b.id)} className="px-2.5 py-1 shadow-app-sm h-8 text-[10px]">Approve</PrimaryButton>
                                <SecondaryButton onClick={() => { setSelectedBooking(b); setRejectModalOpen(true); }} className="px-2.5 py-1 h-8 text-[10px] text-app-danger hover:bg-app-danger/10">Reject</SecondaryButton>
                              </div>
                            )}
                            
                            {b.status === 'confirmed' && (
                              <PrimaryButton onClick={() => handleCheckIn(b.id)} className="px-3 py-1 shadow-app-sm h-8 text-[10px]">Check In</PrimaryButton>
                            )}

                            {b.status === 'arrived' && (
                              <PrimaryButton onClick={() => handleSeat(b.id)} className="px-3 py-1 shadow-app-sm h-8 bg-amber-600 border-amber-600 hover:bg-amber-700 text-[10px]">Seat Guest</PrimaryButton>
                            )}

                            {b.status === 'seated' && (
                              <PrimaryButton onClick={() => handleStartDining(b.id)} className="px-3 py-1 shadow-app-sm h-8 bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-[10px]">Start Dining</PrimaryButton>
                            )}

                            {b.status === 'dining' && (
                              <SecondaryButton onClick={() => handleRequestCheckout(b.id)} className="px-3 py-1 h-8 text-[10px]">Checkout</SecondaryButton>
                            )}

                            {b.status === 'checkout_requested' && (
                              <PrimaryButton onClick={() => handleCheckOut(b.id)} className="px-3 py-1 shadow-app-sm h-8 text-[10px]">Complete Checkout</PrimaryButton>
                            )}

                            {b.status === 'completed' && (
                              <SecondaryButton onClick={() => handleArchive(b.id)} className="px-3 py-1 h-8 text-[10px]">Archive</SecondaryButton>
                            )}

                            <SecondaryButton
                              onClick={() => {
                                setQrBooking(b);
                                setQrShowModalOpen(true);
                              }}
                              className="px-2 h-8"
                            >
                              <QrCode size={13} />
                            </SecondaryButton>

                            {b.status !== 'completed' && b.status !== 'cancelled' && b.status !== 'rejected' && (
                              <button
                                onClick={() => handleCancelClick(b)}
                                className="text-text-muted hover:text-app-danger p-1.5 hover:bg-app-elevated rounded-app-md transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-app-border pt-4">
                <span className="text-[10px] font-extrabold text-text-muted">
                  Page {currentPage} of {totalPages} ({filteredBookings.length} records)
                </span>
                <div className="flex items-center gap-2">
                  <SecondaryButton
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1 h-8 w-8"
                  >
                    <ChevronLeft size={14} />
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 h-8 w-8"
                  >
                    <ChevronRight size={14} />
                  </SecondaryButton>
                </div>
              </div>
            )}
          </AppCard>
        )}

        {/* TAB 4: WAITLIST GRID PANEL */}
        {activeTab === 'waitlist' && (
          <AppCard className="space-y-6">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h3 className="text-text-primary font-bold text-sm flex items-center gap-1.5">
                <Users size={16} className="text-app-warning" />
                Virtual Walk-in Waitlist Queue
              </h3>
              <PrimaryButton onClick={() => setWaitlistModalOpen(true)} icon={Plus}>
                Add to Waitlist
              </PrimaryButton>
            </div>

            {waitlist.length === 0 ? (
              <EmptyState title="Queue is empty" description="Walk-in waitlist queue is currently empty." icon={Coffee} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-app-20">
                {waitlist.map((w, index) => (
                  <AppCard key={w.id} className="relative overflow-hidden group p-5 border-app-border hover:border-app-primary/20">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] w-5 h-5 rounded-app-md bg-app-warning/10 text-app-warning border border-app-warning/25 flex items-center justify-center font-extrabold">
                            {index + 1}
                          </span>
                          <h4 className="text-sm font-bold text-text-primary">{w.guest_name}</h4>
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          ⏳ Waiting time elapsed: **{w.estimated_wait_minutes} mins**
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => handleCancelWaitlist(w.id)}
                        className="text-text-muted hover:text-app-danger p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold text-text-secondary">
                      <div className="bg-app-elevated p-2 rounded-app-lg border border-app-border">
                        <span className="text-text-muted block text-[9px] uppercase tracking-wider mb-0.5">Party Size</span>
                        👤 {w.party_size} guests
                      </div>
                      <div className="bg-app-elevated p-2 rounded-app-lg border border-app-border">
                        <span className="text-text-muted block text-[9px] uppercase tracking-wider mb-0.5">WhatsApp Status</span>
                        <Badge status={w.status === 'notified' ? 'success' : 'warning'}>{w.status}</Badge>
                      </div>
                    </div>

                    <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-app-border">
                      {w.status === 'waiting' ? (
                        <PrimaryButton
                          onClick={() => handleNotifyWaitlist(w.id)}
                          className="flex-1 py-1.5 h-8 text-[10px] font-bold shadow-app-sm"
                        >
                          Dispatch WhatsApp
                        </PrimaryButton>
                      ) : (
                        <div className="flex-1 text-[10px] font-bold flex items-center justify-center gap-1 text-app-success">
                          <CheckCircle size={12} />
                          WhatsApp Notified
                        </div>
                      )}
                      
                      <SecondaryButton
                        onClick={() => {
                          const candidateTable = tables.find(t => t.status === 'available' && t.capacity >= w.party_size);
                          if (candidateTable) {
                            handlePromoteWaitlist(w.id, [candidateTable.id]);
                          } else {
                            addToast('No available tables currently match party size.', 'warning');
                          }
                        }}
                        className="flex-1 py-1.5 h-8 text-[10px] font-semibold"
                      >
                        Seat Guest
                      </SecondaryButton>
                    </div>
                  </AppCard>
                ))}
              </div>
            )}
          </AppCard>
        )}

        {/* TAB 5: ANALYTICS PANEL */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-app-24">
            <GlassCard className="flex flex-col gap-3 justify-center items-center py-8">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Booking Success Rate</span>
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="50" stroke="var(--color-border)" strokeWidth="8" fill="transparent" />
                  <circle cx="64" cy="64" r="50" stroke="var(--color-success)" strokeWidth="8" fill="transparent"
                          strokeDasharray={314} strokeDashoffset={314 - (314 * successRate) / 100} />
                </svg>
                <span className="absolute text-2xl font-extrabold text-text-primary">{successRate}%</span>
              </div>
              <p className="text-[10px] text-text-muted text-center max-w-[200px] leading-relaxed">
                Percentage of bookings checking in successfully vs cancellations & no shows.
              </p>
            </GlassCard>

            <GlassCard className="flex flex-col gap-3 justify-center items-center py-8">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Cancellation Rate</span>
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="50" stroke="var(--color-border)" strokeWidth="8" fill="transparent" />
                  <circle cx="64" cy="64" r="50" stroke="var(--color-warning)" strokeWidth="8" fill="transparent"
                          strokeDasharray={314} strokeDashoffset={314 - (314 * cancellationRate) / 100} />
                </svg>
                <span className="absolute text-2xl font-extrabold text-text-primary">{cancellationRate}%</span>
              </div>
              <p className="text-[10px] text-text-muted text-center max-w-[200px] leading-relaxed">
                Proportion of reservation slots cancelled before operational window.
              </p>
            </GlassCard>

            <GlassCard className="flex flex-col gap-3 justify-center items-center py-8">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">No Show Rate</span>
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="50" stroke="var(--color-border)" strokeWidth="8" fill="transparent" />
                  <circle cx="64" cy="64" r="50" stroke="var(--color-danger)" strokeWidth="8" fill="transparent"
                          strokeDasharray={314} strokeDashoffset={314 - (314 * noShowRate) / 100} />
                </svg>
                <span className="absolute text-2xl font-extrabold text-text-primary">{noShowRate}%</span>
              </div>
              <p className="text-[10px] text-text-muted text-center max-w-[200px] leading-relaxed">
                Guest fail-to-arrive percentage. Auto-released 15 minutes past arrival time.
              </p>
            </GlassCard>
          </div>
        )}

      </motion.div>

      {/* 5. SEATING DRAWER & TIMELINE HISTORY */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedTable ? `Table T-${selectedTable.number} Overview` : 'Reservation Detail Drawer'}
      >
        {selectedBooking ? (
          <div className="space-y-6">
            <div className="bg-app-elevated border border-app-border p-4 rounded-app-xl flex items-center justify-between">
              <div>
                <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block">Status</span>
                <Badge status={getStatusBadge(selectedBooking.status)}>
                  {selectedBooking.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block">Party Size</span>
                <span className="text-xs font-bold text-text-primary">👤 {selectedBooking.party_size} guests</span>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-normal">
              <div className="flex justify-between">
                <span className="text-text-muted">Guest Name</span>
                <span className="font-bold text-text-primary">{selectedBooking.guest_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Contact Info</span>
                <span className="font-semibold text-text-primary">{selectedBooking.guest_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Booking Time</span>
                <span className="font-bold text-text-primary">
                  {formatTimeSafe(selectedBooking.start_time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Table Assignments</span>
                <span className="font-bold text-app-primary">
                  {selectedBooking.assigned_tables?.join(', ') || 'No table assigned'}
                </span>
              </div>
            </div>

            {/* Lifecycle Stages visual timeline */}
            <div className="border-t border-app-border pt-4">
              <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block mb-3">Reservation Lifecycle</span>
              <div className="grid grid-cols-6 text-center text-[7px] font-extrabold text-text-muted uppercase tracking-wider relative mb-2">
                <span className={['pending', 'confirmed', 'arrived', 'seated', 'dining', 'checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Pending</span>
                <span className={['confirmed', 'arrived', 'seated', 'dining', 'checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Confirmed</span>
                <span className={['arrived', 'seated', 'dining', 'checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Arrived</span>
                <span className={['seated', 'dining', 'checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Seated</span>
                <span className={['dining', 'checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Dining</span>
                <span className={['checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Completed</span>
              </div>
              <div className="w-full bg-app-border h-1 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-app-primary transition-all duration-300"
                  style={{
                    width: selectedBooking.status === 'pending' ? '10%' :
                           selectedBooking.status === 'confirmed' ? '30%' :
                           selectedBooking.status === 'arrived' ? '50%' :
                           selectedBooking.status === 'seated' ? '68%' :
                           selectedBooking.status === 'dining' ? '82%' :
                           selectedBooking.status === 'checkout_requested' ? '92%' :
                           selectedBooking.status === 'completed' ? '100%' : '0%'
                  }}
                />
              </div>
            </div>

            {/* Audit History Logs Visual Timeline */}
            <div className="border-t border-app-border pt-4">
              <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                <History size={12} />
                Audit Trail History Logs
              </span>
              
              {historyLoading ? (
                <div className="text-[10px] text-text-muted py-2 animate-pulse">Syncing timeline audit records...</div>
              ) : bookingHistory.length === 0 ? (
                <div className="text-[10px] text-text-muted py-1">No transition logs found.</div>
              ) : (
                <div className="relative border-l border-app-border pl-4 ml-2 space-y-4">
                  {bookingHistory.map((log) => (
                    <div key={log.id} className="relative text-[10px] leading-relaxed">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-app-primary border-2 border-app-bg" />
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-text-primary uppercase tracking-wider text-[8px] bg-app-primary/10 text-app-primary px-1.5 py-0.5 rounded">
                          {log.status}
                        </span>
                        <span className="text-text-muted text-[8px]">
                          {formatTimeSafe(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-text-secondary mt-1 font-medium">{log.reason || 'Transition recorded.'}</p>
                      {log.changed_by_name && (
                        <span className="text-[8px] text-text-muted block mt-0.5">Executor: {log.changed_by_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTION CENTER */}
            <div className="border-t border-app-border pt-4 space-y-3">
              <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">Actions Center</span>
              
              {selectedBooking.status === 'pending' && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Approval/rejection notes..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <PrimaryButton onClick={() => handleApprove(selectedBooking.id)} className="flex-1">
                      Approve Booking
                    </PrimaryButton>
                    <DangerButton onClick={() => { setRejectReason(''); setRejectModalOpen(true); }} className="flex-1">
                      Reject
                    </DangerButton>
                  </div>
                </div>
              )}

              {selectedBooking.status === 'confirmed' && (
                <div className="flex gap-2">
                  <PrimaryButton onClick={() => handleCheckIn(selectedBooking.id)} className="flex-1">
                    Check In Guest
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setNoShowModalOpen(true)} className="flex-1">
                    Mark No Show
                  </SecondaryButton>
                </div>
              )}

              {selectedBooking.status === 'arrived' && (
                <PrimaryButton onClick={() => handleSeat(selectedBooking.id)} className="w-full bg-amber-600 border-amber-600 hover:bg-amber-700">
                  Seat Guest
                </PrimaryButton>
              )}

              {selectedBooking.status === 'seated' && (
                <PrimaryButton onClick={() => handleStartDining(selectedBooking.id)} className="w-full bg-indigo-600 border-indigo-600 hover:bg-indigo-700">
                  Start Dining
                </PrimaryButton>
              )}

              {selectedBooking.status === 'dining' && (
                <PrimaryButton onClick={() => handleRequestCheckout(selectedBooking.id)} className="w-full">
                  Request Checkout
                </PrimaryButton>
              )}

              {selectedBooking.status === 'checkout_requested' && (
                <PrimaryButton onClick={() => handleCheckOut(selectedBooking.id)} className="w-full">
                  Complete Checkout
                </PrimaryButton>
              )}

              {selectedBooking.status === 'completed' && (
                <SecondaryButton onClick={() => handleArchive(selectedBooking.id)} className="w-full">
                  Archive Reservation
                </SecondaryButton>
              )}

              {['pending', 'confirmed', 'arrived', 'seated', 'dining', 'checkout_requested'].includes(selectedBooking.status) && (
                <DangerButton onClick={() => handleCancelClick(selectedBooking)} className="w-full">
                  Cancel Reservation
                </DangerButton>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <Coffee size={32} className="text-text-muted mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-text-primary">Clean / Empty Table</p>
              <p className="text-[10px] text-text-muted">T-{selectedTable?.number} has no active reservations currently.</p>
            </div>
            
            {(() => {
              const matchingWaitlistGuest = (Array.isArray(waitlist) ? waitlist : []).find(w => 
                (w.status === 'waiting' || w.status === 'notified') && 
                w.party_size <= selectedTable?.capacity
              );
              
              return matchingWaitlistGuest ? (
                <div className="bg-app-primary/10 border border-app-primary/20 p-4 rounded-app-xl text-left space-y-3">
                  <p className="text-[10px] text-app-primary font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="animate-pulse" />
                    Waitlist Recommendation
                  </p>
                  <p className="text-[11px] text-text-secondary leading-normal font-medium">
                    Queue guest <strong>{matchingWaitlistGuest.guest_name}</strong> (Party: {matchingWaitlistGuest.party_size}) fits Table T-{selectedTable?.number} capacity ({selectedTable?.capacity}).
                  </p>
                  <PrimaryButton
                    onClick={() => {
                      handlePromoteWaitlist(matchingWaitlistGuest.id, [selectedTable.id]);
                      setDrawerOpen(false);
                    }}
                    className="w-full text-[10px] font-bold h-8"
                  >
                    Seat Customer
                  </PrimaryButton>
                </div>
              ) : null;
            })()}

            <PrimaryButton 
              onClick={() => {
                setFormData(prev => ({ ...prev, preferred_table_id: selectedTable.id }));
                setBookingStep(1);
                setBookingModalOpen(true);
              }} 
              icon={Plus} 
              className="mx-auto"
            >
              Book Table T-{selectedTable?.number}
            </PrimaryButton>
          </div>
        )}
      </Drawer>

      {/* 6. BOOKING WIZARD MODAL */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="Create New Reservation"
        size="lg"
      >
        <div className="space-y-6">
          {/* Booking Type Switcher */}
          <div className="flex bg-app-elevated border border-app-border rounded-app-xl p-1 mb-2">
            <button
              onClick={() => setBookingType('walk_in')}
              style={{
                backgroundColor: bookingType === 'walk_in' ? 'var(--color-primary)' : 'transparent',
                color: bookingType === 'walk_in' ? '#ffffff' : 'var(--color-text-muted)'
              }}
              className="flex-1 py-2 text-xs font-bold rounded-app-lg transition-all"
            >
              ⚡ Quick Walk-In Seating
            </button>
            <button
              onClick={() => {
                setBookingType('advance');
                setBookingStep(1);
              }}
              style={{
                backgroundColor: bookingType === 'advance' ? 'var(--color-primary)' : 'transparent',
                color: bookingType === 'advance' ? '#ffffff' : 'var(--color-text-muted)'
              }}
              className="flex-1 py-2 text-xs font-bold rounded-app-lg transition-all"
            >
              📅 Advance Reservation
            </button>
          </div>

          {bookingType === 'walk_in' ? (
            <div className="space-y-4">
              <Select
                label="Assign Table"
                id="preferred_table_id"
                name="preferred_table_id"
                value={formData.preferred_table_id}
                onChange={handleFormChange}
                options={[
                  { value: '', label: 'Select Table' },
                  ...(Array.isArray(tables) ? tables : []).map(t => ({
                    value: t.id,
                    label: `Table T-${t.number} (Capacity: ${t.capacity}) - [${t.status.toUpperCase()}]`,
                    disabled: t.status !== 'available'
                  }))
                ]}
              />

              <Input
                label="Number of Guests"
                id="party_size"
                name="party_size"
                type="number"
                value={formData.party_size}
                onChange={handleFormChange}
                min="1"
                max="30"
              />

              <Input
                label="Customer Name (Optional)"
                id="guest_name"
                name="guest_name"
                value={formData.guest_name}
                onChange={handleFormChange}
                placeholder="e.g. Walk-in Guest"
              />

              <Input
                label="Phone Number (Optional)"
                id="guest_phone"
                name="guest_phone"
                value={formData.guest_phone}
                onChange={handleFormChange}
                placeholder="e.g. +91 98765 43210"
              />

              <div className="pt-4 border-t border-app-border">
                <PrimaryButton onClick={handleQuickWalkInSubmit} loading={formLoading} className="w-full h-10 shadow-app-md">
                  Seat Customer & Open POS
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-[9px] font-extrabold text-text-muted uppercase tracking-wider">
                <span className={bookingStep === 1 ? 'text-app-primary' : ''}>1. Guest Info</span>
                <span className={bookingStep === 2 ? 'text-app-primary' : ''}>2. Details</span>
                <span className={bookingStep === 3 ? 'text-app-primary' : ''}>3. Tables</span>
                <span className={bookingStep === 4 ? 'text-app-primary' : ''}>4. Confirm</span>
              </div>
              <div className="w-full bg-app-border h-1 rounded-full overflow-hidden">
                <div className="h-full bg-app-primary transition-all duration-300" style={{ width: `${(bookingStep / 4) * 100}%` }} />
              </div>

              <div className="min-h-[220px]">
                {bookingStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <Input
                      label="Guest Name"
                      id="guest_name"
                      name="guest_name"
                      value={formData.guest_name}
                      onChange={handleFormChange}
                      error={formErrors.guest_name}
                      placeholder="e.g. Leslie Alexander"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Phone Number"
                        id="guest_phone"
                        name="guest_phone"
                        value={formData.guest_phone}
                        onChange={handleFormChange}
                        error={formErrors.guest_phone}
                        placeholder="e.g. +91 98765 43210"
                      />
                      <Input
                        label="Email Address"
                        id="guest_email"
                        name="guest_email"
                        value={formData.guest_email}
                        onChange={handleFormChange}
                        placeholder="e.g. leslie@gmail.com"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_vip" name="is_vip" checked={formData.is_vip} onChange={handleFormChange} className="rounded border-app-border text-app-primary focus:ring-app-primary/10" />
                        <label htmlFor="is_vip" className="text-[10px] font-bold text-text-secondary uppercase">VIP Guest</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="needs_wheelchair" name="needs_wheelchair" checked={formData.needs_wheelchair} onChange={handleFormChange} className="rounded border-app-border text-app-primary focus:ring-app-primary/10" />
                        <label htmlFor="needs_wheelchair" className="text-[10px] font-bold text-text-secondary uppercase">Wheelchair</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="needs_baby_chair" name="needs_baby_chair" checked={formData.needs_baby_chair} onChange={handleFormChange} className="rounded border-app-border text-app-primary focus:ring-app-primary/10" />
                        <label htmlFor="needs_baby_chair" className="text-[10px] font-bold text-text-secondary uppercase">High Chair</label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {bookingStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Party Size"
                        id="party_size"
                        name="party_size"
                        type="number"
                        value={formData.party_size}
                        onChange={handleFormChange}
                        min="1"
                        max="20"
                      />
                      <Input
                        label="Booking Time (HH:MM)"
                        id="start_time"
                        name="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={handleFormChange}
                        error={formErrors.start_time}
                      />
                    </div>

                    <div className="flex flex-wrap gap-4 py-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_birthday" name="is_birthday" checked={formData.is_birthday} onChange={handleFormChange} className="rounded border-app-border text-app-primary focus:ring-app-primary/10" />
                        <label htmlFor="is_birthday" className="text-[10px] font-bold text-text-secondary uppercase">Birthday Celebration</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_anniversary" name="is_anniversary" checked={formData.is_anniversary} onChange={handleFormChange} className="rounded border-app-border text-app-primary focus:ring-app-primary/10" />
                        <label htmlFor="is_anniversary" className="text-[10px] font-bold text-text-secondary uppercase">Anniversary Celebration</label>
                      </div>
                    </div>

                    <Textarea
                      label="Allergy Notes"
                      id="allergy_notes"
                      name="allergy_notes"
                      value={formData.allergy_notes}
                      onChange={handleFormChange}
                      placeholder="e.g. Peanuts, Gluten-free requirements..."
                    />
                  </motion.div>
                )}

                {bookingStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block mb-2">Available Tables & AI Recommendations</span>
                    
                    {aiSuggestions ? (
                      <div className="space-y-3">
                        {aiSuggestions.isAvailable ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-app-success">
                              <CheckCircle size={14} />
                              Tables Allocated Successfully
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {aiSuggestions.recommendedTables.map(t => (
                                <div 
                                  key={t.id} 
                                  onClick={() => setFormData(prev => ({ ...prev, preferred_table_id: t.id }))}
                                  className={`p-3 rounded-app-xl border cursor-pointer transition-all duration-200 flex justify-between items-center ${formData.preferred_table_id === t.id ? 'border-app-primary bg-app-primary/5 text-app-primary' : 'border-app-border bg-app-surface text-text-secondary'}`}
                                >
                                  <div>
                                    <p className="text-xs font-bold">Table T-{t.number}</p>
                                    <span className="text-[9px] opacity-75">👤 Capacity: {t.capacity}</span>
                                  </div>
                                  <span className="text-[9px] font-bold bg-app-primary/10 px-2 py-0.5 rounded-full uppercase">AI Recommended</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-app-danger">
                              <AlertTriangle size={14} />
                              Time Slot Conflict. AI Suggested slots:
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {aiSuggestions.suggestedSlots.map((slot, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => {
                                    const justTime = slot.split('T')[1].slice(0, 5);
                                    setFormData(prev => ({ ...prev, start_time: justTime }));
                                    setAiSuggestions(null);
                                    setBookingStep(2);
                                  }}
                                  className="p-3 border border-app-border hover:border-app-primary rounded-app-xl cursor-pointer text-center text-xs font-bold"
                                >
                                  🕒 {new Date(slot).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-xs text-text-secondary mb-4">Validate table occupancy bounds and AI schedule availability.</p>
                        <PrimaryButton onClick={checkAvailability} loading={formLoading} className="mx-auto">
                          Evaluate Seating Availability
                        </PrimaryButton>
                      </div>
                    )}
                  </motion.div>
                )}

                {bookingStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block">Confirm Reservation Summary</span>
                    
                    <div className="bg-app-elevated border border-app-border p-4 rounded-app-xl space-y-3 text-xs leading-normal">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Guest Name</span>
                        <span className="font-bold text-text-primary">{formData.guest_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Phone Contact</span>
                        <span className="font-bold text-text-primary">{formData.guest_phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Selected Time</span>
                        <span className="font-bold text-text-primary">{formData.start_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Party Size</span>
                        <span className="font-bold text-text-primary">👤 {formData.party_size} Guests</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Allocated Table</span>
                        <span className="font-bold text-app-primary">
                          {tables.find(t => t.id === formData.preferred_table_id)?.number ? `Table T-${tables.find(t => t.id === formData.preferred_table_id).number}` : 'Auto-allocated'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t border-app-border">
                {bookingStep > 1 ? (
                  <SecondaryButton onClick={() => setBookingStep(prev => prev - 1)}>
                    Back
                  </SecondaryButton>
                ) : <div />}

                {bookingStep < 4 ? (
                  <PrimaryButton 
                    onClick={() => {
                      const errs = {};
                      if (bookingStep === 1 && !formData.guest_name.trim()) errs.guest_name = 'Name required';
                      if (bookingStep === 1 && !formData.guest_phone.trim()) errs.guest_phone = 'Phone required';
                      if (bookingStep === 2 && !formData.start_time) errs.start_time = 'Time required';
                      
                      if (bookingStep === 3) {
                        if (!aiSuggestions) {
                          addToast('Please evaluate seating availability first.', 'warning');
                          return;
                        }
                        if (!formData.preferred_table_id && aiSuggestions.isAvailable) {
                          addToast('Please select a table to continue.', 'warning');
                          return;
                        }
                      }

                      if (Object.keys(errs).length > 0) {
                        setFormErrors(errs);
                        addToast('Please complete required fields.', 'warning');
                      } else {
                        setBookingStep(prev => prev + 1);
                      }
                    }}
                  >
                    Continue
                  </PrimaryButton>
                ) : (
                  <PrimaryButton onClick={handleBookingSubmit} loading={formLoading} className="shadow-app-md">
                    Confirm Reservation
                  </PrimaryButton>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* 7. WALK-IN WAITLIST MODAL */}
      <Modal
        isOpen={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        title="Add Walk-In Guest to Waitlist"
      >
        <form onSubmit={handleWaitlistSubmit} className="space-y-4">
          <Input
            label="Guest Name"
            id="waitlist_guest_name"
            name="guest_name"
            value={waitlistFormData.guest_name}
            onChange={handleWaitlistFormChange}
            placeholder="e.g. Leslie Alexander"
            required
          />
          <Input
            label="Phone Number"
            id="waitlist_guest_phone"
            name="guest_phone"
            value={waitlistFormData.guest_phone}
            onChange={handleWaitlistFormChange}
            placeholder="e.g. +91 98765 43210"
            required
          />
          <Input
            label="Email Address (Optional)"
            id="waitlist_guest_email"
            name="guest_email"
            value={waitlistFormData.guest_email}
            onChange={handleWaitlistFormChange}
            placeholder="e.g. leslie@gmail.com"
          />
          <Input
            label="Party Size"
            id="waitlist_party_size"
            name="party_size"
            type="number"
            value={waitlistFormData.party_size}
            onChange={handleWaitlistFormChange}
            min="1"
            max="20"
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
            <SecondaryButton onClick={() => setWaitlistModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="shadow-app-sm">
              Join Waitlist Queue
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 8. CANCEL RESERVATION CONFIRMATION MODAL WITH REASONS */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Reservation Confirmation"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 text-app-danger bg-app-danger/10 border border-app-danger/20 p-4 rounded-app-xl">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">
              Are you sure you want to cancel this booking? This will release tables and notify waitlist.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <Select
              label="Cancellation Reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            >
              <option value="change_of_plans">Change of Plans</option>
              <option value="wrong_time_selected">Wrong Time Selected</option>
              <option value="emergency">Emergency</option>
              <option value="restaurant_closed">Restaurant Closed</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </Select>

            {cancelReason === 'other' && (
              <Input
                label="Custom Reason"
                value={cancelCustomReason}
                onChange={(e) => setCancelCustomReason(e.target.value)}
                placeholder="Specify your custom reason..."
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-app-border">
            <SecondaryButton onClick={() => setCancelModalOpen(false)}>
              No, keep booking
            </SecondaryButton>
            <DangerButton onClick={handleCancelConfirm} className="shadow-app-md">
              Yes, cancel booking
            </DangerButton>
          </div>
        </div>
      </Modal>

      {/* 9. REJECT RESERVATION MODAL */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Reservation booking"
      >
        <div className="space-y-5">
          <Textarea
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Provide reason for rejecting this booking (will be emailed)..."
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <SecondaryButton onClick={() => setRejectModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <DangerButton onClick={handleReject}>
              Confirm Reject
            </DangerButton>
          </div>
        </div>
      </Modal>

      {/* 10. NO SHOW MODAL */}
      <Modal
        isOpen={noShowModalOpen}
        onClose={() => setNoShowModalOpen(false)}
        title="Mark Booking as No Show"
      >
        <div className="space-y-5">
          <Input
            label="Internal Notes (Optional)"
            value={noShowReason}
            onChange={(e) => setNoShowReason(e.target.value)}
            placeholder="e.g. Grace period expired, guest unresponsive..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <SecondaryButton onClick={() => setNoShowModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <DangerButton onClick={handleNoShow}>
              Confirm No Show
            </DangerButton>
          </div>
        </div>
      </Modal>

      {/* 11. QR CODE SCANNING CONTROLLER */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => { setQrModalOpen(false); setQrScanInput(''); }}
        title="Scan Customer Seating QR Pass"
      >
        <div className="space-y-6 text-center">
          <div className="w-56 h-56 mx-auto bg-app-elevated border border-app-border rounded-app-xl flex items-center justify-center relative overflow-hidden">
            {scanning ? (
              <div className="space-y-2">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-4 border-app-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-[10px] text-text-muted font-extrabold animate-pulse">LOCKING SCANNER CODE...</p>
              </div>
            ) : scanSuccess ? (
              <div className="space-y-1.5 text-app-success">
                <CheckCircle size={40} className="mx-auto animate-bounce" />
                <p className="text-xs font-bold uppercase tracking-wider">SUCCESS SEATED!</p>
              </div>
            ) : (
              <div className="space-y-2 text-text-muted">
                <QrCode size={48} className="mx-auto" />
                <p className="text-[9px] font-bold">Simulated Seating Camera Ready</p>
              </div>
            )}
            
            {/* Hologram scanner line scanning top-to-bottom */}
            {scanning && (
              <div className="absolute inset-x-0 h-1 bg-app-primary/60 shadow-[0_0_15px_rgba(99,102,241,1)] top-0 animate-scanner-line" />
            )}
          </div>

          <div className="space-y-3.5 max-w-[280px] mx-auto text-xs">
            {bookings.filter(b => ['confirmed', 'checked_in', 'pending'].includes(b.status)).length > 0 && (
              <div className="text-left bg-app-elevated border border-app-border rounded-app-xl p-3 space-y-2">
                <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block">Quick-Select Active Booking:</span>
                <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
                  {bookings.filter(b => ['confirmed', 'checked_in', 'pending'].includes(b.status)).map(b => (
                    <button
                      key={b.id}
                      onClick={() => setQrScanInput(b.id)}
                      className="w-full text-left font-bold text-[10px] text-app-primary hover:underline truncate block"
                      type="button"
                    >
                      👤 {b.guest_name} ({b.status.toUpperCase()})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Input
              label="Enter Booking ID manually"
              value={qrScanInput}
              onChange={(e) => setQrScanInput(e.target.value)}
              placeholder="e.g. 26f16d7a-1e18..."
            />
            
            <PrimaryButton 
              onClick={triggerQRScan} 
              loading={scanning} 
              className="w-full"
              disabled={!qrScanInput}
            >
              Trigger Simulated Scan
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* 12. SHOW CUSTOMER QR CODE GENERATOR - LUXURY AIRLINE BOARDING PASS STYLING */}
      <Modal
        isOpen={qrShowModalOpen}
        onClose={() => setQrShowModalOpen(false)}
        title="DineIn Luxury Boarding Pass"
      >
        {qrBooking && (
          <div className="space-y-6">
            {/* Airline Boarding Pass Container */}
            <div className="bg-[#1e293b] text-white border border-[#334155] rounded-app-2xl overflow-hidden shadow-2xl relative font-sans">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-app-primary to-indigo-600 px-5 py-3.5 flex items-center justify-between border-b border-[#334155]">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-extrabold tracking-widest text-white uppercase">
                    DineIn AI
                  </span>
                  <span className="text-[9px] px-2 py-0.5 bg-white/20 text-white rounded-full uppercase tracking-wider font-extrabold">Boarding Pass</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase text-white/90">
                  {qrBooking.branch_name || 'Main Branch'}
                </span>
              </div>

              {/* Passenger Info Grid */}
              <div className="p-5 grid grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Passenger Name</span>
                  <p className="text-sm font-extrabold truncate">{qrBooking.guest_name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Booking Status</span>
                  <div>
                    <Badge status={getStatusBadge(qrBooking.status)}>{qrBooking.status.toUpperCase()}</Badge>
                  </div>
                </div>

                <div className="space-y-1 col-span-2">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Reservation ID</span>
                  <p className="text-[10px] font-mono text-white/90 break-all select-all">{qrBooking.id}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Date</span>
                  <p className="text-[11px] font-extrabold">{new Date(qrBooking.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Time Slot</span>
                  <p className="text-[11px] font-extrabold">
                    {new Date(qrBooking.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Guests Count</span>
                  <p className="text-[11px] font-extrabold">{qrBooking.party_size} Diners</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Assigned Table</span>
                  <p className="text-[11px] font-extrabold text-app-primary">
                    {qrBooking.assigned_tables?.length > 0 
                      ? qrBooking.assigned_tables.map(n => `T-${n}`).join(', ') 
                      : 'Unassigned'}
                  </p>
                </div>
              </div>

              {/* Dotted Separator with ticket cutouts on left/right */}
              <div className="relative flex items-center justify-center my-1">
                <div className="absolute left-[-8px] w-4 h-4 rounded-full bg-app-bg border border-[#334155]" />
                <div className="w-full border-t border-dashed border-[#475569] mx-4" />
                <div className="absolute right-[-8px] w-4 h-4 rounded-full bg-app-bg border border-[#334155]" />
              </div>

              {/* QR Code and Scan info */}
              <div className="p-5 flex flex-col items-center justify-center space-y-3">
                <div className="bg-white p-3 rounded-app-2xl w-36 h-36 flex items-center justify-center border border-[#334155] shadow-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrBooking.id}`}
                    alt="DineIn QR Pass"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-extrabold">Scan Pass at Reception</p>
              </div>

              {/* Ticket Footer details */}
              <div className="bg-[#1e293b] px-5 py-3 border-t border-[#334155] text-left text-[9px] text-text-muted flex justify-between items-center font-semibold">
                <span>DineIn AI Digital boarding pass</span>
                <span>Support: support@dinein.ai</span>
              </div>
            </div>

            {/* Quick Actions Boarding Pass Bar */}
            <div className="grid grid-cols-3 gap-2">
              <SecondaryButton 
                onClick={() => {
                  const addr = qrBooking.address || qrBooking.branch_name || 'Bangalore Main Branch';
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
                }}
                className="text-[9px] font-bold h-9 flex items-center justify-center gap-1"
              >
                Google Maps
              </SecondaryButton>

              <SecondaryButton 
                onClick={() => {
                  setQrShowModalOpen(false);
                  setSelectedBooking(qrBooking);
                  fetchBookingHistory(qrBooking.id);
                  setDrawerOpen(true);
                }}
                className="text-[9px] font-bold h-9"
              >
                View Booking
              </SecondaryButton>

              {['pending', 'confirmed', 'arrived', 'seated', 'dining', 'checkout_requested'].includes(qrBooking.status) && (
                <DangerButton 
                  onClick={() => {
                    setQrShowModalOpen(false);
                    handleCancelClick(qrBooking);
                  }}
                  className="text-[9px] font-bold h-9"
                >
                  Cancel Pass
                </DangerButton>
              )}
            </div>
          </div>
        )}
      </Modal>

    </motion.div>
  );
};

export default Reservations;
