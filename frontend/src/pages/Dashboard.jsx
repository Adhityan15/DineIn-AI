import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useRealTime } from '../contexts/RealTimeContext';
import client from '../api/client';
import {
  Calendar,
  AlertTriangle,
  Clock,
  Heart,
  TrendingUp,
  DollarSign,
  Users,
  Utensils,
  Plus,
  ArrowRight,
  TrendingDown,
  Info,
  CalendarDays,
  Sparkles,
  Activity,
  Award,
  Zap,
  ShieldCheck,
  BrainCircuit,
  ChefHat,
  History,
  CreditCard,
  Inbox,
  User,
  Eye,
  Megaphone,
  Send,
  Boxes,
  Building2,
  FileSpreadsheet,
  Bell,
  LineChart,
  Settings,
  Trash2,
  Check,
  X,
  Briefcase,
  Shield,
  Mail,
  Download,
  MapPin
} from 'lucide-react';
import {
  AppCard,
  GlassCard,
  SectionCard,
  ChartCard,
  KPICard,
  PrimaryButton,
  SecondaryButton,
  AnimatedCounter,
  Badge,
  LoadingOverlay
} from '../components/DesignSystem';

// Stagger entry configurations
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

const CustomerDashboard = ({ user, navigate, itemVariants }) => {
  const { addToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('overview');
  
  // Data States
  const [nextBooking, setNextBooking] = useState(null);
  const [bookingsList, setBookingsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [invoicesList, setInvoicesList] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Forms
  const [joinWaitlistForm, setJoinWaitlistForm] = useState({
    party_size: 2,
    notes: ''
  });
  
  // Modal Invoice Detail State
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchCustomerData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      // 1. Fetch Reservations/Bookings
      const resBookings = await client.get('/reservation/bookings/');
      const bookings = Array.isArray(resBookings.data) ? resBookings.data : (resBookings.data?.results || []);
      setBookingsList(bookings);
      
      // Find next future active booking
      const future = bookings
        .filter(b => ['pending', 'confirmed', 'reminder_sent', 'checked_in', 'arrived', 'seated', 'dining'].includes(b.status))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0];
      setNextBooking(future || null);

      // 2. Fetch Orders List
      const resOrders = await client.get('/inventory/orders/');
      setOrdersList(Array.isArray(resOrders.data) ? resOrders.data : (resOrders.data?.results || []));

      // 3. Fetch Invoices
      const resInvoices = await client.get('/branches/invoices/');
      setInvoicesList(Array.isArray(resInvoices.data) ? resInvoices.data : (resInvoices.data?.results || []));

      // 4. Fetch In-App Notifications
      const resNotifs = await client.get('/communication/notifications/');
      setNotificationsList(Array.isArray(resNotifs.data) ? resNotifs.data : (resNotifs.data?.results || []));
    } catch (err) {
      console.error('Failed to load customer dashboard details:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
    window.addEventListener('branchUpdate', fetchCustomerData);
    return () => {
      window.removeEventListener('branchUpdate', fetchCustomerData);
    };
  }, [user]);

  const handleCancelBooking = async (bookingId) => {
    try {
      await client.post(`/reservation/bookings/${bookingId}/cancel/`, {
        reason: 'Cancelled by customer via portal'
      });
      addToast('Reservation cancelled successfully.', 'success');
      fetchCustomerData();
    } catch (err) {
      addToast('Failed to cancel reservation.', 'error');
    }
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    try {
      const activeBranchId = localStorage.getItem('branch_id') || user?.branch || '';
      if (!activeBranchId) {
        addToast('Please select a branch first.', 'error');
        return;
      }
      await client.post('/reservation/waitlist/join/', {
        branch: activeBranchId,
        guest_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Valued Diner',
        guest_phone: user?.phone || '9999999999',
        guest_email: user?.email,
        party_size: Number(joinWaitlistForm.party_size),
        notes: joinWaitlistForm.notes
      });
      addToast('Joined virtual waitlist successfully!', 'success');
      setJoinWaitlistForm({ party_size: 2, notes: '' });
      fetchCustomerData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to join waitlist.', 'error');
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await client.post(`/communication/notifications/${id}/read/`);
      addToast('Notification marked read.', 'info');
      fetchCustomerData();
    } catch (err) {
      console.error(err);
    }
  };

  const repeatOrder = async (orderItems) => {
    try {
      const activeBranchId = localStorage.getItem('branch_id') || user?.branch || '';
      if (!activeBranchId) {
        addToast('Please select a branch first.', 'error');
        return;
      }
      // Re-create order mapping items
      const payload = {
        branch: activeBranchId,
        source: 'direct',
        order_type: 'takeaway',
        customer_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Customer',
        customer_phone: user?.phone || '',
        items: orderItems.map(item => ({
          menu_item: item.menu_item,
          quantity: item.quantity,
          unit_price: Number(item.unit_price)
        }))
      };
      await client.post('/inventory/orders/', payload);
      addToast('Previous order repeated successfully! Sent to KDS.', 'success');
      fetchCustomerData();
    } catch (err) {
      addToast('Failed to repeat order.', 'error');
    }
  };

  // Helper to resolve loyalty progress and thresholds
  const points = user?.loyalty_points || 0;
  const currentTier = (user?.loyalty_tier || 'silver').toLowerCase();
  
  let nextTier = 'Gold';
  let targetPoints = 500;
  if (currentTier === 'gold') {
    nextTier = 'Platinum';
    targetPoints = 1500;
  } else if (currentTier === 'platinum') {
    nextTier = 'Diamond';
    targetPoints = 3000;
  } else if (currentTier === 'diamond') {
    nextTier = 'Maximum Status';
    targetPoints = points;
  }

  const progressPercentage = targetPoints > 0 ? Math.min(100, (points / targetPoints) * 100) : 100;

  return (
    <div className="space-y-app-24 relative min-h-[85vh]">
      {/* Tab Switcher Headers */}
      <GlassCard className="p-2.5 flex flex-wrap gap-2 items-center justify-between border-app-border bg-app-surface/60">
        <div className="flex flex-wrap gap-1.5">
          {['overview', 'reservations', 'orders', 'loyalty', 'notifications', 'recommendations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 rounded-app-lg text-xs font-bold uppercase tracking-wider transition ${
                activeSubTab === tab 
                  ? 'bg-app-primary text-white shadow-app-md' 
                  : 'text-text-secondary hover:bg-app-hover/50'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <SecondaryButton onClick={() => navigate('/dashboard/profile')} icon={User} className="text-xs font-bold py-2">
          Manage Profile
        </SecondaryButton>
      </GlassCard>

      <div className="space-y-app-24">
          
          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-app-24">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-app-20">
                <GlassCard className="lg:col-span-2 p-6 flex flex-col justify-between min-h-[180px] bg-gradient-to-r from-app-surface to-app-primary/[0.04]">
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-app-primary uppercase tracking-wider">Customer Portal</span>
                    <h2 className="text-xl font-bold text-text-primary">Welcome Back, {user?.first_name || 'Guest'}!</h2>
                    <p className="text-xs text-text-secondary max-w-md">
                      Enjoy premium dining experiences, earn loyalty reward points, and track reservations in real-time.
                    </p>
                  </div>
                  <div className="flex gap-4 pt-4 mt-2 border-t border-app-border">
                    <SecondaryButton onClick={() => navigate('/dashboard/reservations')} icon={Calendar}>
                      Book Table
                    </SecondaryButton>
                    <SecondaryButton onClick={() => navigate('/dashboard/menu')} icon={Utensils}>
                      Explore Menu
                    </SecondaryButton>
                  </div>
                </GlassCard>

                {/* Loyalty Tier Progress details */}
                <AppCard className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border-app-primary/20 flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 uppercase">
                      <Award size={14} />
                      <span>{currentTier.toUpperCase()} Membership</span>
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      Ref: {user?.referral_code || 'N/A'}
                    </span>
                  </div>
                  <div className="my-3">
                    <p className="text-[10px] text-slate-400">Available Points Balance</p>
                    <p className="text-2xl font-black text-white">{points} pts</p>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-yellow-400 h-full" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-medium">
                    {currentTier === 'diamond' 
                      ? 'Highest VIP loyalty tier reached.' 
                      : `${targetPoints - points} points remaining to ${nextTier} tier.`}
                  </p>
                </AppCard>
              </div>

              {/* Next upcoming reservation digital pass */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-app-20">
                <div className="lg:col-span-2">
                  <SectionCard title="Your Next Reservation" subtitle="Real-time check-in pass details">
                    {nextBooking ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-app-border rounded-app-lg bg-app-surface/40">
                          <div className="space-y-1">
                            <p className="text-xs font-extrabold text-text-primary">
                              {new Date(nextBooking.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {new Date(nextBooking.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} • {nextBooking.party_size} Guests
                            </p>
                            <p className="text-[10px] text-text-secondary font-semibold">
                              Status: <Badge status={nextBooking.status === 'confirmed' ? 'success' : 'info'}>{nextBooking.status}</Badge>
                            </p>
                          </div>
                          {/* QR Pass */}
                          {['confirmed', 'reminder_sent', 'pending'].includes(nextBooking.status) && (
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="w-16 h-16 bg-white p-1 rounded border">
                                <img 
                                  src={`https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${nextBooking.id}&choe=UTF-8`} 
                                  alt="Reservation Pass QR"
                                  className="w-full h-full"
                                />
                              </div>
                              <span className="text-[8px] font-bold text-text-muted uppercase">Digital Pass</span>
                            </div>
                          )}
                        </div>
                        {nextBooking.status !== 'cancelled' && (
                          <div className="flex justify-end gap-3 pt-2">
                            <SecondaryButton 
                              onClick={() => handleCancelBooking(nextBooking.id)}
                              className="text-app-danger hover:bg-app-danger/10 border-app-danger/20"
                            >
                              Cancel Reservation
                            </SecondaryButton>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-text-muted font-medium">
                        No upcoming reservations found. <span className="text-app-primary cursor-pointer hover:underline" onClick={() => navigate('/dashboard/reservations')}>Book one now!</span>
                      </div>
                    )}
                  </SectionCard>
                </div>

                {/* Promo Coupon Offers */}
                <SectionCard title="Active Coupons" subtitle="Exclusive rewards & tier deals">
                  <div className="space-y-3">
                    <div className="p-3 border border-yellow-500/20 bg-yellow-500/5 rounded-app-lg flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-text-primary">Welcome Coupon</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">Use code **WELCOME10** for 10% off today's visit.</p>
                      </div>
                      <span className="text-[9px] font-black text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                    <div className="p-3 border border-app-border rounded-app-lg flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-text-primary">Referral Bonus</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">Share code **{user?.referral_code}** and earn **150 points** each!</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {/* TAB 2: RESERVATIONS HISTORY & WAITLIST */}
          {activeSubTab === 'reservations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-app-24 items-start">
              <div className="lg:col-span-2">
                <SectionCard title="Reservation History" subtitle="List of all booking sessions">
                  <div className="overflow-x-auto border border-app-border rounded-app-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-app-elevated/40 text-[10px] text-text-muted border-b border-app-border font-extrabold uppercase">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Time</th>
                          <th className="py-3 px-4">Guests</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-app-border text-xs text-text-secondary">
                        {bookingsList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-text-muted font-medium">No reservations recorded yet.</td>
                          </tr>
                        ) : bookingsList.map(res => (
                          <tr key={res.id} className="hover:bg-app-hover/30 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-text-primary">
                              {new Date(res.start_time).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4">
                              {new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3.5 px-4 font-bold">{res.party_size}</td>
                            <td className="py-3.5 px-4">
                              <Badge status={res.status === 'confirmed' ? 'success' : res.status === 'cancelled' ? 'danger' : 'info'}>
                                {res.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4">
                              {['pending', 'confirmed'].includes(res.status) && (
                                <button
                                  onClick={() => handleCancelBooking(res.id)}
                                  className="text-app-danger hover:underline font-bold"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>

              {/* Join Waitlist Form */}
              <div className="space-y-4">
                <SectionCard title="Join Virtual Waitlist" subtitle="Instantly register for wait queue">
                  <form onSubmit={handleJoinWaitlist} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-text-muted">Party Size</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={joinWaitlistForm.party_size}
                        onChange={(e) => setJoinWaitlistForm(p => ({ ...p, party_size: e.target.value }))}
                        className="w-full px-3 py-2 border border-app-border rounded-app-lg bg-app-surface text-text-primary text-xs outline-none focus:border-app-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-text-muted">Special Requests / Seating Notes</label>
                      <textarea
                        value={joinWaitlistForm.notes}
                        onChange={(e) => setJoinWaitlistForm(p => ({ ...p, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-app-border rounded-app-lg bg-app-surface text-text-primary text-xs outline-none focus:border-app-primary h-20"
                        placeholder="e.g. Window booth, high chair needed..."
                      />
                    </div>
                    <PrimaryButton type="submit" className="w-full py-2 text-xs font-bold uppercase tracking-wider">
                      Join Roster Queue
                    </PrimaryButton>
                  </form>
                </SectionCard>
              </div>
            </div>
          )}

          {/* TAB 3: ORDER HISTORY & INVOICES */}
          {activeSubTab === 'orders' && (
            <SectionCard title="Order History & Receipts" subtitle="Audit previous order invoices">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-app-20">
                {ordersList.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-text-muted font-medium">No order receipts available.</div>
                ) : ordersList.map(order => {
                  const invoice = invoicesList.find(inv => inv.order === order.id || inv.reservation === order.reservation);
                  return (
                    <AppCard key={order.id} className="p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black text-text-primary uppercase tracking-wider">Order #{order.id.slice(0, 6)}</span>
                            <p className="text-[9px] text-text-muted mt-0.5 capitalize">{order.order_type.replace('_', ' ')} • {order.source}</p>
                          </div>
                          <Badge status={order.status === 'completed' ? 'success' : 'info'}>{order.status}</Badge>
                        </div>
                        <div className="text-xs font-bold text-text-primary">
                          Total Amount: ₹{order.total_amount}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-app-border/40 flex justify-between gap-2">
                        <SecondaryButton 
                          onClick={() => repeatOrder(order.items)} 
                          className="py-1 px-3 text-[10px] font-bold"
                        >
                          Repeat Order
                        </SecondaryButton>
                        {invoice && (
                          <PrimaryButton
                            onClick={() => setSelectedInvoice(invoice)}
                            className="py-1 px-3 text-[10px] font-bold"
                          >
                            View Invoice
                          </PrimaryButton>
                        )}
                      </div>
                    </AppCard>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* TAB 4: LOYALTY CARD & TIER STATUS */}
          {activeSubTab === 'loyalty' && (
            <div className="max-w-2xl mx-auto space-y-app-24">
              
              {/* Premium membership card display */}
              <div className={`p-6 rounded-app-xl border text-white shadow-app-xl relative overflow-hidden bg-gradient-to-r ${
                currentTier === 'diamond' ? 'from-purple-900 via-indigo-950 to-slate-900 border-purple-500/30' :
                currentTier === 'platinum' ? 'from-slate-700 via-slate-800 to-slate-950 border-slate-500/20' :
                currentTier === 'gold' ? 'from-amber-600 via-yellow-700 to-amber-950 border-yellow-500/30' :
                'from-slate-800 to-slate-900 border-slate-700'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-white/50 uppercase">DineIn AI Pass</span>
                    <h3 className="text-lg font-bold capitalize mt-0.5">{currentTier} Member Card</h3>
                  </div>
                  <Award className={`w-8 h-8 ${
                    currentTier === 'diamond' ? 'text-purple-400' :
                    currentTier === 'platinum' ? 'text-slate-300' :
                    currentTier === 'gold' ? 'text-yellow-400' :
                    'text-slate-400'
                  }`} />
                </div>

                <div className="mt-8 space-y-1">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">Card Holder</p>
                  <p className="text-sm font-bold">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Loyal Diner'}</p>
                </div>

                <div className="mt-6 flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-white/50 uppercase tracking-widest">Rewards Points Balance</p>
                    <p className="text-xl font-black text-yellow-400">{points} pts</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-white p-1 rounded">
                      {/* Simulated barcode */}
                      <div className="h-6 w-24 bg-slate-950 flex gap-0.5">
                        <div className="h-full w-1 bg-white"></div>
                        <div className="h-full w-1.5 bg-white"></div>
                        <div className="h-full w-0.5 bg-white"></div>
                        <div className="h-full w-2 bg-white"></div>
                        <div className="h-full w-1 bg-white"></div>
                      </div>
                    </div>
                    <span className="text-[7px] text-white/40 font-mono tracking-widest">{user?.id?.slice(0, 13)}</span>
                  </div>
                </div>
              </div>

              {/* Tier benefits matrix */}
              <SectionCard title="Tier Membership Benefits" subtitle="Progress status details">
                <div className="space-y-3">
                  <div className={`p-3 border rounded-app-lg flex justify-between items-center ${currentTier === 'silver' ? 'border-app-primary bg-app-primary/[0.02]' : 'border-app-border'}`}>
                    <div>
                      <p className="text-xs font-bold text-text-primary">Silver Status</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">Earn 1 pt per ₹10 spent. Free birthday beverage dessert reward coupon.</p>
                    </div>
                    {currentTier === 'silver' && <Badge status="info">Current</Badge>}
                  </div>
                  <div className={`p-3 border rounded-app-lg flex justify-between items-center ${currentTier === 'gold' ? 'border-yellow-500 bg-yellow-500/[0.02]' : 'border-app-border'}`}>
                    <div>
                      <p className="text-xs font-bold text-text-primary">Gold Status (500+ pts)</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">Earn 1.2x reward points multipliers. Early access queue to priority seating bookings.</p>
                    </div>
                    {currentTier === 'gold' && <Badge status="warning">Current</Badge>}
                  </div>
                  <div className={`p-3 border rounded-app-lg flex justify-between items-center ${currentTier === 'platinum' ? 'border-slate-400 bg-slate-400/[0.02]' : 'border-app-border'}`}>
                    <div>
                      <p className="text-xs font-bold text-text-primary">Platinum Status (1500+ pts)</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">Earn 1.5x reward points multipliers. Zero booking reservation fee charges.</p>
                    </div>
                    {currentTier === 'platinum' && <Badge status="success">Current</Badge>}
                  </div>
                  <div className={`p-3 border rounded-app-lg flex justify-between items-center ${currentTier === 'diamond' ? 'border-purple-500 bg-purple-500/[0.02]' : 'border-app-border'}`}>
                    <div>
                      <p className="text-xs font-bold text-text-primary">Diamond VIP Status (3000+ pts)</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">Earn 2x rewards. Complementary valet check parking & personal dining table reservations concierge.</p>
                    </div>
                    {currentTier === 'diamond' && <Badge status="info">Current</Badge>}
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS INBOX */}
          {activeSubTab === 'notifications' && (
            <SectionCard title="Notification Center" subtitle="Direct alerts and event logs">
              <div className="space-y-3">
                {notificationsList.length === 0 ? (
                  <div className="py-8 text-center text-text-muted font-medium">Inbox is empty.</div>
                ) : notificationsList.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`p-4 border rounded-app-lg flex justify-between items-start transition ${
                      notif.is_read ? 'border-app-border bg-app-surface/20 opacity-80' : 'border-app-primary/30 bg-app-primary/[0.02]'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-text-primary">{notif.title}</p>
                      <p className="text-[10px] text-text-secondary leading-relaxed">{notif.message}</p>
                      <p className="text-[8px] text-text-muted">{new Date(notif.created_at).toLocaleString()}</p>
                    </div>
                    {!notif.is_read && (
                      <button 
                        onClick={() => markNotificationRead(notif.id)}
                        className="text-[9px] font-black text-app-primary border border-app-primary/30 px-2 py-0.5 rounded hover:bg-app-primary/5 transition"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* TAB 6: AI RECOMMENDATIONS */}
          {activeSubTab === 'recommendations' && (
            <div className="max-w-2xl mx-auto space-y-app-24">
              <GlassCard className="p-6 bg-gradient-to-r from-app-surface to-app-primary/[0.04] space-y-4">
                <div className="flex items-center gap-1.5 text-app-primary font-bold text-[10px] uppercase tracking-wider">
                  <Sparkles size={14} className="animate-pulse" />
                  Gemini Gastronomy Engine
                </div>
                <h3 className="text-sm font-extrabold text-text-primary tracking-tight">Personalized Culinary Recommendations</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Based on your loyalty status (**{currentTier}**) and previous orders list context, Gemini recomends adding these trending pairings to your next invoice:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  <div className="p-3 border border-app-border rounded-app-lg bg-app-surface/40 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-text-primary">Truffle Parmesan Fries</p>
                      <p className="text-[9px] text-text-muted">High frequency ordering pairing</p>
                    </div>
                    <span className="text-xs font-black text-app-primary">₹8.50</span>
                  </div>
                  <div className="p-3 border border-app-border rounded-app-lg bg-app-surface/40 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-text-primary">Classic Espresso Martini</p>
                      <p className="text-[9px] text-text-muted">Top beverage choice today</p>
                    </div>
                    <span className="text-xs font-black text-app-primary">₹12.00</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

        </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-app-surface border border-app-border rounded-app-xl shadow-app-xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-app-border flex justify-between items-center bg-app-elevated/40">
              <div>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Invoice Audit Details</span>
                <h3 className="text-xs font-bold text-text-primary mt-0.5">#{selectedInvoice.id.slice(0, 8)}</h3>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs" id="invoice-print-area">
              <div className="text-center space-y-1 pb-3 border-b border-app-border/40">
                <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">{selectedInvoice.branch_name || 'DineIn AI'}</h4>
                <p className="text-[9px] text-text-muted">Date: {new Date(selectedInvoice.created_at).toLocaleString()}</p>
              </div>

              {/* Invoiced subtotals */}
              <div className="space-y-2 py-3">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>₹{Number(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>CGST/SGST (5.0%)</span>
                  <span>₹{(Number(selectedInvoice.subtotal) * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Service Charge (10.0%)</span>
                  <span>₹{(Number(selectedInvoice.subtotal) * 0.1).toFixed(2)}</span>
                </div>
                {Number(selectedInvoice.discount) > 0 && (
                  <div className="flex justify-between text-app-danger">
                    <span>Discount Coupon</span>
                    <span>-${Number(selectedInvoice.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-primary font-black text-sm pt-2 border-t border-app-border/40">
                  <span>Grand Total</span>
                  <span>₹{Number(selectedInvoice.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-[9px] text-text-muted font-bold uppercase tracking-wider">
                <span>Method: {selectedInvoice.payment_method}</span>
                <span>Status: {selectedInvoice.status}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-app-border flex justify-end gap-3 bg-app-elevated/20">
              <SecondaryButton onClick={() => setSelectedInvoice(null)}>
                Close
              </SecondaryButton>
              <PrimaryButton 
                onClick={() => {
                  window.print();
                  addToast('Receipt document print triggered.', 'success');
                }}
                className="py-1 px-4 text-xs font-bold uppercase tracking-wider"
              >
                Print Receipt
              </PrimaryButton>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

const StaffDashboard = ({ user, navigate, itemVariants }) => {
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('absent');
  const [clockInTime, setClockInTime] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await client.get('/workforce/attendance/');
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.data || []);
        const today = new Date().toISOString().split('T')[0];
        const todayAtt = list.find(a => a.date === today);
        if (todayAtt) {
          setAttendanceStatus(todayAtt.clock_out ? 'completed' : 'present');
          setClockInTime(todayAtt.clock_in);
        }
      } catch (err) {
        console.error('Error loading staff attendance:', err);
      }
    };
    fetchAttendance();
  }, []);

  const handleClockInOut = async () => {
    setLoading(true);
    try {
      if (attendanceStatus === 'absent') {
        const res = await client.post('/workforce/attendance/clock-in/', {
          latitude: 12.9716,
          longitude: 77.5946,
        });
        if (res.status === 200 || res.status === 201) {
          addToast('Clock-in recorded successfully. Welcome to shift!', 'success');
          setAttendanceStatus('present');
          setClockInTime(new Date().toISOString());
        }
      } else if (attendanceStatus === 'present') {
        const res = await client.post('/workforce/attendance/clock-out/');
        if (res.status === 200 || res.status === 204) {
          addToast('Clock-out recorded. Have a great day!', 'info');
          setAttendanceStatus('completed');
        }
      }
    } catch (err) {
      addToast('Failed to record attendance. Verify geofence boundaries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-app-24">
      {/* 1. CLOCK PANEL & SHIFT DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-app-20">
        <GlassCard className="lg:col-span-2 p-6 flex flex-col justify-between min-h-[180px] bg-gradient-to-r from-app-surface to-app-primary/[0.04]">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-app-primary uppercase tracking-wider">Staff Portal</span>
            <h2 className="text-xl font-bold text-text-primary">Shift Control Dashboard</h2>
            <p className="text-xs text-text-secondary max-w-md">
              Manage seating allocations, check-in guests, and monitor shift rosters in real-time.
            </p>
          </div>
          <div className="flex gap-4 pt-4 mt-2 border-t border-app-border">
            <SecondaryButton onClick={() => navigate('/dashboard/reservations')} icon={Calendar}>
              Reservations Drawer
            </SecondaryButton>
            <SecondaryButton onClick={() => navigate('/dashboard/showcase')} icon={Eye}>
              Check-In QR Scan
            </SecondaryButton>
          </div>
        </GlassCard>

        {/* Shift log attendance card */}
        <AppCard className="p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-app-surface to-app-primary/[0.02]">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Shift Attendance</span>
            <h3 className="text-sm font-bold text-text-primary">Today's Shift: Morning Service</h3>
            {attendanceStatus === 'present' && (
              <p className="text-[10px] text-app-success font-semibold">
                Clocked-in since: {new Date(clockInTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          
          <div className="mt-4">
            <PrimaryButton 
              onClick={handleClockInOut} 
              disabled={loading || attendanceStatus === 'completed'}
              className={`w-full py-2.5 font-bold shadow-app-md ${
                attendanceStatus === 'present' ? 'bg-app-danger hover:bg-app-danger-dark' : ''
              }`}
            >
              {loading ? 'Processing...' : 
               attendanceStatus === 'absent' ? 'Clock In Shift' : 
               attendanceStatus === 'present' ? 'Clock Out Shift' : 'Shift Completed'}
            </PrimaryButton>
          </div>
        </AppCard>
      </div>

      {/* 2. TASK MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-app-20">
        <div className="lg:col-span-2">
          <SectionCard title="Active Seating Allocation" subtitle="Interactive operations table summary">
            <div className="py-8 text-center text-xs text-text-muted font-medium">
              Ready to seat walk-in guests? Open the <span className="text-app-primary cursor-pointer hover:underline" onClick={() => navigate('/dashboard/reservations')}>Reservations Panel</span> or Floor Map.
            </div>
          </SectionCard>
        </div>
        
        <SectionCard title="Shift Notifications" subtitle="Roster updates & alerts stream">
          <div className="space-y-3">
            <div className="p-3 border border-app-border rounded-app-lg text-[10px] text-text-secondary leading-relaxed">
              **Notice**: Morning Shift table check-in reports must be filed by 2:00 PM today.
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeInsight, setActiveInsight] = useState(0);
  const [activeBranchName, setActiveBranchName] = useState(localStorage.getItem('branch_name') || user?.branch_name || 'Bangalore Main Branch');

  useEffect(() => {
    const handleBranchChange = () => {
      setActiveBranchName(localStorage.getItem('branch_name') || user?.branch_name || 'Bangalore Main Branch');
    };
    window.addEventListener('branchUpdate', handleBranchChange);
    return () => {
      window.removeEventListener('branchUpdate', handleBranchChange);
    };
  }, [user?.branch_name]);
  const { stats } = useRealTime();
  const liveStats = {
    reservationsCount: stats.active_reservations,
    availableTablesCount: stats.available_tables,
    waitlistCount: stats.waitlist_count,
    inventoryAlertsCount: stats.inventory_alerts,
    staffCount: stats.staff_attendance,
    avgRating: stats.avg_rating.toString()
  };

  const aiForecast = stats.ai_forecast || {
    predicted_rush_hours: "12:00 - 14:00 (Lunch Rush), 19:00 - 21:30 (Dinner Peak)",
    predicted_revenue_tomorrow: 540.00,
    predicted_occupancy_tomorrow: 84,
    recommended_inventory_restock: ["Cheddar Cheese", "Burger Patties", "Lettuce Leaves"]
  };

  // Track live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock activity feed logs
  const activities = [
    {
      title: "New Reservation Confirmed",
      desc: "Courtney Henry (Table 12, 4 Guests) for 7:30 PM",
      time: "10m ago",
      icon: CalendarDays,
      status: "success"
    },
    {
      title: "Inventory Stock Level Alert",
      desc: "Mozzarella Cheese is below safety threshold (1.2 kg remaining)",
      time: "25m ago",
      icon: AlertTriangle,
      status: "danger"
    },
    {
      title: "Sentiment review synced",
      desc: "Google Review: 'Amazing ribeye steak and rapid seating service!' (5/5)",
      time: "1h ago",
      icon: Heart,
      status: "info"
    },
    {
      title: "Roster clock-in verified",
      desc: "Chef Ronald clocked in (GPS check matches branch coordinates)",
      time: "2h ago",
      icon: Users,
      status: "info"
    },
    {
      title: "POS Menu Synchronized",
      desc: "Petpooja POS synced 14 menu updates successfully",
      time: "3h ago",
      icon: Sparkles,
      status: "success"
    }
  ];


  if (user?.role === 'customer') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-app-24 animate-fade-in relative min-h-[85vh]"
      >
        <CustomerDashboard user={user} navigate={navigate} itemVariants={itemVariants} />
      </motion.div>
    );
  }

  if (['kitchen_staff', 'receptionist', 'staff'].includes(user?.role)) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-app-24 animate-fade-in relative min-h-[85vh]"
      >
        <StaffDashboard user={user} navigate={navigate} itemVariants={itemVariants} />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-app-24 animate-fade-in relative min-h-[85vh]"
    >
      {/* COMPACT LIVE OPERATIONS STATUS STRIP */}
      <motion.div variants={itemVariants}>
        <div className="glass-card-surface py-2.5 px-4 rounded-app-xl flex flex-wrap items-center justify-between gap-3 border border-[var(--color-border)] shadow-sm theme-transition">
          {/* Left: Live pulse indicator and telemetry details */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]"></span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-primary)]">
                LIVE OPERATIONS
              </span>
            </div>

            <span className="text-[var(--color-border)] hidden sm:inline">|</span>

            <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
              Last synced: <span className="text-[var(--color-text-secondary)]">Just now</span>
            </span>

            <span className="text-[var(--color-border)] hidden sm:inline">|</span>

            <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
              Branch: <span className="text-[var(--color-primary)] font-extrabold">{activeBranchName || 'ADAMBAKKAM-CHENNAI'}</span>
            </span>
          </div>

          {/* Right: Operational sync status badges */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-extrabold select-none">
            <span className="px-2.5 py-1 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 flex items-center gap-1">
              ✓ Reservations synced
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 flex items-center gap-1">
              ✓ POS synced
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[var(--color-purple)]/10 text-[var(--color-purple)] border border-[var(--color-purple)]/20 flex items-center gap-1">
              ✓ Inventory synced
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] border border-[var(--color-cyan)]/20 flex items-center gap-1">
              ✓ CRM synced
            </span>
          </div>
        </div>
      </motion.div>

      {/* 1. EXECUTIVE HERO BANNER WITH ROTATING AI GLOW */}
      <motion.div variants={itemVariants}>
        <GlassCard className="relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-app-20 border-app-primary/25 bg-gradient-to-r from-app-surface via-app-surface to-app-primary/5 animate-rotate-gradient bg-[length:200%_200%] shadow-[0_4px_24px_rgba(99,102,241,0.08)]">
          {/* Neon particle glows */}
          <div className="absolute top-0 right-0 w-80 h-full opacity-10 dark:opacity-20 pointer-events-none">
            <div className="absolute right-[-40px] top-[-40px] w-64 h-64 rounded-full bg-gradient-to-br from-app-primary to-indigo-500 blur-3xl animate-pulse"></div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-primary/10 text-app-primary border border-app-primary/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                <BrainCircuit size={12} className="animate-spin duration-3000" />
                DineIn AI OS Live
              </span>
              <Badge status="success">System Health: 98%</Badge>
            </div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Welcome back, {user?.name || 'User'} 👋
            </h1>
            <p className="text-xs text-text-secondary font-medium">
              Enterprise hospitality operating system tracking active operations logs.
            </p>
          </div>
          
          {/* Quick status details */}
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 border border-app-border rounded-full">
              <Clock size={12} />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            <Badge status="info">
              📍 {activeBranchName}
            </Badge>
          </div>
        </GlassCard>
      </motion.div>

      {/* 2. ROLE-AWARE ANIMATED KPI GRID WITH EXECUTIVE METRICS */}
      {user?.role === 'owner' ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-app-20">
          <KPICard
            title="Company Monthly Revenue"
            value={<span>₹248,500</span>}
            change="+18.4%"
            trend="up"
            icon={DollarSign}
            description="Combined multi-branch gross revenue"
          />
          <KPICard
            title="Executive Net Profit"
            value={<span>31.2%</span>}
            change="+2.8%"
            trend="up"
            icon={TrendingUp}
            description="Overall company net margin"
          />
          <KPICard
            title="Active Enterprise Branches"
            value={<span>4 Branches</span>}
            change="100% Operational"
            trend="up"
            icon={Building2}
            description="Bangalore, Indiranagar, HSR, Koramangala"
          />
          <KPICard
            title="Total Roster Headcount"
            value={<span>142 Employees</span>}
            icon={Users}
            description="Active payroll headcount across branches"
          />
        </motion.div>
      ) : localStorage.getItem('is_cloud_kitchen') === 'true' ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-app-20">
          <KPICard
            title="Today's Delivery Sales"
            value={<span>₹{liveStats.reservationsCount * 12}</span>}
            change="+22%"
            trend="up"
            icon={DollarSign}
            description="Total processed Swiggy/Zomato orders"
          />
          <KPICard
            title="Active KDS Tickets"
            value={<AnimatedCounter value={liveStats.reservationsCount} />}
            icon={ChefHat}
            description="Orders currently in preparation queue"
          />
          <KPICard
            title="Average Dispatch Time"
            value={<span>12m</span>}
            icon={Clock}
            description="Average cook-to-deliver duration"
          />
          <KPICard
            title="Inventory Alerts"
            value={<AnimatedCounter value={liveStats.inventoryAlertsCount} />}
            trend={liveStats.inventoryAlertsCount > 0 ? 'down' : 'up'}
            icon={AlertTriangle}
            description="Ingredients under safety margin"
          />
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-app-20">
          <KPICard
            title="Today's Reservations"
            value={<AnimatedCounter value={liveStats.reservationsCount} />}
            change="+15%"
            trend="up"
            icon={Calendar}
            description="Total active and seated reservations"
          />
          <KPICard
            title="Available Tables"
            value={<AnimatedCounter value={liveStats.availableTablesCount} />}
            icon={Utensils}
            description="Ready to receive walk-in clients"
          />
          <KPICard
            title="Active Waitlist Queue"
            value={<AnimatedCounter value={liveStats.waitlistCount} />}
            icon={Users}
            description="Guests in WhatsApp-notified wait queue"
          />
          <KPICard
            title="Inventory Stock Alerts"
            value={<AnimatedCounter value={liveStats.inventoryAlertsCount} />}
            trend={liveStats.inventoryAlertsCount > 0 ? 'down' : 'up'}
            icon={AlertTriangle}
            description="Ingredients under safety margin"
          />
        </motion.div>
      )}

      {/* 3. QUICK ACTIONS SHORTCUT BAR (7 Core Enterprise Shortcuts) */}
      <motion.div variants={itemVariants}>
        <AppCard className="p-5 hover:border-app-primary/10">
          <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block mb-4">
            Quick Operations Shortcuts
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <PrimaryButton
              onClick={() => navigate('/dashboard/reservations')}
              icon={Calendar}
              className="w-full h-11 text-[11px] font-bold shadow-app-md"
            >
              New Reservation
            </PrimaryButton>
            <SecondaryButton
              onClick={() => navigate('/dashboard/reservations?tab=walkins')}
              icon={Users}
              className="w-full h-11 text-[11px] font-semibold"
            >
              Quick Walk-In
            </SecondaryButton>
            <SecondaryButton
              onClick={() => navigate('/dashboard/pos')}
              icon={DollarSign}
              className="w-full h-11 text-[11px] font-semibold"
            >
              New Order
            </SecondaryButton>
            <SecondaryButton
              onClick={() => navigate('/dashboard/inventory?tab=purchases')}
              icon={Boxes}
              className="w-full h-11 text-[11px] font-semibold"
            >
              New Purchase
            </SecondaryButton>
            <SecondaryButton
              onClick={() => navigate('/dashboard/staff')}
              icon={User}
              className="w-full h-11 text-[11px] font-semibold"
            >
              New Employee
            </SecondaryButton>
            <SecondaryButton
              onClick={() => navigate('/dashboard/customers')}
              icon={Heart}
              className="w-full h-11 text-[11px] font-semibold"
            >
              New Customer
            </SecondaryButton>
            <SecondaryButton
              onClick={() => navigate('/dashboard/communication')}
              icon={Send}
              className="w-full h-11 text-[11px] font-semibold"
            >
              Send Announcement
            </SecondaryButton>
          </div>
        </AppCard>
      </motion.div>

      {/* 4. MAIN ANALYTICS AND ACTIVITY SECTION (12-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-app-24">
        
        {/* Charts and trends summary (col-span-8) */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-app-24">
          
          {/* Reservation curves with svg draw lines */}
          <ChartCard
            title="Reservation Trends"
            subtitle="Weekly Booking Spike Curves"
            legend={
              <Badge status="success">+12% peak increase</Badge>
            }
          >
            <svg viewBox="0 0 500 180" className="w-full h-full">
              <line x1="0" y1="160" x2="500" y2="160" stroke="var(--color-border)" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="var(--color-border)" strokeWidth="0.5" />
              <line x1="0" y1="40" x2="500" y2="40" stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4" />
              
              {/* Animated drawing SVG path */}
              <motion.path
                d="M 10 140 Q 90 120, 160 130 T 320 60 T 400 30 T 490 50"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              
              <path
                d="M 10 140 Q 90 120, 160 130 T 320 60 T 400 30 T 490 50 L 490 160 L 10 160 Z"
                fill="url(#areaGradient)"
              />
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-1 left-0 right-0 text-[9px] font-bold text-text-muted flex justify-between px-2">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </ChartCard>

          {/* Daily hourly sales */}
          <ChartCard
            title="Daily Sales Distribution"
            subtitle="Hourly Revenue Audits"
            legend={
              <span className="text-xs font-extrabold text-text-primary">Total: ₹4.2k</span>
            }
          >
            <svg viewBox="0 0 500 160" className="w-full h-full">
              <rect x="25" y="110" width="30" height="40" rx="4" fill="var(--color-border)" />
              <rect x="85" y="70" width="30" height="80" rx="4" fill="var(--color-border)" />
              <rect x="145" y="50" width="30" height="100" rx="4" fill="var(--color-primary)" />
              <rect x="205" y="90" width="30" height="60" rx="4" fill="var(--color-border)" />
              <rect x="265" y="30" width="30" height="120" rx="4" fill="var(--color-primary)" />
              <rect x="325" y="10" width="30" height="140" rx="4" fill="var(--color-primary)" />
              <rect x="385" y="70" width="30" height="80" rx="4" fill="var(--color-border)" />
              <rect x="445" y="90" width="30" height="60" rx="4" fill="var(--color-border)" />
            </svg>
            <div className="absolute bottom-1 left-0 right-0 text-[9px] font-bold text-text-muted flex justify-between px-6">
              <span>12 PM</span><span>2 PM</span><span>4 PM</span><span>6 PM</span><span>8 PM</span><span>10 PM</span>
            </div>
          </ChartCard>
        </motion.div>

        {/* AI summary feed and live notification activity logs (col-span-4) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-app-24">
          
          {/* Gemini AI Recommendations Executive Copilot */}
          <AppCard className="border-app-primary/30 relative overflow-hidden flex flex-col justify-between min-h-[320px] group shadow-[0_4px_20px_rgba(99,102,241,0.05)] bg-gradient-to-b from-app-surface to-app-primary/[0.02]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-app-primary font-bold text-[10px] uppercase tracking-wider">
                  <Sparkles size={14} className="animate-pulse text-app-primary" />
                  Gemini Copilot Engine
                </span>
                <span className="w-2.5 h-2.5 rounded-full neon-glow-cyan animate-pulse" />
              </div>
              
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Executive AI Recommendations</h3>
              
              <div className="space-y-3.5">
                <div className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-app-primary mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-text-primary">Peak Rush Hours</p>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      {aiForecast.predicted_rush_hours}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-app-primary mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-text-primary">Financial & Capacity Forecast</p>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Tomorrow's projected sales: <strong className="text-app-primary">₹{aiForecast.predicted_revenue_tomorrow}</strong> at <strong className="text-text-primary">{aiForecast.predicted_occupancy_tomorrow}%</strong> capacity index.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-app-primary mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-text-primary">AI Restock Recommendations</p>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Order restock suggest: {aiForecast.recommended_inventory_restock.join(', ')}.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-app-border flex justify-between items-center text-[10px] font-extrabold text-text-muted mt-4">
              <span>Confidence: 94%</span>
              <PrimaryButton 
                onClick={() => addToast('Insight recommendations adopted successfully.', 'success')}
                className="py-1 px-3 shadow-app-sm"
              >
                Adopt Suggestion
              </PrimaryButton>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-app-primary/20 via-transparent to-transparent group-hover:from-app-primary/50 transition-all duration-300"></div>
          </AppCard>

          {/* Recent telemetry activity feed */}
          <SectionCard title="Recent telemetry log" subtitle="Real-time operations audit stream">
            <div className="space-y-4">
              {activities.map((act, i) => {
                const ActIcon = act.icon;
                return (
                  <div key={i} className="flex items-start gap-3 text-xs leading-normal">
                    <div className={`w-8 h-8 rounded-app-md shrink-0 flex items-center justify-center border ${
                      act.status === 'success' ? 'bg-app-success/10 text-app-success border-app-success/20 shadow-[0_0_8px_rgba(16,185,129,0.08)]' :
                      act.status === 'danger' ? 'bg-app-danger/10 text-app-danger border-app-danger/20 shadow-[0_0_8px_rgba(244,63,94,0.08)]' :
                      'bg-app-primary/10 text-app-primary border-app-primary/20 shadow-[0_0_8px_rgba(99,102,241,0.08)]'
                    }`}>
                      <ActIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-text-primary truncate">{act.title}</span>
                        <span className="text-[9px] text-text-muted font-medium shrink-0">{act.time}</span>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-0.5 font-medium leading-relaxed">
                        {act.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
