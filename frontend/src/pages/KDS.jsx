import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Inbox,
  Utensils,
  Activity,
  Layers,
  Users,
  Sparkles
} from 'lucide-react';
import { 
  AppCard, 
  GlassCard, 
  SectionCard, 
  PrimaryButton, 
  SecondaryButton, 
  Badge, 
  LoadingOverlay,
  EmptyState,
  KPICard
} from '../components/DesignSystem';

const KDS = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [timeElapsedTick, setTimeElapsedTick] = useState(0);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'live', 'prep', 'chefs', 'delays', 'timeline', 'heatmap'

  useEffect(() => {
    if (tabParam && ['dashboard', 'live', 'prep', 'chefs', 'delays', 'timeline', 'heatmap'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Fetch KDS active orders (exclude completed / cancelled)
  const fetchActiveOrders = async () => {
    try {
      const activeBranchId = localStorage.getItem('branch_id') || user?.branch || '';
      const res = await client.get('/inventory/orders/', { params: { branch: activeBranchId } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.data || []);
      
      // Filter out completed and cancelled orders
      const active = list.filter(o => ['received', 'preparing', 'ready'].includes(o.status));
      setOrders(active);
    } catch (err) {
      console.error('KDS load failed:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchActiveOrders().finally(() => setLoading(false));

    const handleBranchChange = () => {
      setLoading(true);
      fetchActiveOrders().finally(() => setLoading(false));
    };
    window.addEventListener('branchUpdate', handleBranchChange);

    const interval = setInterval(fetchActiveOrders, 10000);
    const timer = setInterval(() => setTimeElapsedTick(t => t + 1), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
      window.removeEventListener('branchUpdate', handleBranchChange);
    };
  }, [user]);

  // Update order status on KDS board
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await client.patch(`/inventory/orders/${orderId}/`, { status: newStatus });
      addToast(`Order status updated to ${newStatus}`, 'success');
      window.dispatchEvent(new Event('branchUpdate'));
      fetchActiveOrders();
    } catch (err) {
      console.error('Failed to progress KDS order:', err);
      addToast('Failed to update order status.', 'error');
    }
  };

  const getElapsedMinutes = (createdAtStr) => {
    const created = new Date(createdAtStr);
    const diffMs = new Date() - created;
    return Math.floor(diffMs / 60000);
  };

  // Chef workloads mock calculations (SAP-style)
  const chefWorkload = useMemo(() => {
    return [
      { name: 'Head Chef Vikram', role: 'Main Kitchen Station', activeItems: 2, status: 'busy' },
      { name: 'Sous Chef Sarah', role: 'Garde Manger Salad Station', activeItems: 1, status: 'optimal' },
      { name: 'Line Cook Amit', role: 'Fryer & Dessert Station', activeItems: 0, status: 'available' }
    ];
  }, []);

  // Filter lists
  const standardPrepTime = 15;
  const delayedOrders = useMemo(() => {
    return orders.filter(o => getElapsedMinutes(o.created_at) >= standardPrepTime);
  }, [orders]);

  const receivedOrders = orders.filter(o => o.status === 'received');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const renderOrderCard = (order) => {
    const elapsedMins = getElapsedMinutes(order.created_at);
    const isDelayed = elapsedMins >= standardPrepTime;

    return (
      <motion.div
        key={order.id}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`border rounded-xl transition-all duration-300 ${
          isDelayed 
            ? 'border-app-danger/40 bg-app-danger/[0.02] shadow-[0_0_12px_rgba(244,63,94,0.05)] animate-pulse' 
            : 'border-app-border bg-app-surface/60'
        }`}
      >
        <AppCard className="p-4 space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-text-primary uppercase tracking-tight">
                Order #{order.id.slice(0, 6).toUpperCase()}
              </span>
              <p className="text-[9px] text-text-muted mt-0.5 capitalize">
                {order.order_type.replace('_', ' ')} • {order.source}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[10px] font-bold flex items-center gap-1 ${
                isDelayed ? 'text-app-danger' : 'text-text-secondary'
              }`}>
                <Clock size={12} />
                <span>{elapsedMins}m elapsed</span>
              </span>
              {isDelayed && <Badge status="danger">Delayed</Badge>}
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-1.5 py-2 border-t border-b border-app-border/40">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-xs font-semibold text-text-primary">
                <span>{item.quantity}x {item.menu_item_name}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {order.status === 'received' && (
              <PrimaryButton onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full text-[10px] py-1">
                Start Preparing
              </PrimaryButton>
            )}
            {order.status === 'preparing' && (
              <PrimaryButton onClick={() => updateOrderStatus(order.id, 'ready')} className="w-full text-[10px] py-1">
                Mark Ready
              </PrimaryButton>
            )}
            {order.status === 'ready' && (
              <SecondaryButton onClick={() => updateOrderStatus(order.id, 'completed')} className="w-full text-[10px] py-1 border-app-success/30 text-app-success">
                Complete Checkout
              </SecondaryButton>
            )}
          </div>
        </AppCard>
      </motion.div>
    );
  };

  return (
    <div className="space-y-app-24 animate-fade-in relative min-h-[85vh] text-text-secondary">

      {/* HEADER */}
      <GlassCard className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-app-20 border-app-primary/20 shadow-app-sm">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-primary/10 text-app-primary border border-app-primary/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
              <ChefHat size={12} />
              Kitchen Display System (KDS)
            </span>
            <Badge status="success">Active Cooks: {chefWorkload.filter(c => c.status !== 'busy').length}</Badge>
            {delayedOrders.length > 0 && (
              <Badge status="danger">{delayedOrders.length} Delayed Orders</Badge>
            )}
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
            Kitchen Operations Center
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Monitor real-time food tickets preparation progress, station load balancing, and dispatch status.
          </p>
        </div>
      </GlassCard>

      {/* SUB-TABS */}
      <div className="flex gap-2 border-b border-app-border pb-2 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'KDS Dashboard', icon: Activity },
          { id: 'live', label: 'Live Kanban', icon: Layers },
          { id: 'prep', label: 'Prep Breakdown', icon: Utensils },
          { id: 'chefs', label: 'Chef Performance', icon: Users },
          { id: 'delays', label: 'Delays Alert', icon: AlertCircle },
          { id: 'timeline', label: 'Order Timeline', icon: Clock },
          { id: 'heatmap', label: 'Station Heatmap', icon: Sparkles }
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
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {/* TAB 1: KANBAN BOARD */}
          {activeTab === 'live' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* RECEIVED COLUMN */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-app-border pb-2">
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Queue / Received ({receivedOrders.length})
                  </h2>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {receivedOrders.length > 0 ? (
                    receivedOrders.map(renderOrderCard)
                  ) : (
                    <div className="p-8 text-center text-xs text-text-muted border border-app-border border-dashed rounded-xl">
                      No new order tickets.
                    </div>
                  )}
                </div>
              </div>

              {/* PREPARING COLUMN */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-app-border pb-2">
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    In Prep ({preparingOrders.length})
                  </h2>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {preparingOrders.length > 0 ? (
                    preparingOrders.map(renderOrderCard)
                  ) : (
                    <div className="p-8 text-center text-xs text-text-muted border border-app-border border-dashed rounded-xl">
                      No items currently in preparation.
                    </div>
                  )}
                </div>
              </div>

              {/* READY COLUMN */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-app-border pb-2">
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Ready / Dispatch ({readyOrders.length})
                  </h2>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {readyOrders.length > 0 ? (
                    readyOrders.map(renderOrderCard)
                  ) : (
                    <div className="p-8 text-center text-xs text-text-muted border border-app-border border-dashed rounded-xl">
                      No orders pending dispatch checklist.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREP BREAKDOWN LIST */}
          {activeTab === 'prep' && (
            <SectionCard title="Live Preparation Breakdown" subtitle="Detailed table list of active kitchen tickets">
              <div className="border border-app-border rounded-xl overflow-hidden bg-app-elevated">
                <table className="w-full text-xs text-left border-collapse font-medium">
                  <thead>
                    <tr className="bg-app-surface border-b border-app-border font-extrabold text-text-primary uppercase tracking-wider text-[10px]">
                      <th className="p-3.5">Ticket #</th>
                      <th className="p-3.5">Dish Items</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Age</th>
                      <th className="p-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? (
                      orders.map(o => (
                        <tr key={o.id} className="border-b border-app-border/40 hover:bg-app-surface transition-colors">
                          <td className="p-3.5 text-text-primary font-bold">#{o.id.slice(0, 6).toUpperCase()}</td>
                          <td className="p-3.5">
                            {o.items?.map(it => `${it.quantity}x ${it.menu_item_name}`).join(', ')}
                          </td>
                          <td className="p-3.5 capitalize">{o.order_type.replace('_', ' ')}</td>
                          <td className="p-3.5 font-bold">{getElapsedMinutes(o.created_at)}m ago</td>
                          <td className="p-3.5 text-right">
                            <Badge status={o.status === 'ready' ? 'success' : o.status === 'preparing' ? 'warning' : 'info'}>
                              {o.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-text-muted">
                          No active kitchen items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* TAB 3: CHEF PERFORMANCE */}
          {activeTab === 'chefs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="Active Station Workloads" subtitle="Rostered chefs current workload quotas">
                <div className="space-y-4">
                  {chefWorkload.map((chef, idx) => (
                    <div key={idx} className="p-4 border border-app-border rounded-xl bg-app-elevated flex justify-between items-center text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="font-extrabold text-text-primary block text-sm">{chef.name}</span>
                        <span className="text-text-muted font-bold text-[10px] block uppercase tracking-wider">{chef.role}</span>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge status={chef.status === 'busy' ? 'warning' : 'success'}>
                          {chef.status}
                        </Badge>
                        <span className="text-[10px] text-text-muted block mt-1 font-bold">{chef.activeItems} active orders</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
              
              <AppCard className="p-5 bg-app-surface text-xs leading-relaxed font-semibold">
                <h3 className="font-extrabold text-text-primary uppercase tracking-wider text-[10px] mb-2 border-b border-app-border pb-1">Kitchen Station Allocations</h3>
                <p>
                  To balance prep queues, orders are automatically routed to stations based on menu category:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-text-secondary mt-2">
                  <li>Main Kitchen: Handles Pizzas, Burgers, Entrées.</li>
                  <li>Garde Manger: Handles Salads, Cold appetizers.</li>
                  <li>Beverage & Fryer: Mocktails, Shakes, Fries, Desserts.</li>
                </ul>
              </AppCard>
            </div>
          )}

          {/* TAB 4: DELAYS ALERT */}
          {activeTab === 'delays' && (
            <SectionCard title="Delayed Kitchen Tickets Warning" subtitle="Delayed orders requiring manager intervention">
              <div className="space-y-4">
                {delayedOrders.length > 0 ? (
                  delayedOrders.map(renderOrderCard)
                ) : (
                  <EmptyState title="All clear!" description="No current order tickets exceed standard prep thresholds." icon={CheckCircle} />
                )}
              </div>
            </SectionCard>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Average Prep Time" value="12.4 mins" description="Mean KDS ticket cycle time" />
                <KPICard title="Orders Completed" value="142 Tickets" description="Today's total orders checklist" />
                <KPICard title="Active Stations" value="3 Units" description="Main, Garde Manger, Dessert" />
                <KPICard title="Safety Limit Violations" value={`${delayedOrders.length} Alerts`} description="Exceeding 15-minute standard threshold" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionCard title="Station Load Allocations" subtitle="Current processing items by station">
                  <div className="space-y-3.5">
                    {[
                      { name: 'Main Grill Kitchen', load: '82%', items: 5, color: 'bg-app-danger' },
                      { name: 'Garde Manger Salad Station', load: '45%', items: 2, color: 'bg-app-warning' },
                      { name: 'Fryer & Dessert Station', load: '12%', items: 0, color: 'bg-app-success' }
                    ].map((s, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-text-primary">
                          <span>{s.name} ({s.items} items active)</span>
                          <span>{s.load} Load</span>
                        </div>
                        <div className="w-full bg-app-surface h-2 rounded-full overflow-hidden border border-app-border">
                          <div className={`h-full ${s.color} rounded-full`} style={{ width: s.load }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title="Priority Prep Guidelines" subtitle="SaaS cloud kitchen queue priorities">
                  <div className="divide-y divide-app-border border border-app-border rounded-xl bg-app-elevated text-xs font-semibold">
                    <div className="p-3 flex justify-between">
                      <span className="text-text-primary">Dine-In VIP Reservations</span>
                      <Badge status="danger">High Priority</Badge>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="text-text-primary">Delivery orders (Zomato/Swiggy)</span>
                      <Badge status="warning">Medium Priority</Badge>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="text-text-primary">Takeaway / Walk-in checkouts</span>
                      <Badge status="info">Standard Priority</Badge>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <SectionCard title="Chronological Order Timeline" subtitle="Chrono order dispatch log tracker">
              <div className="space-y-4">
                {orders.map(o => (
                  <div key={o.id} className="p-3 bg-app-surface border border-app-border rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-extrabold text-text-primary block">Order #{o.id.slice(0, 6).toUpperCase()}</span>
                      <span className="text-[10px] text-text-muted">{o.order_type.replace('_', ' ').toUpperCase()} • {o.source.toUpperCase()}</span>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge status={o.status === 'ready' ? 'success' : 'warning'}>{o.status}</Badge>
                      <span className="text-[10px] text-text-muted block font-semibold">{getElapsedMinutes(o.created_at)}m ago</span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="p-8 text-center text-text-muted">No chronological logs loaded.</div>
                )}
              </div>
            </SectionCard>
          )}

          {activeTab === 'heatmap' && (
            <SectionCard title="Kitchen Station Heatmap" subtitle="Active preparation bottlenecks based on station load">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Main Grill Kitchen', load: 'High (82%)', count: 5, color: 'border-red-500/30 bg-red-500/5', text: 'text-red-400', desc: 'Congested. Prep time average increased to 16.8 mins.' },
                  { name: 'Garde Manger Salad', load: 'Optimal (45%)', count: 2, color: 'border-amber-500/30 bg-amber-500/5', text: 'text-amber-400', desc: 'Standard flow. Normal salads preparation cycle.' },
                  { name: 'Fryer & Dessert Station', load: 'Available (12%)', count: 0, color: 'border-emerald-500/30 bg-emerald-500/5', text: 'text-emerald-400', desc: 'Clear queue. Immediate processing capability.' }
                ].map((station, idx) => (
                  <GlassCard key={idx} className={`p-5 border ${station.color} text-xs space-y-3`}>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="font-extrabold text-text-primary text-sm">{station.name}</span>
                      <span className={`font-black ${station.text}`}>{station.load}</span>
                    </div>
                    <p className="text-[10px] text-text-muted leading-relaxed font-semibold">{station.desc}</p>
                    <div className="flex justify-between items-center text-[10px] font-bold text-text-primary">
                      <span>Active Tickets:</span>
                      <span>{station.count} tickets</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </SectionCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default KDS;
