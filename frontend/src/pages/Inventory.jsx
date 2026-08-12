import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Boxes, 
  Sparkles, 
  Search, 
  Plus, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  AlertTriangle, 
  Truck, 
  ShoppingBag, 
  TrendingDown, 
  Check, 
  Trash2,
  SlidersHorizontal,
  Compass,
  FileSpreadsheet,
  AlertCircle,
  Package,
  CalendarDays,
  PlusCircle,
  CalendarClock,
  ClipboardList
} from 'lucide-react';

import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
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

const Inventory = () => {
  const { addToast } = useToast();
  
  // State variables
  const [ingredients, setIngredients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [wastages, setWastages] = useState([]);
  const [movements, setMovements] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dailyStockRecords, setDailyStockRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tabs & Filters state
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'ingredients', 'purchases', 'vendors', 'wastage', 'movements', 'daily-stock'

  useEffect(() => {
    if (tabParam) {
      let target = tabParam;
      if (target === 'stock') target = 'daily-stock';
      if (target === 'suppliers') target = 'vendors';
      if (target === 'alerts') target = 'dashboard';
      if (target === 'forecasting') target = 'dashboard';
      
      if (['dashboard', 'ingredients', 'purchases', 'vendors', 'wastage', 'movements', 'daily-stock'].includes(target)) {
        setActiveTab(target);
      }
    }
  }, [tabParam]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [abcFilter, setAbcFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Drawer visibility
  const [ingDrawerOpen, setIngDrawerOpen] = useState(false);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const [purchaseDrawerOpen, setPurchaseDrawerOpen] = useState(false);
  const [wastageDrawerOpen, setWastageDrawerOpen] = useState(false);
  const [adjustDrawerOpen, setAdjustDrawerOpen] = useState(false);
  const [dailyStockDrawerOpen, setDailyStockDrawerOpen] = useState(false);

  // Form states
  const [ingFormData, setIngFormData] = useState({
    name: '', category: 'vegetables', unit: 'kg', min_stock: 10, max_stock: 100, abc_class: 'C'
  });

  const [vendorFormData, setVendorFormData] = useState({
    name: '', contact_name: '', phone: '', email: '', address: ''
  });

  const [purchaseFormData, setPurchaseFormData] = useState({
    vendor: '',
    invoice_no: '',
    purchase_date: new Date().toISOString().split('T')[0],
    items: [
      { ingredient: '', quantity: 1, purchase_unit: 'kg', conversion_factor: 1, unit_price: 0, batch_number: '', expiry_date: '' }
    ]
  });

  const [wastageFormData, setWastageFormData] = useState({
    ingredient: '', quantity: 1, reason: 'spoilage', description: ''
  });

  const [dailyStockFormData, setDailyStockFormData] = useState({
    ingredient: '', opening_stock: '', closing_stock: ''
  });

  const [adjustFormData, setAdjustFormData] = useState({
    ingredient: '', quantity: 0, reason: 'Physical inventory discrepancy reconciliation'
  });

  // Fetch core datasets
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ingRes, vendorsRes, purchasesRes, wastagesRes, movementsRes, alertsRes, analyticsRes, dailyRes] = await Promise.all([
        client.get('/inventory/ingredients/'),
        client.get('/inventory/vendors/'),
        client.get('/inventory/purchases/'),
        client.get('/inventory/wastage/'),
        client.get('/inventory/movements/'),
        client.get('/inventory/alerts/'),
        client.get('/inventory/analytics/'),
        client.get('/inventory/daily-stock/')
      ]);

      if (ingRes.data?.success) setIngredients(ingRes.data.data);
      if (vendorsRes.data?.success) setVendors(vendorsRes.data.data);
      if (purchasesRes.data?.success) setPurchases(purchasesRes.data.data);
      if (wastagesRes.data?.success) setWastages(wastagesRes.data.data);
      if (movementsRes.data?.success) setMovements(movementsRes.data.data);
      if (alertsRes.data?.success) setReorderAlerts(alertsRes.data.data);
      if (analyticsRes.data?.success) setAnalyticsData(analyticsRes.data.data);
      if (dailyRes.data?.results) {
        setDailyStockRecords(dailyRes.data.results);
      } else if (Array.isArray(dailyRes.data)) {
        setDailyStockRecords(dailyRes.data);
      } else if (dailyRes.data?.data) {
        setDailyStockRecords(dailyRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      addToast('Failed to synchronize live inventory tables.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const refreshWithSync = () => {
    fetchData();
    window.dispatchEvent(new Event('branchUpdate'));
  };

  useEffect(() => {
    refreshWithSync();
    window.addEventListener('branchUpdate', fetchData);
    return () => {
      window.removeEventListener('branchUpdate', fetchData);
    };
  }, [fetchData]);

  // Form field input change helper
  const handleInputChange = (e, formSetter) => {
    const { name, value } = e.target;
    formSetter(prev => ({ ...prev, [name]: value }));
  };

  // Submit Ingredient
  const handleIngSubmit = async (e) => {
    e.preventDefault();
    if (!ingFormData.name.trim()) return;
    try {
      const res = await client.post('/inventory/ingredients/', ingFormData);
      if (res.data?.success || res.status === 201) {
        addToast('Ingredient registered successfully.', 'success');
        setIngDrawerOpen(false);
        setIngFormData({ name: '', category: 'vegetables', unit: 'kg', min_stock: 10, max_stock: 100, abc_class: 'C' });
        refreshWithSync();
      }
    } catch (err) {
      addToast('Failed to create ingredient.', 'error');
    }
  };

  // Submit Vendor
  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    if (!vendorFormData.name.trim()) return;
    try {
      const res = await client.post('/inventory/vendors/', vendorFormData);
      if (res.data?.success || res.status === 201) {
        addToast('Vendor registered successfully.', 'success');
        setVendorDrawerOpen(false);
        setVendorFormData({ name: '', contact_name: '', phone: '', email: '', address: '' });
        refreshWithSync();
      }
    } catch (err) {
      addToast('Failed to create vendor record.', 'error');
    }
  };

  // Purchase Items list triggers
  const handlePurchaseItemChange = (index, field, value) => {
    const newItems = [...purchaseFormData.items];
    newItems[index][field] = value;
    setPurchaseFormData(prev => ({ ...prev, items: newItems }));
  };

  const addPurchaseItemLine = () => {
    setPurchaseFormData(prev => ({
      ...prev,
      items: [...prev.items, { ingredient: '', quantity: 1, purchase_unit: 'kg', conversion_factor: 1, unit_price: 0, batch_number: '', expiry_date: '' }]
    }));
  };

  const removePurchaseItemLine = (index) => {
    if (purchaseFormData.items.length <= 1) return;
    const newItems = purchaseFormData.items.filter((_, i) => i !== index);
    setPurchaseFormData(prev => ({ ...prev, items: newItems }));
  };

  // Submit Purchase Deliveries
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseFormData.vendor || !purchaseFormData.invoice_no) {
      addToast('Vendor and invoice number are required.', 'warning');
      return;
    }
    try {
      const res = await client.post('/inventory/purchases/', purchaseFormData);
      if (res.data?.success) {
        addToast('Purchase invoice received. Stock levels updated.', 'success');
        setPurchaseDrawerOpen(false);
        setPurchaseFormData({
          vendor: '', invoice_no: '', purchase_date: new Date().toISOString().split('T')[0],
          items: [{ ingredient: '', quantity: 1, purchase_unit: 'kg', conversion_factor: 1, unit_price: 0, batch_number: '', expiry_date: '' }]
        });
        refreshWithSync();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error creating purchase invoice.', 'error');
    }
  };

  // Submit Spoilage/Wastage
  const handleWastageSubmit = async (e) => {
    e.preventDefault();
    if (!wastageFormData.ingredient || !wastageFormData.quantity) {
      addToast('Ingredient and quantity are required.', 'warning');
      return;
    }
    try {
      const res = await client.post('/inventory/wastage/', wastageFormData);
      if (res.data?.success) {
        addToast('Wastage record logged and stock deducted.', 'success');
        setWastageDrawerOpen(false);
        setWastageFormData({ ingredient: '', quantity: 1, reason: 'spoilage', description: '' });
        refreshWithSync();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit wastage log.', 'error');
    }
  };

  // Submit Inventory batched stock adjustments
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustFormData.ingredient) return;
    try {
      const res = await client.post('/inventory/batches/adjust/', adjustFormData);
      if (res.data?.success) {
        addToast('Stock levels adjusted successfully.', 'success');
        setAdjustDrawerOpen(false);
        setAdjustFormData({ ingredient: '', quantity: 0, reason: 'Physical inventory discrepancy reconciliation' });
        refreshWithSync();
      }
    } catch (err) {
      addToast('Failed to reconcile inventory discrepancy.', 'error');
    }
  };

  const handleDailyStockSubmit = async (e) => {
    e.preventDefault();
    if (!dailyStockFormData.ingredient || dailyStockFormData.opening_stock === '' || dailyStockFormData.closing_stock === '') {
      addToast('Ingredient, opening stock, and closing stock are required.', 'warning');
      return;
    }
    try {
      const payload = {
        ingredient: dailyStockFormData.ingredient,
        opening_stock: parseFloat(dailyStockFormData.opening_stock) || 0,
        closing_stock: parseFloat(dailyStockFormData.closing_stock) || 0
      };
      const res = await client.post('/inventory/daily-stock/', payload);
      if (res.status === 201 || res.data?.success) {
        addToast('Daily stock sheet record logged successfully.', 'success');
        setDailyStockDrawerOpen(false);
        setDailyStockFormData({ ingredient: '', opening_stock: '', closing_stock: '' });
        refreshWithSync();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to submit daily stock sheet record.', 'error');
    }
  };

  // Alert Acknowledge resolve
  const handleResolveAlert = async (id) => {
    try {
      const res = await client.post(`/inventory/alerts/${id}/resolve/`);
      if (res.data?.success) {
        addToast('Alert marked as resolved.', 'info');
        refreshWithSync();
      }
    } catch (err) {
      addToast('Resolve alert failed.', 'error');
    }
  };

  // Filter Ingredients List
  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ? true : ing.category === categoryFilter;
    const matchesABC = abcFilter === 'all' ? true : ing.abc_class === abcFilter;
    return matchesSearch && matchesCategory && matchesABC;
  });

  const totalPages = Math.ceil(filteredIngredients.length / itemsPerPage);
  const paginatedIngredients = filteredIngredients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalValuation = analyticsData?.food_cost_total || '0.00';
  const totalWastage = analyticsData?.wastage_cost_total || '0.00';
  const healthScore = analyticsData?.inventory_health_score || '100.0';
  const expiringCount = analyticsData?.expiring_soon_count || 0;

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
                <Boxes size={12} className="animate-spin duration-3000" />
                Warehouse ERP active
              </span>
              <Badge status="success">Inventory Health: {healthScore}%</Badge>
              <Badge status="danger">{expiringCount} expiring soon</Badge>
            </div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Inventory & Warehouse Control
            </h1>
            <p className="text-xs text-text-secondary font-medium">
              Oversee food valuation records, track ingredients FEFO expiries, and prevent stock wastage.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <SecondaryButton onClick={() => setWastageDrawerOpen(true)} icon={TrendingDown}>
              Log Spoilage
            </SecondaryButton>
            <PrimaryButton onClick={() => setPurchaseDrawerOpen(true)} icon={ShoppingBag} className="shadow-app-md">
              Receive Purchase
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

      {/* 2. TELEMETRY KPI CARDS */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-app-20">
        <KPICard title="Valuation Total" value={`₹${parseFloat(totalValuation).toLocaleString()}`} description="Active batch evaluation cost" />
        <KPICard title="Cost Wastage" value={`₹${parseFloat(totalWastage).toLocaleString()}`} trend="down" description="Total spoilage loss" />
        <KPICard title="Expiring Soon" value={<AnimatedCounter value={expiringCount} />} description="FEFO items under 7 days" />
        <KPICard title="Active Stock Alerts" value={<AnimatedCounter value={reorderAlerts.filter(a => a.status === 'active').length} />} description="Critical reorders warnings" />
      </motion.div>

      {/* 3. SUB-MENU TABS CONTROLS */}
      <motion.div variants={itemVariants} className="flex border-b border-app-border gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'dashboard', label: 'AI Prediction Dashboard', icon: Compass },
          { id: 'ingredients', label: 'Ingredients Listing', icon: SlidersHorizontal },
          { id: 'daily-stock', label: 'Daily Stock Sheet', icon: ClipboardList },
          { id: 'purchases', label: 'Purchases Ledger', icon: ShoppingBag },
          { id: 'vendors', label: 'Suppliers Directory', icon: Truck },
          { id: 'wastage', label: 'Wastage & Spoilage', icon: TrendingDown },
          { id: 'movements', label: 'Audit Log Trail', icon: FileSpreadsheet }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition-all duration-200 ${ isActive ? 'border-app-primary text-app-primary bg-app-primary/5' : 'border-transparent text-text-muted hover:text-text-primary' }`}
            >
              <TabIcon size={14} className={isActive ? 'text-app-primary' : 'text-text-muted'} />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* 4. ACTIVE PANELS CONTROLS */}
      <motion.div variants={itemVariants} className="min-h-[450px]">
        
        {/* TAB 1: AI PREDICTIONS DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-app-24">
            
            {/* Predictions & ABC classification matrix (col-span-8) */}
            <div className="lg:col-span-8 space-y-app-24">
              
              {/* Gemini predictions card */}
              <AppCard className="border-app-primary/20 bg-gradient-to-br from-app-surface to-app-primary/[0.02]">
                <div className="flex items-center justify-between border-b border-app-border pb-3.5 mb-4">
                  <span className="flex items-center gap-1.5 text-app-primary font-bold text-[10px] uppercase tracking-wider">
                    <Sparkles size={14} className="animate-pulse" />
                    Gemini AI Inventory Prediction Copilot
                  </span>
                  <Badge status="info">98% Accuracy</Badge>
                </div>

                {analyticsData?.low_stock_predicted_items?.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-app-success bg-app-success/10 border border-app-success/20 p-4 rounded-app-xl">
                    <Check size={16} />
                    All stock levels are optimal. Zero shortage risks predicted over next 5 days.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-app-16">
                    {analyticsData?.low_stock_predicted_items?.map((item) => (
                      <div key={item.ingredient_id} className="bg-app-bg border border-app-border p-4 rounded-app-xl flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-text-primary text-xs font-bold">{item.name}</span>
                            <Badge status={item.abc_class === 'A' ? 'danger' : 'default'}>ABC: {item.abc_class}</Badge>
                          </div>
                          <p className="text-[10px] text-text-secondary mt-1 flex items-center gap-1">
                            <AlertCircle size={11} className="text-app-warning" />
                            Stock depletion forecast: <span className="text-app-warning font-bold">{item.days_remaining} days</span>.
                          </p>
                        </div>
                        <div className="text-[9px] font-extrabold text-text-muted flex items-center justify-between border-t border-app-border pt-2.5">
                          <span>Reorder Recommendation:</span>
                          <span className="text-text-primary">{item.reorder_quantity_suggested} kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AppCard>

              {/* ABC Analysis */}
              <AppCard className="space-y-4">
                <span className="text-text-primary text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <TrendingUp size={14} className="text-app-primary" />
                  ABC Inventory Classification Matrix
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-app-16">
                  <div className="border border-app-danger/25 bg-app-danger/5 p-4 rounded-app-xl space-y-1">
                    <h4 className="text-xs font-extrabold text-app-danger">Class A (High Value)</h4>
                    <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                      Top cost factors like raw meats and fresh seafood. High audit priority.
                    </p>
                  </div>
                  <div className="border border-app-warning/25 bg-app-warning/5 p-4 rounded-app-xl space-y-1">
                    <h4 className="text-xs font-extrabold text-app-warning">Class B (Medium Value)</h4>
                    <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                      Medium cost factors like dairy batches and specialty imports.
                    </p>
                  </div>
                  <div className="border border-app-border bg-app-bg p-4 rounded-app-xl space-y-1">
                    <h4 className="text-xs font-extrabold text-text-primary">Class C (Low Value)</h4>
                    <p className="text-[10px] text-text-muted leading-relaxed font-medium">
                      Low cost elements like flour, dry seasonings, and paper supplies.
                    </p>
                  </div>
                </div>
              </AppCard>

            </div>

            {/* Sidebar Active reorders alerts (col-span-4) */}
            <div className="lg:col-span-4">
              <AppCard className="p-5 flex flex-col gap-4">
                <div className="border-b border-app-border pb-3">
                  <h3 className="text-text-primary font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle size={15} className="text-app-warning animate-pulse" />
                    Active Reorders Log
                  </h3>
                </div>

                {reorderAlerts.filter(a => a.status === 'active').length === 0 ? (
                  <EmptyState title="All clear" description="Zero critical stock alerts logged." icon={Check} />
                ) : (
                  <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                    {reorderAlerts.filter(a => a.status === 'active').map(alert => (
                      <div key={alert.id} className="bg-app-bg border border-app-border p-4 rounded-app-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-text-primary text-xs font-bold">{alert.ingredient_name}</span>
                          <Badge status={alert.alert_type === 'critical_stock' ? 'danger' : 'warning'}>
                            {alert.alert_type === 'critical_stock' ? 'CRITICAL' : 'WARNING'}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                          {alert.message}
                        </p>
                        <PrimaryButton
                          onClick={() => handleResolveAlert(alert.id)}
                          className="w-full h-8 text-[10px] font-bold mt-2"
                        >
                          Acknowledge & Resolve
                        </PrimaryButton>
                      </div>
                    ))}
                  </div>
                )}
              </AppCard>
            </div>

          </div>
        )}

        {/* TAB 2: INGREDIENTS LISTING */}
        {activeTab === 'ingredients' && (
          <AppCard className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search size={14} className="text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by ingredient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-app-elevated text-text-primary w-full pl-9 pr-4 py-2.5 border border-transparent focus:border-app-primary rounded-app-xl text-xs outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full md:w-40"
                >
                  <option value="all">All Categories</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="meat">Meat & Seafood</option>
                  <option value="dairy">Dairy</option>
                  <option value="dry_goods">Dry Goods</option>
                </Select>
                <Select
                  value={abcFilter}
                  onChange={(e) => setAbcFilter(e.target.value)}
                  className="w-full md:w-36"
                >
                  <option value="all">All ABC Class</option>
                  <option value="A">Class A</option>
                  <option value="B">Class B</option>
                  <option value="C">Class C</option>
                </Select>
                <PrimaryButton onClick={() => setIngDrawerOpen(true)} icon={Plus}>
                  New Ingredient
                </PrimaryButton>
              </div>
            </div>

            {filteredIngredients.length === 0 ? (
              <EmptyState title="No records match filters" description="Refine filters or add ingredient." icon={Coffee} />
            ) : (
              <div className="overflow-x-auto border border-app-border rounded-app-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-app-elevated/40 text-[10px] text-text-muted border-b border-app-border font-extrabold uppercase">
                      <th className="py-4 px-6">Ingredient Name</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Current Stock vs Target Capacity</th>
                      <th className="py-4 px-6">ABC Class</th>
                      <th className="py-4 px-6">Unit</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border text-xs text-text-secondary">
                    {paginatedIngredients.map((ing) => {
                      // Calculate stock percentage
                      const stockPercent = Math.min(100, Math.round(((ing.current_stock || 0) / (ing.max_stock || 1)) * 100));
                      const isLowStock = (ing.current_stock || 0) <= (ing.min_stock || 0);

                      return (
                        <tr key={ing.id} className="hover:bg-app-hover/50 transition-colors">
                          <td className="py-4 px-6">
                            <p className="text-text-primary font-bold">{ing.name}</p>
                            {isLowStock && <span className="text-[9px] text-app-danger font-extrabold flex items-center gap-0.5 mt-0.5"><AlertCircle size={10} />Under Reorder limit ({ing.min_stock} {ing.unit})</span>}
                          </td>
                          <td className="py-4 px-6 uppercase font-bold text-[10px]">{ing.category}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-app-elevated w-36 h-2 rounded-full overflow-hidden border border-app-border shrink-0">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${isLowStock ? 'bg-app-danger' : 'bg-app-primary'}`} 
                                  style={{ width: `${stockPercent}%` }} 
                                />
                              </div>
                              <span className="font-extrabold text-text-primary">{ing.current_stock} / {ing.max_stock} {ing.unit}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge status={ing.abc_class === 'A' ? 'danger' : ing.abc_class === 'B' ? 'warning' : 'default'}>
                              Class {ing.abc_class}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 font-semibold">{ing.unit}</td>
                          <td className="py-4 px-6 text-right">
                            <SecondaryButton
                              onClick={() => {
                                setAdjustFormData(prev => ({ ...prev, ingredient: ing.id, quantity: ing.current_stock }));
                                setAdjustDrawerOpen(true);
                              }}
                              className="px-2.5 py-1 text-[10px] h-8"
                            >
                              Reconcile
                            </SecondaryButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paging controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-app-border pt-4">
                <span className="text-[10px] font-extrabold text-text-muted">
                  Page {currentPage} of {totalPages} ({filteredIngredients.length} items)
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

        {/* TAB: DAILY STOCK SHEET */}
        {activeTab === 'daily-stock' && (
          <AppCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <div>
                <h3 className="text-text-primary font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <ClipboardList size={15} className="text-app-primary" />
                  Daily Stock Sheet Ledger
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5">Record daily opening/closing stocks and calculate consumption</p>
              </div>
              <PrimaryButton 
                onClick={() => setDailyStockDrawerOpen(true)}
                className="flex items-center gap-1.5 text-xs py-2 font-extrabold uppercase tracking-wide"
              >
                <Plus size={14} /> Log Stock Record
              </PrimaryButton>
            </div>

            {dailyStockRecords.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-app-border rounded-app-xl bg-app-surface/5">
                <ClipboardList size={32} className="text-text-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-text-primary">No Daily Stock Sheet Records Found</p>
                <p className="text-[10px] text-text-muted mt-0.5">Click 'Log Stock Record' to start tracking daily inventory status.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-app-border text-text-muted font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pl-2">Logged Date</th>
                      <th className="pb-3">Ingredient</th>
                      <th className="pb-3 text-right">Opening Stock</th>
                      <th className="pb-3 text-right">Purchased Today</th>
                      <th className="pb-3 text-right">Closing Stock</th>
                      <th className="pb-3 text-right text-app-primary font-black">Consumption</th>
                      <th className="pb-3 pl-4">Logged By</th>
                      <th className="pb-3 pr-2 text-right">Logged At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStockRecords.map((rec) => (
                      <tr key={rec.id} className="border-b border-app-border/40 hover:bg-app-surface/10 transition-colors">
                        <td className="py-3 pl-2 font-semibold text-text-secondary">{rec.opening_date}</td>
                        <td className="py-3">
                          <span className="font-bold text-text-primary">{rec.ingredient_name}</span>
                          <span className="ml-1 text-[10px] text-text-muted bg-app-surface/50 border border-app-border/50 px-1 py-0.5 rounded uppercase">{rec.ingredient_unit}</span>
                        </td>
                        <td className="py-3 text-right font-semibold">{parseFloat(rec.opening_stock).toFixed(2)}</td>
                        <td className="py-3 text-right font-semibold text-text-muted">{parseFloat(rec.purchased_stock).toFixed(2)}</td>
                        <td className="py-3 text-right font-semibold">{parseFloat(rec.closing_stock).toFixed(2)}</td>
                        <td className="py-3 text-right font-black text-app-primary bg-app-primary/5 px-2 rounded">{parseFloat(rec.consumption).toFixed(2)}</td>
                        <td className="py-3 pl-4 text-text-secondary font-medium">{rec.manager_name || 'System'}</td>
                        <td className="py-3 pr-2 text-right text-text-muted text-[10px]">
                          {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AppCard>
        )}

        {/* TAB 3: PURCHASES & INVOICES */}
        {activeTab === 'purchases' && (
          <AppCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h3 className="text-text-primary font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <ShoppingBag size={15} className="text-app-primary" />
                Purchases ledger invoices
              </h3>
            </div>

            {purchases.length === 0 ? (
              <EmptyState title="No purchases recorded" description="Submit purchase delivery to see logs." icon={ShoppingBag} />
            ) : (
              <div className="overflow-x-auto border border-app-border rounded-app-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-app-elevated/40 text-[10px] text-text-muted border-b border-app-border font-extrabold uppercase">
                      <th className="py-4 px-6">Invoice Number</th>
                      <th className="py-4 px-6">Supplier Vendor</th>
                      <th className="py-4 px-6">Items Quantity Count</th>
                      <th className="py-4 px-6">Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border text-xs text-text-secondary">
                    {purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-app-hover/50 transition-colors">
                        <td className="py-4 px-6 font-extrabold text-text-primary">{p.invoice_no}</td>
                        <td className="py-4 px-6 font-bold text-text-primary">{p.vendor_name || 'Generic Vendor'}</td>
                        <td className="py-4 px-6 font-semibold">{p.items?.length || 0} batches lines</td>
                        <td className="py-4 px-6">{new Date(p.purchase_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AppCard>
        )}

        {/* TAB 4: SUPPLIERS DIRECTORY */}
        {activeTab === 'vendors' && (
          <AppCard className="space-y-6">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h3 className="text-text-primary font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Truck size={15} className="text-app-primary" />
                Seeded suppliers directory
              </h3>
              <PrimaryButton onClick={() => setVendorDrawerOpen(true)} icon={Plus}>
                Add Supplier
              </PrimaryButton>
            </div>

            {vendors.length === 0 ? (
              <EmptyState title="No suppliers registered" description="Add vendors to allocate invoices." icon={Truck} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-app-20">
                {vendors.map((v) => (
                  <AppCard key={v.id} className="p-5 border-app-border hover:border-app-primary/20">
                    <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-1.5">
                      <Truck size={15} className="text-text-muted" />
                      {v.name}
                    </h4>
                    
                    <div className="space-y-2.5 text-xs text-text-secondary leading-normal">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Contact Name</span>
                        <span className="font-semibold text-text-primary">{v.contact_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Phone Number</span>
                        <span className="font-semibold text-text-primary">{v.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Email Address</span>
                        <span className="font-semibold text-text-primary truncate max-w-[65%]">{v.email || 'N/A'}</span>
                      </div>
                    </div>
                  </AppCard>
                ))}
              </div>
            )}
          </AppCard>
        )}

        {/* TAB 5: WASTAGE & SPOILAGE LOG */}
        {activeTab === 'wastage' && (
          <AppCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h3 className="text-text-primary font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingDown size={15} className="text-app-danger" />
                Logged food wastage entries
              </h3>
            </div>

            {wastages.length === 0 ? (
              <EmptyState title="No spoilage logged" description="Use Log Spoilage to register food waste." icon={TrendingDown} />
            ) : (
              <div className="overflow-x-auto border border-app-border rounded-app-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-app-elevated/40 text-[10px] text-text-muted border-b border-app-border font-extrabold uppercase">
                      <th className="py-4 px-6">Ingredient Name</th>
                      <th className="py-4 px-6">Quantity Lost</th>
                      <th className="py-4 px-6">Reason</th>
                      <th className="py-4 px-6">Wastage Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border text-xs text-text-secondary">
                    {wastages.map((w) => (
                      <tr key={w.id} className="hover:bg-app-hover/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-text-primary">{w.ingredient_name}</td>
                        <td className="py-4 px-6 font-extrabold text-app-danger">-{w.quantity} {w.unit}</td>
                        <td className="py-4 px-6 uppercase font-bold text-[10px] text-text-muted">{w.reason}</td>
                        <td className="py-4 px-6">{new Date(w.wastage_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AppCard>
        )}

        {/* TAB 6: AUDIT LEDGER TRAIL */}
        {activeTab === 'movements' && (
          <AppCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h3 className="text-text-primary font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <FileSpreadsheet size={15} className="text-app-primary" />
                Batch inventory movement ledgers
              </h3>
            </div>

            {movements.length === 0 ? (
              <EmptyState title="Audit Ledger is empty" description="No movements recorded yet." icon={FileSpreadsheet} />
            ) : (
              <div className="overflow-x-auto border border-app-border rounded-app-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-app-elevated/40 text-[10px] text-text-muted border-b border-app-border font-extrabold uppercase">
                      <th className="py-4 px-6">Ingredient Name</th>
                      <th className="py-4 px-6">Movement Type</th>
                      <th className="py-4 px-6">Quantity</th>
                      <th className="py-4 px-6">Ledger Reason</th>
                      <th className="py-4 px-6">Movement Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border text-xs text-text-secondary">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-app-hover/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-text-primary">{m.ingredient_name}</td>
                        <td className="py-4 px-6">
                          <Badge status={m.movement_type === 'in' ? 'success' : 'danger'}>
                            {m.movement_type === 'in' ? 'Stock In' : 'Stock Out'}
                          </Badge>
                        </td>
                        <td className={`py-4 px-6 font-extrabold ${m.movement_type === 'in' ? 'text-app-success' : 'text-app-danger'}`}>
                          {m.movement_type === 'in' ? '+' : '-'}{m.quantity} {m.unit}
                        </td>
                        <td className="py-4 px-6 text-text-muted">{m.reason}</td>
                        <td className="py-4 px-6">{new Date(m.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AppCard>
        )}

      </motion.div>

      {/* 5. DRAWERS ADD/EDIT FORMS */}

      {/* A. Add Ingredient Drawer */}
      <Drawer
        isOpen={ingDrawerOpen}
        onClose={() => setIngDrawerOpen(false)}
        title="Add New Ingredient Item"
      >
        <form onSubmit={handleIngSubmit} className="space-y-4">
          <Input
            label="Ingredient Name"
            name="name"
            value={ingFormData.name}
            onChange={(e) => handleInputChange(e, setIngFormData)}
            placeholder="e.g. Mozzarella Cheese"
            required
          />
          <Select
            label="Ingredient Category"
            name="category"
            value={ingFormData.category}
            onChange={(e) => handleInputChange(e, setIngFormData)}
          >
            <option value="vegetables">Vegetables</option>
            <option value="meat">Meat & Seafood</option>
            <option value="dairy">Dairy</option>
            <option value="dry_goods">Dry Goods</option>
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Stock"
              name="min_stock"
              type="number"
              value={ingFormData.min_stock}
              onChange={(e) => handleInputChange(e, setIngFormData)}
              required
            />
            <Input
              label="Max Stock"
              name="max_stock"
              type="number"
              value={ingFormData.max_stock}
              onChange={(e) => handleInputChange(e, setIngFormData)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Base Unit"
              name="unit"
              value={ingFormData.unit}
              onChange={(e) => handleInputChange(e, setIngFormData)}
            >
              <option value="kg">kilogram (kg)</option>
              <option value="liters">liters (l)</option>
              <option value="units">units (pcs)</option>
            </Select>
            <Select
              label="ABC Classification"
              name="abc_class"
              value={ingFormData.abc_class}
              onChange={(e) => handleInputChange(e, setIngFormData)}
            >
              <option value="A">Class A (High cost)</option>
              <option value="B">Class B (Medium cost)</option>
              <option value="C">Class C (Low cost)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
            <SecondaryButton onClick={() => setIngDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Register Ingredient
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* B. Add Vendor Drawer */}
      <Drawer
        isOpen={vendorDrawerOpen}
        onClose={() => setVendorDrawerOpen(false)}
        title="Add Seeded Supplier Vendor"
      >
        <form onSubmit={handleVendorSubmit} className="space-y-4">
          <Input
            label="Vendor Name"
            name="name"
            value={vendorFormData.name}
            onChange={(e) => handleInputChange(e, setVendorFormData)}
            placeholder="e.g. Bangalore Dairy Farm"
            required
          />
          <Input
            label="Contact Rep Name"
            name="contact_name"
            value={vendorFormData.contact_name}
            onChange={(e) => handleInputChange(e, setVendorFormData)}
            placeholder="e.g. Rajesh Kumar"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              name="phone"
              value={vendorFormData.phone}
              onChange={(e) => handleInputChange(e, setVendorFormData)}
              placeholder="+91..."
            />
            <Input
              label="Contact Email"
              name="email"
              type="email"
              value={vendorFormData.email}
              onChange={(e) => handleInputChange(e, setVendorFormData)}
              placeholder="rajesh@..."
            />
          </div>
          <Textarea
            label="Address details"
            name="address"
            value={vendorFormData.address}
            onChange={(e) => handleInputChange(e, setVendorFormData)}
            placeholder="Warehouse coordinate details..."
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
            <SecondaryButton onClick={() => setVendorDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Register Supplier
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* C. Receive Purchase Invoice Drawer with dynamic item lines builder */}
      <Drawer
        isOpen={purchaseDrawerOpen}
        onClose={() => setPurchaseDrawerOpen(false)}
        title="Receive Supplier Purchase Invoice"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
          <Select
            label="Select Supplier"
            name="vendor"
            value={purchaseFormData.vendor}
            onChange={(e) => handleInputChange(e, setPurchaseFormData)}
            required
          >
            <option value="">-- Choose Vendor --</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </Select>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              name="invoice_no"
              value={purchaseFormData.invoice_no}
              onChange={(e) => handleInputChange(e, setPurchaseFormData)}
              placeholder="e.g. INV-9871"
              required
            />
            <Input
              label="Purchase Date"
              name="purchase_date"
              type="date"
              value={purchaseFormData.purchase_date}
              onChange={(e) => handleInputChange(e, setPurchaseFormData)}
              required
            />
          </div>

          <div className="border-t border-app-border pt-4 mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Invoice Batches Line Items</span>
              <SecondaryButton onClick={addPurchaseItemLine} icon={PlusCircle} className="py-1 px-3 text-[10px]">
                Add Item
              </SecondaryButton>
            </div>

            {purchaseFormData.items.map((item, idx) => (
              <div key={idx} className="bg-app-bg p-4 border border-app-border rounded-app-xl relative space-y-3">
                {purchaseFormData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePurchaseItemLine(idx)}
                    className="absolute top-2 right-2 text-text-muted hover:text-app-danger transition-colors p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                )}

                <Select
                  label="Select Ingredient"
                  value={item.ingredient}
                  onChange={(e) => handlePurchaseItemChange(idx, 'ingredient', e.target.value)}
                  required
                >
                  <option value="">-- Choose Ingredient --</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </Select>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Quantity Received"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handlePurchaseItemChange(idx, 'quantity', parseFloat(e.target.value))}
                    required
                  />
                  <Input
                    label="Unit Price (₹)"
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => handlePurchaseItemChange(idx, 'unit_price', parseFloat(e.target.value))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Batch Code"
                    value={item.batch_number}
                    onChange={(e) => handlePurchaseItemChange(idx, 'batch_number', e.target.value)}
                    placeholder="B-98"
                  />
                  <Input
                    label="Expiry Date"
                    type="date"
                    value={item.expiry_date}
                    onChange={(e) => handlePurchaseItemChange(idx, 'expiry_date', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
            <SecondaryButton onClick={() => setPurchaseDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="shadow-app-md">
              Receive delivery invoice
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* D. Log Spoilage Wastage Drawer */}
      <Drawer
        isOpen={wastageDrawerOpen}
        onClose={() => setWastageDrawerOpen(false)}
        title="Log Food Wastage Spoilage"
      >
        <form onSubmit={handleWastageSubmit} className="space-y-4">
          <Select
            label="Select Ingredient"
            name="ingredient"
            value={wastageFormData.ingredient}
            onChange={(e) => handleInputChange(e, setWastageFormData)}
            required
          >
            <option value="">-- Choose Ingredient --</option>
            {ingredients.map(ing => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity Lost"
              name="quantity"
              type="number"
              step="0.1"
              value={wastageFormData.quantity}
              onChange={(e) => handleInputChange(e, setWastageFormData)}
              required
            />
            <Select
              label="Wastage Reason"
              name="reason"
              value={wastageFormData.reason}
              onChange={(e) => handleInputChange(e, setWastageFormData)}
            >
              <option value="spoilage">Spoilage</option>
              <option value="expired">Expired</option>
              <option value="damaged">Damaged delivery</option>
              <option value="prep_waste">Prep wastage</option>
            </Select>
          </div>
          <Textarea
            label="Additional details description"
            name="description"
            value={wastageFormData.description}
            onChange={(e) => handleInputChange(e, setWastageFormData)}
            placeholder="Describe wastage logs context..."
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
            <SecondaryButton onClick={() => setWastageDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Log Spoilage Lost
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* E. Reconcile Stock Drawer */}
      <Drawer
        isOpen={adjustDrawerOpen}
        onClose={() => setAdjustDrawerOpen(false)}
        title="Reconcile Physical Inventory Discrepancies"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="bg-app-danger/10 border border-app-danger/20 p-4 rounded-app-xl flex items-start gap-2.5">
            <AlertTriangle className="text-app-danger shrink-0 mt-0.5" size={16} />
            <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
              Warning: Reconciling physical inventory creates a stock ledger entry adjusting target stock amounts. Verify actual warehouse weights before submitting.
            </p>
          </div>

          <Input
            label="Ingredient UUID (Read Only)"
            value={adjustFormData.ingredient}
            disabled
          />
          <Input
            label="Actual Physical Weight / Count"
            name="quantity"
            type="number"
            value={adjustFormData.quantity}
            onChange={(e) => handleInputChange(e, setAdjustFormData)}
            required
          />
          <Textarea
            label="Reason for adjustment"
            name="reason"
            value={adjustFormData.reason}
            onChange={(e) => handleInputChange(e, setAdjustFormData)}
            required
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
            <SecondaryButton onClick={() => setAdjustDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="shadow-app-md bg-gradient-to-r from-app-warning to-orange-500 border-app-warning/20">
              Reconcile Stock
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* F. Daily Stock Sheet Drawer */}
      <Drawer
        isOpen={dailyStockDrawerOpen}
        onClose={() => setDailyStockDrawerOpen(false)}
        title="Log Daily Stock Sheet Record"
      >
        <form onSubmit={handleDailyStockSubmit} className="space-y-4">
          <Select
            label="Select Ingredient"
            name="ingredient"
            value={dailyStockFormData.ingredient}
            onChange={(e) => handleInputChange(e, setDailyStockFormData)}
            required
          >
            <option value="">-- Choose Ingredient --</option>
            {ingredients.map(ing => (
              <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
            ))}
          </Select>

          <Input
            label="Opening Stock Amount"
            name="opening_stock"
            type="number"
            step="0.01"
            value={dailyStockFormData.opening_stock}
            onChange={(e) => handleInputChange(e, setDailyStockFormData)}
            required
          />

          <Input
            label="Closing Stock Amount"
            name="closing_stock"
            type="number"
            step="0.01"
            value={dailyStockFormData.closing_stock}
            onChange={(e) => handleInputChange(e, setDailyStockFormData)}
            required
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
            <SecondaryButton onClick={() => setDailyStockDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Log Daily Record
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

    </motion.div>
  );
};

export default Inventory;
