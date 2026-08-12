import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { 
  ShoppingBag, Search, Sparkles, AlertTriangle, 
  Utensils, CheckCircle, Clock, ChefHat, Play, 
  ArrowLeft, ShoppingCart, User, Plus, Minus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple Alert Component
const Alert = ({ children, variant = 'warning' }) => (
  <div className={`p-4 rounded-xl flex gap-3 text-xs font-medium border ${
    variant === 'warning' ? 'bg-amber-500/10 border-amber-500/25 text-amber-500' : 'bg-red-500/10 border-red-500/25 text-red-500'
  }`}>
    <AlertTriangle size={16} className="shrink-0" />
    <div>{children}</div>
  </div>
);

const PublicTableMenu = () => {
  const { table_id } = useParams();
  const navigate = useNavigate();

  // Data States
  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');

  // Active Placed Order State (for tracking)
  const [activeOrder, setActiveOrder] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Load Table and Menu details
  useEffect(() => {
    const fetchTableAndMenu = async () => {
      setLoading(true);
      try {
        // Fetch Table details using public or private list
        const resTables = await client.get('/reservation/tables/');
        const tables = Array.isArray(resTables.data) ? resTables.data : (resTables.data?.results || []);
        const targetTable = tables.find(t => t.id === table_id);
        
        if (!targetTable) {
          setError('Invalid Table QR Code. Please scan again or request assistance.');
          setLoading(false);
          return;
        }
        setTable(targetTable);

        // Save branch to local storage for standard guest context
        localStorage.setItem('branch_id', targetTable.branch);

        // Fetch Menu items (already updated to allow public AllowAny)
        const resMenu = await client.get('/inventory/menu-items/');
        const items = Array.isArray(resMenu.data) ? resMenu.data : (resMenu.data?.results || []);
        setMenuItems(items);

        // Unique categories list
        const cats = ['all', ...new Set(items.map(item => item.category))];
        setCategories(cats);

        // Check if there is an active order saved in localStorage for this table
        const savedOrderId = localStorage.getItem(`active_order_table_${table_id}`);
        if (savedOrderId) {
          fetchActiveOrder(savedOrderId);
        }
      } catch (err) {
        console.error(err);
        setError('Connection issue. Could not retrieve menu contents.');
      } finally {
        setLoading(false);
      }
    };

    fetchTableAndMenu();
  }, [table_id]);

  // Polling to track active order status
  useEffect(() => {
    if (!activeOrder) return;

    const interval = setInterval(() => {
      fetchActiveOrder(activeOrder.id);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [activeOrder?.id]);

  // Countdown timer for estimated preparation time
  useEffect(() => {
    if (!activeOrder || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeOrder, timeRemaining]);

  const fetchActiveOrder = async (orderId) => {
    try {
      const res = await client.get(`/inventory/orders/${orderId}/`);
      const ord = res.data;
      setActiveOrder(ord);

      if (['completed', 'cancelled', 'served'].includes(ord.status)) {
        // Clear active order reference if completed
        localStorage.removeItem(`active_order_table_${table_id}`);
      } else {
        // Calculate remaining seconds
        const createdTime = new Date(ord.created_at);
        const limitTime = new Date(createdTime.getTime() + (ord.estimated_prep_time || 15) * 60 * 1000);
        const diffSeconds = Math.max(0, Math.floor((limitTime - new Date()) / 1000));
        setTimeRemaining(diffSeconds);
      }
    } catch (err) {
      console.error('Error tracking order status:', err);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, prepNote: '' }];
    });
  };

  const updateQuantity = (itemId, amount) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const nextQty = i.quantity + amount;
        return nextQty > 0 ? { ...i, quantity: nextQty } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      const payload = {
        branch: table.branch,
        source: 'direct',
        order_type: 'dine_in',
        table: table.id,
        customer_name: `Table ${table.number} Diner`,
        customer_phone: '9999999999', // Guest fallback
        items: cart.map(item => ({
          menu_item: item.id,
          quantity: item.quantity,
          unit_price: Number(item.price)
        }))
      };

      const res = await client.post('/inventory/orders/', payload);
      const placed = res.data;
      
      setActiveOrder(placed);
      localStorage.setItem(`active_order_table_${table_id}`, placed.id);
      setCart([]);
      setCartOpen(false);
      
      // Initialize timer
      setTimeRemaining((placed.estimated_prep_time || 15) * 60);
    } catch (err) {
      console.error(err);
      alert('Failed to dispatch order. Please check connection.');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <Utensils className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading digital menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24 relative">
      
      {/* Header Banner */}
      <header className="p-4 sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
            <Utensils size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">Table {table?.number} Menu</h1>
            <p className="text-[10px] text-slate-400">Scan code ordering console</p>
          </div>
        </div>
        
        {/* Cart Trigger */}
        <button 
          onClick={() => setCartOpen(true)}
          className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 transition"
        >
          <ShoppingCart size={16} className="text-slate-200" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded-full flex items-center justify-center">
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* ACTIVE ORDER TRACKER */}
      {activeOrder && (
        <div className="m-4 p-4 bg-slate-900 border border-amber-500/20 rounded-2xl space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Live Order Tracker</span>
              <h3 className="text-xs font-bold text-white mt-0.5">Order #{activeOrder.id.slice(0, 6)}</h3>
            </div>
            <div className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/15 text-amber-500">
              {activeOrder.status}
            </div>
          </div>

          {/* Prep progress visual bar */}
          <div className="flex justify-between items-center gap-1.5 pt-2">
            {['received', 'preparing', 'ready', 'completed'].map((stage, idx) => {
              const stages = ['received', 'preparing', 'ready', 'completed', 'served'];
              const currentIdx = stages.indexOf(activeOrder.status);
              const active = currentIdx >= idx;
              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-1.5 w-full rounded-full ${
                    active ? 'bg-amber-500' : 'bg-slate-800'
                  }`} />
                  <span className={`text-[8px] uppercase tracking-wider font-extrabold ${
                    active ? 'text-amber-500' : 'text-slate-500'
                  }`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Countdown Clock */}
          {timeRemaining > 0 && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/50">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={13} className="text-amber-500" />
                <span>Estimated Prep Time:</span>
              </div>
              <span className="text-sm font-black text-white font-mono">
                {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        
        {/* Category Switcher & Search */}
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text"
              placeholder="Search dishes, drinks, appetizers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          {/* Categories Tab Swiper */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 transition ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-20 text-center text-xs text-slate-500">No dishes match selected categories.</div>
          ) : filteredItems.map(item => (
            <motion.div 
              key={item.id}
              layout
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center gap-4 hover:border-slate-700 transition"
            >
              <div className="space-y-1">
                <h3 className="text-xs font-black text-white">{item.name}</h3>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                <div className="pt-2 flex items-center gap-3">
                  <span className="text-xs font-black text-amber-500">₹{Number(item.price).toFixed(2)}</span>
                  <span className="text-[8px] font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock size={8} /> {item.prep_time} mins
                  </span>
                </div>
              </div>
              
              {/* Action */}
              <button 
                onClick={() => addToCart(item)}
                className="shrink-0 p-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-xl transition flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Cart Slider Overlay */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-900 border-l border-slate-800 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-amber-500" size={16} />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">Checkout Cart</h3>
                </div>
                <button 
                  onClick={() => setCartOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="py-20 text-center text-xs text-slate-500">Your cart is currently empty. Add dishes from the menu page to build your order ticket.</div>
                ) : cart.map(item => (
                  <div key={item.id} className="p-3 border border-slate-800 rounded-xl bg-slate-950/40 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">{item.name}</p>
                      <p className="text-[9px] text-amber-500">₹{Number(item.price).toFixed(2)} each</p>
                    </div>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold text-white min-w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Checkout Actions */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Subtotal Estimate</span>
                    <span className="font-black text-white text-sm">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  
                  <PrimaryButton 
                    onClick={handlePlaceOrder}
                    className="w-full py-2.5 text-xs font-black uppercase tracking-widest text-slate-950 bg-amber-500 hover:bg-amber-600 border-none"
                  >
                    Confirm & Place Order
                  </PrimaryButton>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Secondary and Primary fallback button styling to prevent missing imports
const PrimaryButton = ({ children, className = '', ...props }) => (
  <button 
    className={`bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-4 py-2 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-md ${className}`} 
    {...props}
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, className = '', ...props }) => (
  <button 
    className={`bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold px-4 py-2 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 ${className}`} 
    {...props}
  >
    {children}
  </button>
);

const Badge = ({ children, status }) => (
  <span className={`px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase tracking-wider ${
    status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
    status === 'danger' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
    'bg-sky-500/10 text-sky-500 border border-sky-500/20'
  }`}>
    {children}
  </span>
);

export default PublicTableMenu;
