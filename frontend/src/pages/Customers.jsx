import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Sparkles, 
  Star, 
  TrendingUp, 
  ThumbsUp, 
  Clock, 
  Check, 
  Send, 
  X, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  Award,
  Phone,
  Mail,
  Calendar,
  Layers,
  Heart,
  History,
  FileText,
  UserCheck
} from 'lucide-react';

import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  AppCard,
  GlassCard,
  SectionCard,
  KPICard,
  PrimaryButton,
  SecondaryButton,
  AnimatedCounter,
  Badge,
  LoadingOverlay,
  Input,
  Select,
  Textarea,
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

const Customers = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const branchId = localStorage.getItem('branch_id') || user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5';

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('directory'); // 'dashboard', 'directory', 'loyalty', 'reviews', 'preferences', 'history', 'segments'

  useEffect(() => {
    if (tabParam && ['dashboard', 'directory', 'loyalty', 'reviews', 'preferences', 'history', 'segments'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // CRM State Management
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [segments, setSegments] = useState([]);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Customer Details Drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailDrawerOpen, setCustomerDetailDrawerOpen] = useState(false);
  const [customerReservations, setCustomerReservations] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);

  // Adjust Loyalty form
  const [adjustPointsModalOpen, setAdjustPointsModalOpen] = useState(false);
  const [loyaltyFormData, setLoyaltyFormData] = useState({
    points: 0,
    action: 'add', // 'add' or 'deduct'
    reason: ''
  });

  // Review response panel states
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch all dashboard & directory data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch customers from UserViewSet with customer role filter
      const customerRes = await client.get('/users/', { params: { role: 'customer' } });
      const customerList = Array.isArray(customerRes.data) ? customerRes.data : (customerRes.data?.results || []);
      setCustomers(customerList);

      // 2. Fetch reviews data
      const revRes = await client.get(`/feedback/reviews/?branch_id=${branchId}`);
      if (revRes.data?.success) setReviews(revRes.data.data);

      // 3. Fetch reviews analytics aggregates
      const analRes = await client.get(`/feedback/reviews/analytics/?branch_id=${branchId}`);
      if (analRes.data?.success) setAnalytics(analRes.data.data);

      // 4. Fetch customer segments from predictive analytics view
      const predRes = await client.get(`/analytics/predictive/?branch=${branchId}`);
      if (predRes.data?.customer_segmentation) {
        setSegments(predRes.data.customer_segmentation);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch CRM and reviews dataset.', 'error');
    } finally {
      setLoading(false);
    }
  }, [branchId, addToast]);

  useEffect(() => {
    fetchData();
    window.addEventListener('branchUpdate', fetchData);
    return () => {
      window.removeEventListener('branchUpdate', fetchData);
    };
  }, [fetchData]);

  // Load customer visit history (reservations and invoices)
  const handleOpenDetailDrawer = async (cust) => {
    setSelectedCustomer(cust);
    setCustomerDetailDrawerOpen(true);
    try {
      // Fetch reservations for the customer
      const res = await client.get('/reservation/bookings/', { params: { guest_phone: cust.phone } });
      const resList = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setCustomerReservations(resList);

      // Fetch invoice transactions
      const inv = await client.get('/branches/invoices/', { params: { search: cust.phone } });
      const invList = Array.isArray(inv.data?.results) ? inv.data.results : (Array.isArray(inv.data) ? inv.data : []);
      setCustomerInvoices(invList);
    } catch (err) {
      console.error(err);
      addToast('Failed to load visit history details.', 'error');
    }
  };

  // Adjust customer loyalty points
  const handleAdjustPointsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const delta = loyaltyFormData.action === 'add' ? parseInt(loyaltyFormData.points) : -parseInt(loyaltyFormData.points);
      // Backend signal calculates tier, let's update user loyalty details
      const response = await client.patch(`/users/${selectedCustomer.id}/`, {
        profile: {
          loyalty: {
            points: Math.max(0, (selectedCustomer.loyalty_points || 0) + delta)
          }
        }
      });
      addToast('Customer loyalty points updated successfully.', 'success');
      setAdjustPointsModalOpen(false);
      setLoyaltyFormData({ points: 0, action: 'add', reason: '' });
      fetchData();
      if (selectedCustomer) {
        // Refresh selected customer state
        const updated = {
          ...selectedCustomer,
          loyalty_points: Math.max(0, (selectedCustomer.loyalty_points || 0) + delta)
        };
        setSelectedCustomer(updated);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to adjust loyalty points.', 'error');
    }
  };

  // Review Action: Respond
  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;
    setSubmittingResponse(true);
    try {
      const res = await client.post(`/feedback/reviews/${selectedReview.id}/respond/`, {
        response_text: responseText
      });
      if (res.data?.success || res.status === 201) {
        addToast('Review response published successfully.', 'success');
        setSelectedReview(null);
        setResponseText('');
        fetchData();
      }
    } catch (err) {
      addToast('Failed to publish review response.', 'error');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Review Action: Re-analyze with Gemini
  const handleReanalyzeReview = async (id) => {
    addToast('Re-analyzing review sentiment...', 'info');
    try {
      const res = await client.post(`/feedback/reviews/${id}/analyze/`);
      if (res.data?.success) {
        addToast('Review re-analyzed successfully.', 'success');
        fetchData();
      }
    } catch (err) {
      addToast('Gemini review re-analysis failed.', 'error');
    }
  };

  // Sync external reviews
  const handleSyncPlaces = async () => {
    setSyncing(true);
    addToast('Syncing reviews with Google/Zomato feeds...', 'info');
    try {
      const res = await client.post('/feedback/reviews/sync_places/', { branch_id: branchId });
      if (res.data?.success) {
        addToast(res.data.message || 'Places sync complete.', 'success');
        fetchData();
      }
    } catch (err) {
      addToast('Sync simulation failed.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Export Customer list to CSV
  const handleExportCSV = () => {
    addToast('Generating customer CSV database...', 'info');
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Loyalty Tier', 'Points'];
    const rows = customers.map(c => [
      c.id,
      `${c.first_name} ${c.last_name}`.trim() || c.username,
      c.email,
      c.phone,
      c.loyalty_tier || 'Silver',
      c.loyalty_points || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customer_directory_${branchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Directory Filter Calculations
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const name = `${c.first_name} ${c.last_name}`.toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm);
      return matchesSearch;
    });
  }, [customers, searchTerm]);

  // Reviews Filter Calculations
  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      const matchesRating = ratingFilter === 'all' ? true : rev.rating === parseInt(ratingFilter);
      const matchesSentiment = sentimentFilter === 'all' ? true : rev.insight?.sentiment === sentimentFilter;
      const matchesSource = sourceFilter === 'all' ? true : rev.source === sourceFilter;
      const matchesSearch = rev.comment.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rev.author_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRating && matchesSentiment && matchesSource && matchesSearch;
    });
  }, [reviews, ratingFilter, sentimentFilter, sourceFilter, searchTerm]);

  // CSAT rating calculations
  const avgRating = analytics?.avg_rating || 4.7;
  const totalReviews = reviews.length;
  const positivePct = analytics?.sentiment_breakdown?.positive || 75;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-app-24 animate-fade-in relative min-h-[85vh] text-text-secondary"
    >

      {/* HEADER BAR */}
      <motion.div variants={itemVariants}>
        <GlassCard className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-app-20 border-app-primary/20 shadow-app-sm">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-primary/10 text-app-primary border border-app-primary/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                <Users size={12} />
                CRM Portal Active
              </span>
              <Badge status="success">NPS CSAT: {avgRating}/5.0</Badge>
              <Badge status="info">{customers.length} registered customers</Badge>
            </div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Customer Directory & Sentiment (CRM)
            </h1>
            <p className="text-xs text-text-secondary font-medium">
              Supervise loyalty programs, search client history profiles, aggregate reviews, and view K-Means segments.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'reviews' && (
              <SecondaryButton onClick={handleSyncPlaces} icon={RefreshCw} loading={syncing}>
                Sync Reviews
              </SecondaryButton>
            )}
            <PrimaryButton onClick={handleExportCSV} icon={Download}>
              Export Directory
            </PrimaryButton>
            <button 
              onClick={fetchData} 
              className="text-text-muted hover:text-text-primary p-2 rounded-app-xl border border-app-border bg-app-surface transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* MODULE TAB NAVIGATION */}
      <motion.div variants={itemVariants} className="flex gap-2 border-b border-app-border pb-2 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'CRM Dashboard', icon: Users },
          { id: 'directory', label: 'Directory', icon: Users },
          { id: 'loyalty', label: 'Loyalty Tiers', icon: Award },
          { id: 'reviews', label: 'Reviews & CSAT', icon: Star },
          { id: 'segments', label: 'Diner Segments', icon: Layers }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setSearchParams({ tab: t.id });
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition ${
              activeTab === t.id 
                ? 'bg-app-primary border-app-primary text-white shadow-app-sm' 
                : 'bg-app-surface border-app-border text-text-secondary hover:bg-app-elevated'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* TAB VIEWS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KPICard title="Customer CSAT" value={`${avgRating} / 5.0`} description="Average review rating aggregated" />
              <KPICard title="Positive Sentiment Ratio" value={`${positivePct}%`} trend="up" description="Sentiment ratio in reviews" />
              <KPICard title="Customer Base Growth" value="+14.2%" trend="up" description="New customer profiles (30D)" />

              <div className="md:col-span-3">
                <SectionCard title="NPS & Feedback Insights" subtitle="Sentiment classification cloud summary">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border border-app-border rounded-xl bg-app-elevated flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase text-text-primary mb-2">CSAT Rating Distribution</h4>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map(stars => {
                            const count = reviews.filter(r => r.rating === stars).length;
                            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                            return (
                              <div key={stars} className="flex items-center gap-2 text-xs font-medium">
                                <span className="w-12">{stars} Stars</span>
                                <div className="flex-1 h-2 bg-app-border rounded-full overflow-hidden">
                                  <div className="h-full bg-app-primary" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="w-8 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-app-border rounded-xl bg-app-elevated flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase text-text-primary mb-2">AI Key Theme Hotspots</h4>
                        <div className="flex flex-wrap gap-2">
                          {analytics?.frequent_keywords?.map((kw, i) => (
                            <span 
                              key={i} 
                              className={`px-2.5 py-1 text-[10px] font-bold rounded border ${
                                kw.sentiment === 'positive' 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              }`}
                            >
                              {kw.word} ({kw.count} hits)
                            </span>
                          )) || <div className="text-xs text-text-muted">No themes identified. Try running sync.</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {/* 2. DIRECTORY VIEW */}
          {activeTab === 'directory' && (
            <SectionCard title="Active Client Directory" subtitle="Query, search, and audit customer profile ledgers">
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-2.5 text-text-muted">
                    <Search size={14} />
                  </span>
                  <Input 
                    placeholder="Search by name, email, phone..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="border border-app-border rounded-xl overflow-hidden bg-app-elevated">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-app-surface border-b border-app-border font-extrabold text-text-primary uppercase tracking-wider text-[10px]">
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">Loyalty Tier</th>
                      <th className="p-3.5">Loyalty Points</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <tr key={c.id} className="border-b border-app-border/40 hover:bg-app-surface transition-colors font-medium">
                          <td className="p-3.5 text-text-primary font-bold">
                            {`${c.first_name} ${c.last_name}`.trim() || c.username}
                          </td>
                          <td className="p-3.5">{c.email}</td>
                          <td className="p-3.5">{c.phone}</td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[10px] font-extrabold uppercase ${
                              c.loyalty_tier === 'platinum' || c.loyalty_tier === 'diamond'
                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                : c.loyalty_tier === 'gold'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                            }`}>
                              <Award size={10} />
                              {c.loyalty_tier || 'Silver'}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-text-primary">{c.loyalty_points || 0}</td>
                          <td className="p-3.5 text-right space-x-2">
                            <SecondaryButton onClick={() => handleOpenDetailDrawer(c)} className="text-[10px] py-1 px-2.5">
                              View History
                            </SecondaryButton>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-text-muted">
                          No matching customer profiles found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* 3. LOYALTY VIEW */}
          {activeTab === 'loyalty' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="Redeem & Reward Points" subtitle="Perform manual customer loyalty adjustments">
                <div className="space-y-4">
                  <Select 
                    label="Choose Customer Profile"
                    onChange={(e) => {
                      const found = customers.find(c => c.id === e.target.value);
                      setSelectedCustomer(found);
                    }}
                    value={selectedCustomer?.id || ''}
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {`${c.first_name} ${c.last_name}`.trim() || c.username} - Tier: {c.loyalty_tier || 'Silver'} ({c.loyalty_points || 0} pts)
                      </option>
                    ))}
                  </Select>

                  {selectedCustomer && (
                    <form onSubmit={handleAdjustPointsSubmit} className="space-y-3 p-4 border border-app-border/60 rounded-xl bg-app-elevated text-xs font-semibold">
                      <h4 className="font-extrabold text-text-primary text-[10px] uppercase tracking-wider border-b border-app-border pb-1">
                        Adjustment parameters for {selectedCustomer.first_name || selectedCustomer.username}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          label="Action"
                          value={loyaltyFormData.action}
                          onChange={(e) => setLoyaltyFormData({ ...loyaltyFormData, action: e.target.value })}
                        >
                          <option value="add">Award points (+)</option>
                          <option value="deduct">Redeem points (-)</option>
                        </Select>
                        <Input
                          label="Points Amount"
                          type="number"
                          value={loyaltyFormData.points}
                          onChange={(e) => setLoyaltyFormData({ ...loyaltyFormData, points: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <Input
                        label="Reason for Adjustment"
                        placeholder="e.g. promotional offer redemption..."
                        value={loyaltyFormData.reason}
                        onChange={(e) => setLoyaltyFormData({ ...loyaltyFormData, reason: e.target.value })}
                      />
                      <PrimaryButton type="submit" className="w-full">
                        Process Loyalty Ledger Change
                      </PrimaryButton>
                    </form>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Loyalty Program Tiers Matrix" subtitle="Operational rules of the loyalty microservice">
                <div className="space-y-3 font-semibold text-xs text-text-secondary leading-relaxed">
                  <div className="p-3 border border-app-border rounded-lg bg-slate-500/5">
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider block mb-1">🥉 Silver Tier</span>
                    <p>Default entry level tier. Earn 1 point per ₹10 spent on the POS checkout bill.</p>
                  </div>
                  <div className="p-3 border border-app-border rounded-lg bg-amber-500/5">
                    <span className="font-extrabold text-amber-400 uppercase tracking-wider block mb-1">🥈 Gold Tier (500+ points)</span>
                    <p>Unlock 10% discount on chef specials. Earn 1.5 points per ₹10 spent.</p>
                  </div>
                  <div className="p-3 border border-app-border rounded-lg bg-indigo-500/5">
                    <span className="font-extrabold text-indigo-400 uppercase tracking-wider block mb-1">🥇 Platinum Tier (1000+ points)</span>
                    <p>Priority reservation table allocation, double points earned, free priority delivery.</p>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* 4. REVIEWS VIEW */}
          {activeTab === 'reviews' && (
            <SectionCard title="Review Feeds aggregator" subtitle="Analyze reviews and sentiments classification using Gemini AI">
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-2.5 text-text-muted">
                    <Search size={14} />
                  </span>
                  <Input 
                    placeholder="Search comments..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-9 text-xs"
                  />
                </div>
                <Select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="w-32 text-xs">
                  <option value="all">All Stars</option>
                  {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{s} Stars</option>)}
                </Select>
                <Select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)} className="w-32 text-xs">
                  <option value="all">All Sentiment</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </Select>
                <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-32 text-xs">
                  <option value="all">All Channels</option>
                  <option value="Google">Google Maps</option>
                  <option value="Zomato">Zomato Feed</option>
                  <option value="Swiggy">Swiggy Feed</option>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map(rev => {
                    const insight = rev.insight;
                    const isPositive = insight?.sentiment === 'positive';
                    const isNegative = insight?.sentiment === 'negative';
                    const sentimentBadge = insight?.sentiment 
                      ? (isPositive ? 'success' : isNegative ? 'danger' : 'warning') 
                      : 'neutral';
                    
                    return (
                      <AppCard key={rev.id} className="p-4 border border-app-border/60 hover:border-app-primary/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-text-primary">{rev.author_name}</span>
                              <span className="text-[10px] text-text-muted">({rev.source})</span>
                              <Badge status={sentimentBadge}>{insight?.sentiment || 'Pending analysis'}</Badge>
                            </div>
                            <div className="flex text-amber-400 gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={11} fill={i < rev.rating ? 'currentColor' : 'none'} />
                              ))}
                            </div>
                          </div>
                          
                          <span className="text-[10px] font-bold text-text-muted">{new Date(rev.visit_date).toLocaleDateString()}</span>
                        </div>

                        <p className="text-xs font-semibold text-text-secondary leading-relaxed mb-3">"{rev.comment}"</p>

                        {insight && (
                          <div className="p-3 bg-app-elevated border border-app-border rounded-lg text-[10px] font-medium space-y-2 mb-3">
                            <div>
                              <span className="font-extrabold text-text-primary block uppercase tracking-wider text-[9px] mb-1">Suggested improvements</span>
                              <p>{insight.suggested_improvements || 'None suggested.'}</p>
                            </div>
                            {insight.manager_action_items?.length > 0 && (
                              <div>
                                <span className="font-extrabold text-text-primary block uppercase tracking-wider text-[9px] mb-1">AI Action Checklist</span>
                                <ul className="list-disc pl-4 space-y-0.5 text-text-secondary font-semibold">
                                  {insight.manager_action_items.map((item, idx) => <li key={idx}>{item}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <SecondaryButton onClick={() => handleReanalyzeReview(rev.id)} className="text-[9px] py-1 px-2.5">
                            Re-analyze
                          </SecondaryButton>
                          <PrimaryButton onClick={() => setSelectedReview(rev)} className="text-[9px] py-1 px-2.5">
                            Reply
                          </PrimaryButton>
                        </div>
                      </AppCard>
                    );
                  })
                ) : (
                  <EmptyState title="No reviews found" description="Adjust filters or query terms to fetch customer comments." icon={Star} />
                )}
              </div>
            </SectionCard>
          )}

          {/* 5. SEGMENTS VIEW */}
          {activeTab === 'segments' && (
            <SectionCard title="Predictive Customer Clustering" subtitle="Dynamic K-Means segments generated by backend machine learning">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {segments.length > 0 ? (
                    segments.map((seg, idx) => (
                      <div key={idx} className="p-4 border border-app-border/80 rounded-xl bg-app-elevated flex justify-between items-center text-xs font-semibold">
                        <div className="space-y-1">
                          <span className="font-extrabold text-text-primary block text-sm">{seg.name}</span>
                          <span className="text-text-muted font-bold text-[10px] block uppercase tracking-wider">{seg.avg}</span>
                        </div>
                        <span className="text-lg font-black text-app-primary">{seg.pct}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-text-muted p-4">No segment clusters generated. Create invoices to build database.</div>
                  )}
                </div>

                <div className="p-4 border border-app-border rounded-xl bg-app-surface text-xs leading-relaxed font-semibold">
                  <h4 className="font-extrabold text-text-primary uppercase tracking-wider text-[10px] mb-2 border-b border-app-border pb-1">Clustering Analysis Context</h4>
                  <p className="mb-2">
                    The backend processes paid POS Invoices, running a 1D K-Means clustering algorithm on customer average spend coefficients dynamically.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-text-secondary">
                    <li>VIP Diners: High average spend. Highly responsive to recommendations.</li>
                    <li>Regular Diners: Moderate average spend, high visit frequency.</li>
                    <li>Occasional Guests: Lower frequency, moderate transaction value.</li>
                    <li>Inactive Diners: Lowest transaction values and visit frequency.</li>
                  </ul>
                </div>
              </div>
            </SectionCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* DETAIL HISTORY DRAWER */}
      <Drawer
        isOpen={customerDetailDrawerOpen}
        onClose={() => setCustomerDetailDrawerOpen(false)}
        title={selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'Customer Visit History'}
        size="md"
      >
        {selectedCustomer && (
          <div className="space-y-6 text-xs font-semibold text-text-secondary">
            {/* Quick overview */}
            <div className="p-4 bg-app-primary/5 border border-app-primary/20 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Loyalty Tier Status</span>
                <span className="text-lg font-black text-text-primary block uppercase">{selectedCustomer.loyalty_tier || 'Silver'}</span>
              </div>
              <div className="text-right space-y-1">
                <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Points Ledger</span>
                <span className="text-lg font-black text-app-primary block">{selectedCustomer.loyalty_points || 0} pts</span>
              </div>
            </div>

            {/* Reservations List */}
            <div>
              <h4 className="font-extrabold text-text-primary uppercase tracking-wider text-[10px] mb-2 border-b border-app-border pb-1 flex justify-between items-center">
                <span>Reservations History ({customerReservations.length})</span>
                <Calendar size={12} />
              </h4>
              {customerReservations.length > 0 ? (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {customerReservations.map(res => (
                    <div key={res.id} className="p-2 border border-app-border rounded-lg bg-app-elevated flex justify-between items-center text-[10px]">
                      <span>{new Date(res.start_time).toLocaleDateString()} @ {new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({res.party_size} guests)</span>
                      <Badge status={res.status === 'completed' ? 'success' : res.status === 'cancelled' || res.status === 'refunded' ? 'danger' : 'info'}>
                        {res.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-text-muted text-[10px] py-2">No historical reservations found.</div>
              )}
            </div>

            {/* Invoices List */}
            <div>
              <h4 className="font-extrabold text-text-primary uppercase tracking-wider text-[10px] mb-2 border-b border-app-border pb-1 flex justify-between items-center">
                <span>POS Settle Invoices ({customerInvoices.length})</span>
                <FileText size={12} />
              </h4>
              {customerInvoices.length > 0 ? (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {customerInvoices.map(inv => (
                    <div key={inv.id} className="p-2 border border-app-border rounded-lg bg-app-elevated flex justify-between items-center text-[10px]">
                      <span>Invoice ID: #{inv.id.slice(0, 8).toUpperCase()} - Total: ₹{inv.total}</span>
                      <Badge status={inv.status === 'paid' ? 'success' : 'danger'}>
                        {inv.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-text-muted text-[10px] py-2">No invoice transactions settled.</div>
              )}
            </div>

            <div className="pt-4 border-t border-app-border flex gap-2">
              <SecondaryButton onClick={() => setAdjustPointsModalOpen(true)} className="flex-1">
                Adjust Loyalty Points
              </SecondaryButton>
              <PrimaryButton onClick={() => setCustomerDetailDrawerOpen(false)} className="flex-1">
                Close Profile
              </PrimaryButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* MANUAL LOYALTY ADJUSTMENT MODAL */}
      <Modal
        isOpen={adjustPointsModalOpen}
        onClose={() => setAdjustPointsModalOpen(false)}
        title="Loyalty Points Manual override"
      >
        {selectedCustomer && (
          <form onSubmit={handleAdjustPointsSubmit} className="space-y-4 text-xs font-semibold text-text-secondary">
            <div className="p-3 border border-app-border rounded-lg bg-app-surface flex justify-between items-center text-[10px] uppercase font-bold">
              <span>Current points ledger:</span>
              <span className="text-text-primary font-black">{selectedCustomer.loyalty_points || 0} pts</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Action type"
                value={loyaltyFormData.action}
                onChange={(e) => setLoyaltyFormData({ ...loyaltyFormData, action: e.target.value })}
              >
                <option value="add">Award points (+)</option>
                <option value="deduct">Redeem points (-)</option>
              </Select>
              <Input
                label="Points quantity"
                type="number"
                value={loyaltyFormData.points}
                onChange={(e) => setLoyaltyFormData({ ...loyaltyFormData, points: parseInt(e.target.value) || 0 })}
              />
            </div>

            <Input
              label="Reason description"
              placeholder="e.g. gesture points, compensation..."
              value={loyaltyFormData.reason}
              onChange={(e) => setLoyaltyFormData({ ...loyaltyFormData, reason: e.target.value })}
            />

            <div className="flex gap-2 pt-2">
              <SecondaryButton onClick={() => setAdjustPointsModalOpen(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" className="flex-1">
                Confirm Adjust
              </PrimaryButton>
            </div>
          </form>
        )}
      </Modal>

      {/* REVIEW RESPONSE REPLY MODAL */}
      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title={selectedReview ? `Reply to review: ${selectedReview.author_name}` : 'Post Response'}
      >
        {selectedReview && (
          <form onSubmit={handleResponseSubmit} className="space-y-4 text-xs font-semibold text-text-secondary">
            <div className="p-3 border border-app-border rounded-lg bg-app-surface leading-relaxed text-[11px]">
              <span className="text-text-primary font-extrabold block mb-1">Review comment:</span>
              "{selectedReview.comment}"
            </div>

            <Textarea
              label="Official Manager Reply"
              rows={4}
              placeholder="e.g. We are sorry for the delay, thank you for your feedback..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
            />

            <div className="flex gap-2">
              <SecondaryButton onClick={() => setSelectedReview(null)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" className="flex-1" loading={submittingResponse}>
                Send Response
              </PrimaryButton>
            </div>
          </form>
        )}
      </Modal>
    </motion.div>
  );
};

export default Customers;
