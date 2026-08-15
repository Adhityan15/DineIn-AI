import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Sparkles, 
  DollarSign, 
  Clock, 
  UtensilsCrossed, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Check, 
  Trash2, 
  Edit3, 
  Copy, 
  TrendingUp, 
  Star, 
  RefreshCw, 
  Flame, 
  Activity, 
  Heart, 
  Layers, 
  ShoppingBag, 
  Percent, 
  Info,
  Calendar,
  AlertCircle,
  ThumbsUp,
  SlidersHorizontal,
  ChevronRight,
  Smile,
  BookOpen
} from 'lucide-react';

import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  Input,
  Select,
  Switch,
  Badge,
  LoadingOverlay,
  EmptyState,
  AppCard,
  AnimatedCounter,
  Modal,
  Drawer,
  KPICard
} from '../components/DesignSystem';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
};

const AI_SCORE_GLOW = "shadow-[0_0_24px_rgba(99,102,241,0.25)] border-indigo-500/30";

const MenuStudio = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  
  // Search, Filter, Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState(1000);
  const [vegFilter, setVegFilter] = useState('all'); // 'all', 'veg', 'non-veg'
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'unavailable'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'rating', 'popular', 'price-low', 'price-high'

  // Navigation tabs
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('studio'); // 'studio', 'matrix', 'insights', 'categories', 'preview'

  useEffect(() => {
    if (tabParam) {
      let target = tabParam;
      if (target === 'list' || target === 'manage') target = 'studio';
      if (target === 'engineering') target = 'matrix';
      
      if (['studio', 'matrix', 'insights', 'categories', 'preview'].includes(target)) {
        setActiveTab(target);
      }
    }
  }, [tabParam]);

  // Drawer / Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('add'); // 'add', 'edit', 'duplicate'
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form states
  const [formFields, setFormFields] = useState({
    name: '',
    price: '',
    discount: '0.00',
    description: '',
    category: 'Main Course',
    veg_nonveg: 'veg',
    prep_time: 15,
    calories: 300,
    spice_level: 'medium',
    is_active: true,
    is_bestseller: false,
    is_chef_special: false,
    is_featured: false,
    image_url: ''
  });

  // Recipe inputs
  const [recipeIngredients, setRecipeIngredients] = useState([]); // [{ ingredient_id, quantity }]
  const [selectedIngredientToAdd, setSelectedIngredientToAdd] = useState('');
  const [ingredientQuantityToAdd, setIngredientQuantityToAdd] = useState('');

  // Simulated image uploads
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // Phone Mockup Customer cart Simulation
  const [customerCart, setCustomerCart] = useState({});

  // Matrix Filter States
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState('all');
  const [matrixVegFilter, setMatrixVegFilter] = useState('all');
  const [matrixDateFilter, setMatrixDateFilter] = useState('all');
  const [matrixBranchFilter, setMatrixBranchFilter] = useState('all');

  // Syncing operational datasets
  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    try {
      const [insightsRes, ingredientsRes] = await Promise.all([
        client.get('/inventory/menu-items/ai-insights/'),
        client.get('/inventory/ingredients/')
      ]);
      
      if (insightsRes.data?.success) {
        setData(insightsRes.data.data);
      }
      if (ingredientsRes.data?.success) {
        setIngredients(ingredientsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load menu intelligence datasets.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Handle Form changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormFields(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Image Upload Simulation
  const triggerImageUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      // Return a premium food placeholder image URL based on selected category
      const foodImages = {
        starters: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
        'main course': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60',
        biryani: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=60',
        chinese: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60',
        south_indian: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60',
        desserts: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60',
        beverages: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=500&auto=format&fit=crop&q=60'
      };
      
      const key = formFields.category.toLowerCase().replace(' ', '_');
      const url = foodImages[key] || foodImages['main course'];
      
      setFormFields(prev => ({ ...prev, image_url: url }));
      setImagePreview(url);
      setIsUploading(false);
      addToast('Real-time image uploaded & optimized successfully!', 'success');
    }, 1200);
  };

  // Recipe ingredient additions
  const addRecipeIngredient = () => {
    if (!selectedIngredientToAdd || !ingredientQuantityToAdd) {
      addToast('Please select an ingredient and enter a quantity.', 'warning');
      return;
    }
    const ingObj = ingredients.find(i => i.id === selectedIngredientToAdd);
    if (!ingObj) return;

    if (recipeIngredients.some(ri => ri.ingredient_id === selectedIngredientToAdd)) {
      addToast('Ingredient already added to recipe.', 'warning');
      return;
    }

    setRecipeIngredients(prev => [
      ...prev,
      {
        ingredient_id: selectedIngredientToAdd,
        name: ingObj.name,
        quantity: parseFloat(ingredientQuantityToAdd),
        unit: ingObj.unit
      }
    ]);
    setSelectedIngredientToAdd('');
    setIngredientQuantityToAdd('');
  };

  const removeRecipeIngredient = (id) => {
    setRecipeIngredients(prev => prev.filter(ri => ri.ingredient_id !== id));
  };

  // Open Drawer triggers
  const openAddDrawer = () => {
    setDrawerMode('add');
    setFormFields({
      name: '',
      price: '',
      discount: '0.00',
      description: '',
      category: 'Main Course',
      veg_nonveg: 'veg',
      prep_time: 15,
      calories: 300,
      spice_level: 'medium',
      is_active: true,
      is_bestseller: false,
      is_chef_special: false,
      is_featured: false,
      image_url: ''
    });
    setRecipeIngredients([]);
    setImagePreview('');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item) => {
    setDrawerMode('edit');
    setSelectedItem(item);
    setFormFields({
      name: item.name,
      price: item.price,
      discount: item.discount.toFixed(2),
      description: item.description,
      category: item.category,
      veg_nonveg: item.veg_nonveg,
      prep_time: item.prep_time,
      calories: item.calories,
      spice_level: item.spice_level,
      is_active: item.is_active,
      is_bestseller: item.is_bestseller,
      is_chef_special: item.is_chef_special,
      is_featured: item.is_featured,
      image_url: item.image_url || ''
    });
    setImagePreview(item.image_url || '');
    
    // load recipe ingredients
    if (item.ingredients) {
      setRecipeIngredients(item.ingredients.map(ing => ({
        ingredient_id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit
      })));
    } else {
      setRecipeIngredients([]);
    }
    
    setIsDrawerOpen(true);
  };

  const openDuplicateDrawer = (item) => {
    setDrawerMode('duplicate');
    setFormFields({
      name: `${item.name} (Copy)`,
      price: item.price,
      discount: item.discount.toFixed(2),
      description: item.description,
      category: item.category,
      veg_nonveg: item.veg_nonveg,
      prep_time: item.prep_time,
      calories: item.calories,
      spice_level: item.spice_level,
      is_active: item.is_active,
      is_bestseller: item.is_bestseller,
      is_chef_special: item.is_chef_special,
      is_featured: item.is_featured,
      image_url: item.image_url || ''
    });
    setImagePreview(item.image_url || '');
    
    if (item.ingredients) {
      setRecipeIngredients(item.ingredients.map(ing => ({
        ingredient_id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit
      })));
    } else {
      setRecipeIngredients([]);
    }
    
    setIsDrawerOpen(true);
  };

  // Submit operations
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formFields.name.trim() || !formFields.price) {
      addToast('Please fill out the name and price.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formFields,
        price: parseFloat(formFields.price),
        discount: parseFloat(formFields.discount)
      };

      let itemRes;
      if (drawerMode === 'add' || drawerMode === 'duplicate') {
        itemRes = await client.post('/inventory/menu-items/', payload);
      } else {
        itemRes = await client.patch(`/inventory/menu-items/${selectedItem.id}/`, payload);
      }

      if (itemRes.status === 200 || itemRes.status === 201) {
        const itemCreated = itemRes.data;
        // Save recipe
        if (recipeIngredients.length > 0) {
          // create standard recipe structure
          const recipePayload = {
            menu_item: itemCreated.id,
            name: 'Standard Recipe',
            description: `Auto-generated recipe for ${itemCreated.name}`
          };
          const recipeRes = await client.post('/inventory/recipes/', recipePayload);
          const recipeId = recipeRes.data.id;

          // save ingredients
          await Promise.all(recipeIngredients.map(ri => 
            client.post('/inventory/recipe-ingredients/', {
              recipe: recipeId,
              ingredient: ri.ingredient_id,
              quantity: ri.quantity
            })
          ));
        }

        addToast(
          `Menu item ${drawerMode === 'add' ? 'created' : drawerMode === 'duplicate' ? 'duplicated' : 'updated'} successfully!`,
          'success'
        );
        setIsDrawerOpen(false);
        fetchMenuData();
      }
    } catch (err) {
      console.error(err);
      addToast('Operational database write failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const triggerDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    try {
      await client.delete(`/inventory/menu-items/${itemToDelete.id}/`);
      addToast('Menu item purged successfully.', 'success');
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchMenuData();
    } catch (err) {
      console.error(err);
      addToast(' PURGE request denied by backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Mock insights application triggers
  const applyInsight = (actionText) => {
    addToast(`AI Adjustment triggered: "${actionText}" applied!`, 'success');
  };

  // Cart operations for mockup preview
  const addToCart = (itemId, itemName) => {
    setCustomerCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
    addToast(`${itemName} added to Swiggy Cart mockup!`, 'success');
  };

  const removeFromCart = (itemId) => {
    setCustomerCart(prev => {
      const updated = { ...prev };
      if (updated[itemId] > 1) {
        updated[itemId] -= 1;
      } else {
        delete updated[itemId];
      }
      return updated;
    });
  };

  // Filtered menu items memo
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];

    let items = [...data.items];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(term) || 
        (i.description && i.description.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      items = items.filter(i => i.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    // Price Filter
    items = items.filter(i => i.price <= priceRange);

    // Veg / Non-Veg
    if (vegFilter !== 'all') {
      items = items.filter(i => i.veg_nonveg.toLowerCase() === vegFilter.toLowerCase());
    }

    // Availability Filter
    if (availabilityFilter !== 'all') {
      const searchAvail = availabilityFilter === 'available';
      items = items.filter(i => i.is_available === searchAvail);
    }

    // Sorting
    items.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.created_at ? new Date(b.created_at) - new Date(a.created_at) : 1;
      }
      if (sortBy === 'rating') {
        return b.rating_avg - a.rating_avg;
      }
      if (sortBy === 'popular') {
        return b.popularity_score - a.popularity_score;
      }
      if (sortBy === 'price-low') {
        return a.price - b.price;
      }
      if (sortBy === 'price-high') {
        return b.price - a.price;
      }
      return 0;
    });

    return items;
  }, [data, searchTerm, categoryFilter, priceRange, vegFilter, availabilityFilter, sortBy]);

  // Derived dashboard metrics
  const dashboardStats = useMemo(() => {
    if (!data) return {
      totalItems: 0,
      activeItems: 0,
      hiddenItems: 0,
      avgRating: 0.0,
      todayOrders: 0,
      todayRevenue: 0.0,
      score: 85
    };
    return {
      totalItems: data.total_items,
      activeItems: data.active_items,
      hiddenItems: data.hidden_items,
      avgRating: data.avg_rating,
      todayOrders: data.today_orders,
      todayRevenue: data.today_revenue,
      score: data.ai_menu_score
    };
  }, [data]);

  // SVG Chart data
  const revenueChartPoints = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories.map(c => ({
      name: c.name,
      value: c.revenue
    }));
  }, [data]);

  const allMatrixItems = useMemo(() => {
    if (!data?.matrix) return [];
    const stars = (data.matrix.stars || []).map(x => ({ ...x, quadrant: 'Star', color: '#10B981', veg: x.is_veg ?? true }));
    const puzzles = (data.matrix.puzzles || []).map(x => ({ ...x, quadrant: 'Puzzle', color: '#F59E0B', veg: x.is_veg ?? true }));
    const ph = (data.matrix.plow_horses || []).map(x => ({ ...x, quadrant: 'Plow Horse', color: '#3B82F6', veg: x.is_veg ?? true }));
    const dogs = (data.matrix.dogs || []).map(x => ({ ...x, quadrant: 'Dog', color: '#EF4444', veg: x.is_veg ?? true }));
    let list = [...stars, ...puzzles, ...ph, ...dogs];

    if (matrixCategoryFilter !== 'all') {
      list = list.filter(i => (i.category_name || '').toLowerCase() === matrixCategoryFilter.toLowerCase());
    }
    if (matrixVegFilter !== 'all') {
      const targetVeg = matrixVegFilter === 'veg';
      list = list.filter(i => i.veg === targetVeg);
    }
    return list;
  }, [data, matrixCategoryFilter, matrixVegFilter, matrixDateFilter, matrixBranchFilter]);

  const maxProfit = useMemo(() => {
    if (allMatrixItems.length === 0) return 10;
    return Math.max(...allMatrixItems.map(x => x.profit), 10);
  }, [allMatrixItems]);

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="space-y-6 w-full relative">

      {/* 1. EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <UtensilsCrossed size={16} />
            </div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">AI Menu Studio</h1>
          </div>
          <p className="text-xs text-text-muted font-medium">
            Analyze customer ratings, recipe ingredients, cost structures, and real-time inventory anomalies.
          </p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={fetchMenuData} className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-white/10 hover:bg-white/5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Sync System
          </SecondaryButton>
          <PrimaryButton onClick={openAddDrawer} className="flex items-center gap-1.5 py-2 px-3 rounded-xl font-bold">
            <Plus size={14} />
            New Menu Item
          </PrimaryButton>
        </div>
      </div>

      {/* 2. STATS KPI GRID */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants}>
          <AppCard className="relative overflow-hidden group hover:border-indigo-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">Total Menu Items</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-black text-text-primary"><AnimatedCounter value={dashboardStats.totalItems} /></h2>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 bg-app-success/15 text-app-success">
                Active {dashboardStats.activeItems}
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-medium mt-1 truncate">Inactive/Hidden: {dashboardStats.hiddenItems} items</p>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-transparent"></div>
          </AppCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AppCard className="relative overflow-hidden group hover:border-emerald-500/30">
            <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">Estimated Revenue</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-black text-text-primary">₹{dashboardStats.todayRevenue.toLocaleString()}</h2>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 bg-app-success/15 text-app-success">
                ↑ 14%
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-medium mt-1 truncate">Today's Orders: {dashboardStats.todayOrders} logs</p>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-transparent"></div>
          </AppCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AppCard className="relative overflow-hidden group hover:border-amber-500/30">
            <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">Average Rating</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-black text-text-primary">{dashboardStats.avgRating} ★</h2>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 bg-amber-500/15 text-amber-500">
                NPS 74
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-medium mt-1 truncate">Out of 5 stars customer rating</p>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 to-transparent"></div>
          </AppCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AppCard className={`relative overflow-hidden group border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]`}>
            <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">AI Menu Health Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-black text-indigo-400">{dashboardStats.score}%</h2>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 bg-indigo-500/15 text-indigo-400">
                Healthy
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-medium mt-1 truncate">Optimization coefficient</p>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-transparent"></div>
          </AppCard>
        </motion.div>
      </motion.div>

      {/* NAVIGATION TABS SECTION */}
      <div className="flex border-b border-white/5 gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition-colors duration-150 ${
            activeTab === 'studio' ? 'border-indigo-500 text-indigo-400 bg-white/5' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <UtensilsCrossed size={14} />
          Menu Items Studio
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition-colors duration-150 ${
            activeTab === 'matrix' ? 'border-indigo-500 text-indigo-400 bg-white/5' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Layers size={14} />
          AI Engineering Matrix
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition-colors duration-150 ${
            activeTab === 'insights' ? 'border-indigo-500 text-indigo-400 bg-white/5 font-bold' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Sparkles size={14} className="text-indigo-400" />
          AI Insights Panel
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition-colors duration-150 ${
            activeTab === 'categories' ? 'border-indigo-500 text-indigo-400 bg-white/5' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <SlidersHorizontal size={14} />
          Category Analysis
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition-colors duration-150 ${
            activeTab === 'preview' ? 'border-indigo-500 text-indigo-400 bg-white/5' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <ShoppingBag size={14} />
          Live Swiggy Mockup
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: STUDIO (Grid Layout with filters) */}
        {activeTab === 'studio' && (
          <motion.div
            key="studio"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Filters panel */}
            <GlassCard className="p-4 border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-app-elevated border border-app-border rounded-xl text-xs outline-none text-text-primary focus:border-indigo-500/50 placeholder-text-muted"
                  />
                </div>
                {/* Category Filter */}
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    { value: 'Starters', label: 'Starters' },
                    { value: 'Main Course', label: 'Main Course' },
                    { value: 'Biryani', label: 'Biryani' },
                    { value: 'Chinese', label: 'Chinese' },
                    { value: 'South Indian', label: 'South Indian' },
                    { value: 'North Indian', label: 'North Indian' },
                    { value: 'Desserts', label: 'Desserts' },
                    { value: 'Beverages', label: 'Beverages' },
                    { value: 'Combos', label: 'Combos' }
                  ]}
                />
                {/* Veg / Non-Veg */}
                <Select
                  value={vegFilter}
                  onChange={(e) => setVegFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Veg & Non-Veg' },
                    { value: 'veg', label: 'Veg Only' },
                    { value: 'non-veg', label: 'Non-Veg Only' }
                  ]}
                />
                {/* Availability */}
                <Select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Availability' },
                    { value: 'available', label: 'Available Only' },
                    { value: 'unavailable', label: 'Unavailable Only' }
                  ]}
                />
                {/* Sort */}
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'newest', label: 'Sort: Newest' },
                    { value: 'rating', label: 'Sort: Highest Rated' },
                    { value: 'popular', label: 'Sort: Best Selling' },
                    { value: 'price-low', label: 'Sort: Price (Low to High)' },
                    { value: 'price-high', label: 'Sort: Price (High to Low)' }
                  ]}
                />
              </div>

              {/* Price range slider slider */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 pt-4 border-t border-white/5 select-none">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider shrink-0">Max Price: ₹{priceRange}</span>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="10"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full h-1 bg-app-border rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </GlassCard>

            {/* Grid listings */}
            {filteredItems.length === 0 ? (
              <EmptyState
                title="No Menu Items Found"
                description="We couldn't find any dishes matching your query or filter parameters. Try clearing some selections."
              />
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {filteredItems.map(item => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <AppCard className="overflow-hidden relative group hover:border-indigo-500/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                      {/* Image panel */}
                      <div className="h-44 w-full bg-slate-900 border-b border-white/5 relative overflow-hidden">
                        <img 
                          src={item.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80'} 
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Overlays */}
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${item.veg_nonveg === 'veg' ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-400/20' : 'bg-rose-500/25 text-rose-400 border border-rose-400/20'}`}>
                            {item.veg_nonveg}
                          </span>
                          {item.is_bestseller && (
                            <span className="bg-amber-500/25 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5">
                              <Flame size={8} /> Bestseller
                            </span>
                          )}
                          {item.is_chef_special && (
                            <span className="bg-purple-500/25 text-purple-400 border border-purple-400/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                              Chef Special
                            </span>
                          )}
                        </div>
                        {/* Rating Overlay */}
                        <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-lg px-1.5 py-0.5 flex items-center gap-1">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          <span className="text-[10px] text-white font-extrabold">{item.rating_avg.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Content panel */}
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[8px] font-extrabold text-indigo-400 uppercase tracking-widest">{item.category}</span>
                            <h3 className="text-sm font-black text-text-primary mt-0.5">{item.name}</h3>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-text-primary">₹{item.price}</span>
                            {item.discount > 0 && (
                              <p className="text-[9px] text-app-success font-bold mt-0.5">-{item.discount}% Off</p>
                            )}
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-[10px] text-text-muted leading-normal font-semibold line-clamp-2">{item.description}</p>
                        )}

                        {/* Cost structures / Ingredients alerts */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                          <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                            <span className="text-[7px] text-text-muted font-bold uppercase tracking-wider block">Food Cost</span>
                            <span className="text-[10px] text-text-primary font-black mt-0.5">₹{item.cost.toFixed(1)}</span>
                            <span className="text-[8px] text-text-muted font-semibold block">({Math.round(item.food_cost_pct)}%)</span>
                          </div>
                          <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center flex flex-col justify-center items-center">
                            <span className="text-[7px] text-text-muted font-bold uppercase tracking-wider block">Status</span>
                            {item.is_available ? (
                              <Badge status="success" className="mt-1 text-[7px] py-0">Available</Badge>
                            ) : (
                              <Badge status="danger" className="mt-1 text-[7px] py-0">Out of Stock</Badge>
                            )}
                          </div>
                        </div>

                        {/* Ingredient alerts warnings */}
                        {item.has_low_stock && (
                          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl p-2 flex items-center gap-1.5 select-none">
                            <AlertTriangle size={10} className="shrink-0" />
                            <span className="text-[8px] font-bold uppercase tracking-wider leading-none">Warning: Low ingredient stock!</span>
                          </div>
                        )}

                        {/* Micro KPI and tags list */}
                        <div className="flex gap-2 justify-between items-center text-[9px] text-text-muted font-bold uppercase select-none pt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> {item.prep_time}m
                          </span>
                          <span>{item.calories} Kcal</span>
                          <span className="flex items-center gap-0.5">
                            AI Popularity: <span className="text-indigo-400 font-extrabold">{item.popularity_score}%</span>
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                          <SecondaryButton 
                            onClick={() => openEditDrawer(item)}
                            className="py-1 px-2 rounded-xl text-[9px] font-bold flex items-center justify-center gap-1 text-text-secondary border border-white/10 hover:bg-white/5"
                          >
                            <Edit3 size={10} /> Edit
                          </SecondaryButton>
                          <SecondaryButton 
                            onClick={() => openDuplicateDrawer(item)}
                            className="py-1 px-2 rounded-xl text-[9px] font-bold flex items-center justify-center gap-1 text-text-secondary border border-white/10 hover:bg-white/5"
                          >
                            <Copy size={10} /> Copy
                          </SecondaryButton>
                          <SecondaryButton 
                            onClick={() => triggerDelete(item)}
                            className="py-1 px-2 rounded-xl text-[9px] font-bold flex items-center justify-center gap-1 text-app-danger/80 border border-white/10 hover:bg-white/5"
                          >
                            <Trash2 size={10} /> Delete
                          </SecondaryButton>
                        </div>
                      </div>
                    </AppCard>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* TAB 2: AI ENGINEERING MATRIX */}
        {activeTab === 'matrix' && (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Page Header */}
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-lg font-black text-text-primary">Executive Menu Engineering Center</h3>
              <p className="text-xs text-text-muted font-medium mt-0.5">
                Quadrant matrix analyzing profit contribution margins vs sales volumes. Ideal for menu pricing and ingredient costing decisions.
              </p>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard 
                title="Average Margin" 
                value={`₹${data?.matrix?.avg_profit?.toFixed(2) || '5.20'}`} 
                description="Threshold for Puzzle/Star separation" 
              />
              <KPICard 
                title="Star Bestseller" 
                value={data?.matrix?.stars?.[0]?.name || 'Cheese Pizza'} 
                description="Highest popularity & high profit item" 
              />
              <KPICard 
                title="Underperforming (Dogs)" 
                value={`${data?.matrix?.dogs?.length || '0'} Items`} 
                description="Low margin and low volume candidates" 
              />
              <KPICard 
                title="Menu Health Index" 
                value={`${data?.ai_menu_score || '85'}%`} 
                description="AI-computed margin health index" 
              />
            </div>

            {/* Filters Bar */}
            <GlassCard className="p-4 border-white/5 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-wider">Category</label>
                  <select 
                    value={matrixCategoryFilter}
                    onChange={(e) => setMatrixCategoryFilter(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg py-1 px-3.5 text-xs text-white outline-none font-bold"
                  >
                    <option value="all">All Categories</option>
                    <option value="starters">Starters</option>
                    <option value="main course">Main Course</option>
                    <option value="desserts">Desserts</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-wider">Veg / Non-Veg</label>
                  <select 
                    value={matrixVegFilter}
                    onChange={(e) => setMatrixVegFilter(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg py-1 px-3.5 text-xs text-white outline-none font-bold"
                  >
                    <option value="all">All Types</option>
                    <option value="veg">Veg Only</option>
                    <option value="non-veg">Non-Veg Only</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-wider">Date Roster</label>
                  <select 
                    value={matrixDateFilter}
                    onChange={(e) => setMatrixDateFilter(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg py-1 px-3.5 text-xs text-white outline-none font-bold"
                  >
                    <option value="all">Yearly (All-time)</option>
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-wider">Branch</label>
                  <select 
                    value={matrixBranchFilter}
                    onChange={(e) => setMatrixBranchFilter(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg py-1 px-3.5 text-xs text-white outline-none font-bold"
                  >
                    <option value="all">All Branches</option>
                    <option value="main">HQ Main Branch</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMatrixCategoryFilter('all');
                    setMatrixVegFilter('all');
                    setMatrixDateFilter('all');
                    setMatrixBranchFilter('all');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-text-muted hover:text-white hover:bg-white/5 transition"
                >
                  Reset filters
                </button>
              </div>
            </GlassCard>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Interactive Scatter Plot */}
              <div className="lg:col-span-2 space-y-6">
                <GlassCard className="p-6 border-white/5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Interactive Power BI Scatter Chart</span>
                    <div className="flex gap-4 text-[9px] font-extrabold uppercase tracking-widest">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Stars</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Puzzles</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Plow Horses</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Dogs</span>
                    </div>
                  </div>

                  <div className="relative w-full h-[400px] bg-slate-100 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-inner p-4">
                    {/* 4 Quadrants Background Grid */}
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[1px] bg-slate-200 dark:bg-white/10">
                      {/* Top-Left: Puzzles */}
                      <div className="bg-amber-500/5 dark:bg-amber-500/10 p-4 relative flex flex-col justify-between">
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider">🧩 Puzzles</span>
                        <span className="text-[9px] text-amber-500/60 font-semibold">High Margin, Low Volume</span>
                      </div>
                      
                      {/* Top-Right: Stars */}
                      <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 relative flex flex-col justify-between items-end">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider">⭐ Stars</span>
                        <span className="text-[9px] text-emerald-500/60 font-semibold">High Margin, High Volume</span>
                      </div>
                      
                      {/* Bottom-Left: Dogs */}
                      <div className="bg-rose-500/5 dark:bg-rose-500/10 p-4 relative flex flex-col justify-between">
                        <span className="text-[9px] text-rose-500/60 font-semibold">Low Margin, Low Volume</span>
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 text-xs uppercase tracking-wider">🐶 Dogs</span>
                      </div>
                      
                      {/* Bottom-Right: Plow Horses */}
                      <div className="bg-blue-500/5 dark:bg-blue-500/10 p-4 relative flex flex-col justify-between items-end">
                        <span className="text-[9px] text-blue-500/60 font-semibold">Low Margin, High Volume</span>
                        <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider">🐎 Plow Horses</span>
                      </div>
                    </div>

                    {/* Divider Grid Lines */}
                    <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-slate-300 dark:border-white/20 z-0" />
                    <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-300 dark:border-white/20 z-0" />

                    {/* Scatter Points (HTML absolute divs) */}
                    {allMatrixItems.map((item, idx) => {
                      const x = 8 + (item.popularity_score || 50) * 0.84;
                      const y = 92 - (item.profit / maxProfit) * 84;
                      return (
                        <div
                          key={idx}
                          className="absolute w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-lg cursor-pointer transition-all duration-300 hover:scale-150 hover:z-20 group"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            backgroundColor: item.color,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10
                          }}
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDrawerOpen(true);
                            setDrawerMode('edit');
                            if (item.ingredients) {
                              setRecipeIngredients(item.ingredients.map(ri => ({
                                ingredient_id: ri.id,
                                quantity: ri.quantity,
                                name: ri.name,
                                unit: ri.unit
                              })));
                            }
                          }}
                          onMouseEnter={() => setHoveredPoint(item)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          {/* Outer Glow Ring on Hover */}
                          <span 
                            className="absolute -inset-1.5 rounded-full opacity-35 group-hover:block hidden animate-ping"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      );
                    })}

                    {/* Floating Tooltip Popover on Hover */}
                    {hoveredPoint && (
                      <div className="absolute bg-slate-900/95 border border-white/10 p-3 rounded-xl shadow-2xl z-50 text-[10px] space-y-1.5 w-44 backdrop-blur-md" style={{
                        left: `${Math.min(65, 8 + (hoveredPoint.popularity_score || 50) * 0.7)}%`,
                        top: `${Math.min(65, 92 - (hoveredPoint.profit / maxProfit) * 0.75)}%`
                      }}>
                        <div className="flex items-center gap-2 border-b border-white/5 pb-1">
                          <img 
                            src={hoveredPoint.image_url || "/seeder_images/waiter1.jpg"} 
                            alt={hoveredPoint.name} 
                            className="w-6 h-6 rounded-lg object-cover" 
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop"; }}
                          />
                          <span className="font-extrabold text-white block truncate">{hoveredPoint.name}</span>
                        </div>
                        <div className="space-y-0.5 text-text-secondary font-semibold">
                          <span className="block">Category: {hoveredPoint.category_name || 'Main Course'}</span>
                          <span className="block">Type: {hoveredPoint.veg ? 'Veg 🟢' : 'Non-veg 🔴'}</span>
                          <span className="block">Popularity: {hoveredPoint.popularity_score}%</span>
                          <span className="block text-emerald-400">Profit Margin: ₹{hoveredPoint.profit.toFixed(2)}</span>
                          <span className="block text-indigo-400">Price: ₹{hoveredPoint.price}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Right Column: AI Recommendations Panel */}
              <div className="lg:col-span-1 space-y-6">
                <GlassCard className="p-5 border-indigo-500/20 shadow-[0_8px_32px_rgba(99,102,241,0.05)] flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                        <Sparkles size={14} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">AI Recommendations</h4>
                        <span className="text-[9px] text-indigo-400 font-bold">Gusteau's Margin Insights</span>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {/* Recommendation 1: Promote Puzzles */}
                      <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-1">
                        <span className="font-extrabold text-amber-400 text-[10px] block uppercase tracking-wider">⭐ Promote High Margin (Puzzles)</span>
                        <p className="text-[9px] text-text-secondary font-semibold leading-relaxed">
                          Dishes like <strong className="text-white">{data?.matrix?.puzzles?.[0]?.name || 'Truffle Pasta'}</strong> have stellar profit margins but low sales volumes. Feature them in banner ads or suggest tableside waiter upsells.
                        </p>
                      </div>

                      {/* Recommendation 2: Price Adjustment */}
                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-1">
                        <span className="font-extrabold text-emerald-400 text-[10px] block uppercase tracking-wider">📈 Adjust Pricing (Stars)</span>
                        <p className="text-[9px] text-text-secondary font-semibold leading-relaxed">
                          Bestsellers like <strong className="text-white">{data?.matrix?.stars?.[0]?.name || 'Cheese Pizza'}</strong> are extremely popular. Increase prices by 3-5% to capture significant revenue with minimal customer churn impact.
                        </p>
                      </div>

                      {/* Recommendation 3: Cost reduction */}
                      <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl space-y-1">
                        <span className="font-extrabold text-blue-400 text-[10px] block uppercase tracking-wider">✂️ Optimize Costs (Plow Horses)</span>
                        <p className="text-[9px] text-text-secondary font-semibold leading-relaxed">
                          Dishes like <strong className="text-white">{data?.matrix?.plow_horses?.[0]?.name || 'French Fries'}</strong> sell frequently but yield low margins. Renegotiate wholesale supplier costs for their main ingredients.
                        </p>
                      </div>

                      {/* Recommendation 4: Bundle Combo Opportunities */}
                      <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl space-y-1">
                        <span className="font-extrabold text-purple-400 text-[10px] block uppercase tracking-wider">📦 Bundle Combo Pairings</span>
                        <p className="text-[9px] text-text-secondary font-semibold leading-relaxed">
                          Pair high-volume Plow Horses with high-margin Puzzles as a combo meal deal. This clears slow-moving premium items while boosting average ticket size.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5">
                    <button
                      onClick={() => addToast('AI optimization pipeline scheduled.', 'info')}
                      className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition shadow-lg"
                    >
                      Apply Engineering Rules
                    </button>
                  </div>
                </GlassCard>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: AI INSIGHTS PANEL */}
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="border-b border-white/5 pb-2">
              <h3 className="text-md font-black text-text-primary flex items-center gap-1.5">
                <Sparkles size={16} className="text-indigo-400" />
                Gemini AI Analytics Insights
              </h3>
              <p className="text-xs text-text-muted font-medium mt-0.5">
                Real-time recommendations for menu optimization, pricing updates, and recipe adjustments.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {data?.insights?.map((insight, idx) => (
                <GlassCard key={idx} className="p-5 border-white/5 relative overflow-hidden hover:border-indigo-500/25">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          insight.type === 'pricing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          insight.type === 'combo' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          insight.type === 'inventory' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {insight.type}
                        </span>
                        <h4 className="text-xs font-black text-white">{insight.title}</h4>
                      </div>
                      <p className="text-xs font-bold text-indigo-300">{insight.action}</p>
                      <p className="text-[10px] text-text-muted font-semibold max-w-2xl leading-normal">{insight.explanation}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                      <div className="text-right select-none">
                        <span className="text-[7px] text-text-muted font-bold uppercase tracking-wider block">Confidence Score</span>
                        <span className="text-xs font-black text-indigo-400">{insight.confidence_score}%</span>
                      </div>
                      <PrimaryButton onClick={() => applyInsight(insight.action)} className="py-1.5 px-3 text-[10px] rounded-xl">
                        Apply Adjustments
                      </PrimaryButton>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 4: CATEGORY ANALYSIS */}
        {activeTab === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="border-b border-white/5 pb-2">
              <h3 className="text-md font-black text-text-primary">Menu Category Matrices</h3>
              <p className="text-xs text-text-muted font-medium mt-0.5">
                Overview of total dishes, category revenues, popularity averages, and live stocks availability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data?.categories?.map((cat, idx) => (
                <GlassCard key={idx} className="p-5 border-white/5 relative overflow-hidden group hover:border-indigo-500/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-extrabold text-text-muted uppercase tracking-widest">Category</span>
                      <h4 className="text-xs font-black text-white mt-0.5">{cat.name}</h4>
                    </div>
                    {cat.is_available ? (
                      <Badge status="success">Available</Badge>
                    ) : (
                      <Badge status="danger">Low Stock</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 select-none">
                    <div>
                      <span className="text-[7px] text-text-muted font-bold uppercase tracking-wider block">Dishes</span>
                      <span className="text-xs font-black text-white mt-0.5">{cat.count}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-text-muted font-bold uppercase tracking-wider block">Revenue Est.</span>
                      <span className="text-xs font-black text-text-primary mt-0.5">₹{Math.round(cat.revenue)}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-text-muted font-bold uppercase tracking-wider block">Popularity</span>
                      <span className="text-xs font-black text-indigo-400 mt-0.5">{cat.popularity}%</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500/10 group-hover:bg-indigo-500/30 transition-colors"></div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 5: CUSTOMER PREVIEW PHONE MOCKUP */}
        {activeTab === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex justify-center items-center py-6 w-full"
          >
            {/* Phone mockup container container */}
            <div className="w-[320px] h-[640px] rounded-[40px] border-[8px] border-slate-900 bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col font-sans select-none">
              
              {/* Phone Camera Notch notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-950 ml-6"></div>
              </div>

              {/* Status Header */}
              <div className="h-12 bg-slate-900 flex justify-between items-end px-6 pb-2 text-[10px] text-slate-400 font-bold shrink-0">
                <span>13:00</span>
                <div className="flex gap-1.5 items-center">
                  <span>5G</span>
                  <div className="w-4 h-2 bg-slate-400 rounded-sm"></div>
                </div>
              </div>

              {/* Zomato Header */}
              <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-indigo-600/30">D</div>
                <div>
                  <h4 className="text-[10px] font-black text-white leading-none">DineIn Restaurant</h4>
                  <p className="text-[8px] text-indigo-400 mt-1 font-extrabold flex items-center gap-0.5">
                    <Clock size={8} /> Fast delivery: 15-20 min
                  </p>
                </div>
              </div>

              {/* Scrolling Dishes list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none bg-slate-950">
                {filteredItems.map(item => (
                  <div key={item.id} className="bg-slate-900/60 border border-white/5 rounded-2xl p-3 flex gap-3 relative overflow-hidden">
                    <div className="w-16 h-16 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-white/5">
                      <img 
                        src={item.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=80'} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-black text-white truncate pr-1">{item.name}</h5>
                          <span className="text-[10px] font-black text-indigo-400 shrink-0">₹{item.price}</span>
                        </div>
                        <p className="text-[8px] text-slate-400 leading-normal line-clamp-2 mt-1">{item.description || 'Tasty operational choice.'}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[8px] text-amber-500 font-extrabold flex items-center gap-0.5">
                          <Star size={8} className="fill-amber-500" /> {item.rating_avg.toFixed(1)}
                        </span>
                        
                        {/* Interactive Add to Cart button */}
                        {item.is_available ? (
                          <div className="flex items-center gap-1.5">
                            {customerCart[item.id] > 0 && (
                              <>
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-4 h-4 rounded-full bg-slate-800 border border-white/10 text-white font-extrabold flex items-center justify-center text-[9px] hover:bg-slate-700"
                                >
                                  -
                                </button>
                                <span className="text-[9px] font-black text-white">{customerCart[item.id]}</span>
                              </>
                            )}
                            <button
                              onClick={() => addToCart(item.id, item.name)}
                              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-black text-[9px] rounded-lg shadow-md shadow-indigo-600/20"
                            >
                              ADD
                            </button>
                          </div>
                        ) : (
                          <span className="text-[8px] text-rose-400 font-black uppercase">Out of Stock</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout mockup Footer */}
              {Object.keys(customerCart).length > 0 && (
                <div className="p-3 bg-slate-900 border-t border-white/10 flex justify-between items-center absolute bottom-0 left-0 right-0 z-20">
                  <div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Cart Total</p>
                    <h5 className="text-[11px] font-black text-white">
                      ₹{Object.keys(customerCart).reduce((sum, id) => {
                        const it = data?.items?.find(x => x.id === id);
                        return sum + (it ? it.price * customerCart[id] : 0);
                      }, 0)}
                    </h5>
                  </div>
                  <button 
                    onClick={() => {
                      setCustomerCart({});
                      addToast('Mock order placed successfully!', 'success');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-xl flex items-center gap-1 shadow-lg shadow-emerald-600/20"
                  >
                    View Cart <ChevronRight size={10} />
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 11. ADD / EDIT MENU DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drawerMode === 'add' ? 'Add Menu Item' : drawerMode === 'duplicate' ? 'Duplicate Menu Item' : 'Edit Menu Item'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Dish Name"
            name="name"
            value={formFields.name}
            onChange={handleInputChange}
            placeholder="e.g. Chicken Tikka Masala"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Selling Price (₹)"
              name="price"
              type="number"
              step="0.01"
              value={formFields.price}
              onChange={handleInputChange}
              placeholder="299"
              required
            />
            <Input
              label="Discount (%)"
              name="discount"
              type="number"
              step="0.01"
              value={formFields.discount}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </div>

          <Select
            label="Category"
            name="category"
            value={formFields.category}
            onChange={handleInputChange}
            options={[
              { value: 'Starters', label: 'Starters' },
              { value: 'Main Course', label: 'Main Course' },
              { value: 'Biryani', label: 'Biryani' },
              { value: 'Chinese', label: 'Chinese' },
              { value: 'South Indian', label: 'South Indian' },
              { value: 'North Indian', label: 'North Indian' },
              { value: 'Desserts', label: 'Desserts' },
              { value: 'Beverages', label: 'Beverages' },
              { value: 'Combos', label: 'Combos' }
            ]}
          />

          {/* Image Upload section */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Food Image</label>
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <UtensilsCrossed size={18} className="text-text-muted" />
                )}
              </div>
              <SecondaryButton 
                onClick={triggerImageUpload}
                disabled={isUploading}
                className="py-1.5 px-3 text-xs font-bold border border-white/10"
              >
                {isUploading ? 'Optimizing...' : 'Upload Image'}
              </SecondaryButton>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 select-none">
            <Select
              label="Type"
              name="veg_nonveg"
              value={formFields.veg_nonveg}
              onChange={handleInputChange}
              options={[
                { value: 'veg', label: 'Vegetarian' },
                { value: 'non-veg', label: 'Non-Vegetarian' }
              ]}
            />
            <Select
              label="Spice Level"
              name="spice_level"
              value={formFields.spice_level}
              onChange={handleInputChange}
              options={[
                { value: 'mild', label: 'Mild' },
                { value: 'medium', label: 'Medium' },
                { value: 'spicy', label: 'Spicy' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prep Time (Minutes)"
              name="prep_time"
              type="number"
              value={formFields.prep_time}
              onChange={handleInputChange}
            />
            <Input
              label="Calories (Kcal)"
              name="calories"
              type="number"
              value={formFields.calories}
              onChange={handleInputChange}
            />
          </div>

          <textarea
            name="description"
            value={formFields.description}
            onChange={handleInputChange}
            placeholder="Enter a premium description detailing spice notes, garnish ingredients, and serving tips..."
            className="w-full px-3 py-2 bg-app-elevated border border-app-border rounded-xl text-xs outline-none text-text-primary focus:border-indigo-500 h-20 resize-none"
          />

          {/* Toggle Switches */}
          <div className="grid grid-cols-2 gap-4 pt-2 select-none">
            <Switch
              label="Active Status"
              checked={formFields.is_active}
              onChange={(e) => setFormFields(prev => ({ ...prev, is_active: e.target.checked }))}
            />
            <Switch
              label="Bestseller"
              checked={formFields.is_bestseller}
              onChange={(e) => setFormFields(prev => ({ ...prev, is_bestseller: e.target.checked }))}
            />
            <Switch
              label="Chef Special"
              checked={formFields.is_chef_special}
              onChange={(e) => setFormFields(prev => ({ ...prev, is_chef_special: e.target.checked }))}
            />
            <Switch
              label="Featured Page"
              checked={formFields.is_featured}
              onChange={(e) => setFormFields(prev => ({ ...prev, is_featured: e.target.checked }))}
            />
          </div>

          {/* Recipe configuration section */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <div className="flex justify-between items-center select-none">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Recipe Cost Analysis</span>
              <span className="text-[10px] text-indigo-400 font-extrabold">
                Recipe Cost: ₹{recipeIngredients.reduce((sum, ri) => {
                  const ingObj = ingredients.find(i => i.id === ri.ingredient_id);
                  const price = ingObj ? parseFloat(ingObj.total_stock > 0 ? '1.5' : '2.0') : 2.0; // simulated price calculation
                  return sum + (ri.quantity * price);
                }, 0).toFixed(1)}
              </span>
            </div>

            {/* Ingredients listings */}
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {recipeIngredients.map(ri => (
                <div key={ri.ingredient_id} className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs text-white">{ri.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-text-muted">{ri.quantity} {ri.unit}</span>
                    <button 
                      type="button" 
                      onClick={() => removeRecipeIngredient(ri.ingredient_id)}
                      className="text-app-danger hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add ingredient controls */}
            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-2">
                <Select
                  value={selectedIngredientToAdd}
                  onChange={(e) => setSelectedIngredientToAdd(e.target.value)}
                  options={[
                    { value: '', label: 'Select Ingredient' },
                    ...ingredients.map(i => ({ value: i.id, label: i.name }))
                  ]}
                />
              </div>
              <Input
                type="number"
                placeholder="Qty"
                value={ingredientQuantityToAdd}
                onChange={(e) => setIngredientQuantityToAdd(e.target.value)}
              />
            </div>
            <SecondaryButton 
              type="button" 
              onClick={addRecipeIngredient}
              className="w-full py-2 text-xs font-bold border border-white/10"
            >
              Add Ingredient to Recipe
            </SecondaryButton>
          </div>

          <div className="pt-4 flex gap-2">
            <SecondaryButton onClick={() => setIsDrawerOpen(false)} className="w-1/2 py-3 rounded-xl">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="w-1/2 py-3 rounded-xl font-bold">
              Save Changes
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Purge Menu Item"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-normal">
            Are you absolutely sure you want to permanently delete **{itemToDelete?.name}**? This action will purge its recipes and associations, and cannot be undone.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <SecondaryButton onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-xl text-xs">
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={confirmDelete} className="bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 rounded-xl text-xs font-bold">
              Purge Item
            </PrimaryButton>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default MenuStudio;
