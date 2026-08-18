import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CreditCard, 
  UtensilsCrossed, 
  Boxes, 
  Users as CustomersIcon,
  User as UserIcon, 
  MessageSquare,
  LineChart, 
  FileSpreadsheet, 
  Building2, 
  Settings,
  Sun, 
  Moon, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  ChevronDown,
  Clock,
  Sparkles
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useBranch } from '../contexts/BranchContext';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';
import FloatingAIOrb from '../components/FloatingAIOrb';
import FluidGradientBackground from '../components/FluidGradientBackground';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { branches, currentBranch, selectBranch } = useBranch();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const mainContentRef = useRef(null);

  const resetScrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  };

  // Instant Route Change Scroll-to-Top Reset on Body/Document
  useLayoutEffect(() => {
    resetScrollToTop();
  }, [location.pathname, location.search]);

  // Mobile sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sidebar Search State
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');

  // Recently Visited State
  const [recentlyVisited, setRecentlyVisited] = useState(() => {
    try {
      const saved = localStorage.getItem('dinein_recently_visited');
      return saved ? JSON.parse(saved) : [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Menu Studio (studio)', path: '/dashboard/menu?tab=studio' },
        { label: 'Reservations (walkins)', path: '/dashboard/reservations?tab=walkins' },
        { label: 'Customers', path: '/dashboard/customers' }
      ];
    } catch (e) {
      return [];
    }
  });

  // Quick Branch Switcher State
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [switcherSearch, setSwitcherSearch] = useState('');
  const branchBtnRef = useRef(null);
  const branchDropdownRef = useRef(null);
  const [branchCoords, setBranchCoords] = useState({ top: 0, left: 0 });

  // Global Header ERP Quick Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Header In-App Notifications State
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Dynamic Theme state ('light' or 'dark')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Dynamic Theme Sync Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await logout();
    addToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  // Fetch In-App Notifications
  const fetchHeaderNotifications = async () => {
    try {
      const res = await client.get('/communication/notifications/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.data || []);
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load header notifications:', err);
    }
  };

  useEffect(() => {
    fetchHeaderNotifications();
  }, []);

  const [restaurantName, setRestaurantName] = useState(
    localStorage.getItem('restaurant_name') || 'DineIn AI'
  );

  useEffect(() => {
    const handleUpdate = () => {
      setRestaurantName(localStorage.getItem('restaurant_name') || 'DineIn AI');
    };
    window.addEventListener('restaurantNameUpdate', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('restaurantNameUpdate', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const markAllRead = async () => {
    try {
      await client.post('/communication/notifications/mark-all-read/');
    } catch (err) {
      try {
        await client.post('/communication/notifications/read-all/');
      } catch (e) {
        console.error(e);
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, status: 'read' })));
    addToast('All notifications marked read.', 'info');
  };

  const handleNotificationClick = async (n) => {
    try {
      await client.post(`/communication/notifications/${n.id}/read/`);
    } catch (err) {
      console.error(err);
    }
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true, status: 'read' } : item));
    setNotifDropdownOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read && n.status !== 'read').length;

  // Filter Branches for Switcher Dropdown
  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(switcherSearch.toLowerCase()) ||
    b.branch_code.toLowerCase().includes(switcherSearch.toLowerCase())
  );

  // Dynamic Position & Event Listeners for Branch Switcher Dropdown
  const handleToggleBranchSwitcher = (e) => {
    e.stopPropagation();
    if (branchBtnRef.current) {
      const rect = branchBtnRef.current.getBoundingClientRect();
      setBranchCoords({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 340))
      });
    }
    setIsSwitcherOpen(prev => !prev);
  };

  useEffect(() => {
    if (!isSwitcherOpen) return;

    const handleClickOutside = (e) => {
      if (
        branchBtnRef.current && !branchBtnRef.current.contains(e.target) &&
        branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)
      ) {
        setIsSwitcherOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSwitcherOpen(false);
      }
    };

    const handleReposition = () => {
      if (branchBtnRef.current) {
        const rect = branchBtnRef.current.getBoundingClientRect();
        setBranchCoords({
          top: rect.bottom + 8,
          left: Math.max(16, Math.min(rect.left, window.innerWidth - 340))
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isSwitcherOpen]);

  // EXACT TOP-LEVEL NAVIGATION MODULES (13 Core Modules)
  const menuGroups = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['admin', 'owner', 'manager', 'receptionist', 'inventory_manager', 'kitchen_staff', 'customer']
    },
    {
      id: 'reservations',
      label: 'Reservations',
      icon: CalendarDays,
      roles: ['admin', 'owner', 'manager', 'receptionist'],
      subItems: [
        { label: 'Overview', path: '/dashboard/reservations?tab=list' },
        { label: 'Calendar', path: '/dashboard/reservations?tab=timeline' },
        { label: 'Floor Layout', path: '/dashboard/reservations?tab=floor' },
        { label: 'Waitlist', path: '/dashboard/reservations?tab=waitlist' },
        { label: 'Walk-ins', path: '/dashboard/reservations?tab=walkins' },
        { label: 'Reservation Analytics', path: '/dashboard/reservations?tab=analytics' }
      ]
    },
    {
      id: 'pos',
      label: 'POS',
      icon: CreditCard,
      roles: ['admin', 'owner', 'manager', 'receptionist'],
      subItems: [
        { label: 'Orders', path: '/dashboard/pos?tab=orders' },
        { label: 'Billing', path: '/dashboard/pos?tab=menu' },
        { label: 'Payments', path: '/dashboard/pos?tab=history' },
        { label: 'Discounts', path: '/dashboard/pos?tab=discounts' },
        { label: 'Refunds', path: '/dashboard/pos?tab=refunds' },
        { label: 'Today\'s Sales', path: '/dashboard/pos?tab=today-sales' }
      ]
    },
    {
      id: 'menu',
      label: 'Menu Studio',
      icon: UtensilsCrossed,
      roles: ['admin', 'owner', 'manager', 'receptionist'],
      subItems: [
        { label: 'Manage Menu', path: '/dashboard/menu?tab=studio' },
        { label: 'Engineering Matrix', path: '/dashboard/menu?tab=matrix' },
        { label: 'AI Suggestion Insights', path: '/dashboard/menu?tab=insights' },
        { label: 'Categories Layout', path: '/dashboard/menu?tab=categories' },
        { label: 'Customer Preview', path: '/dashboard/menu?tab=preview' }
      ]
    },
    {
      id: 'kitchen',
      label: 'Kitchen',
      icon: UtensilsCrossed,
      roles: ['admin', 'owner', 'manager', 'kitchen_staff', 'receptionist'],
      subItems: [
        { label: 'Live Orders', path: '/dashboard/kds?tab=live' },
        { label: 'Queue', path: '/dashboard/kds?tab=queue' },
        { label: 'Preparation Status', path: '/dashboard/kds?tab=prep' },
        { label: 'Chef Performance', path: '/dashboard/kds?tab=chefs' },
        { label: 'Delays', path: '/dashboard/kds?tab=delays' }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      roles: ['admin', 'owner', 'manager', 'inventory_manager'],
      subItems: [
        { label: 'Dashboard', path: '/dashboard/inventory?tab=dashboard' },
        { label: 'Stock', path: '/dashboard/inventory?tab=stock' },
        { label: 'Ingredients', path: '/dashboard/inventory?tab=ingredients' },
        { label: 'Vendors', path: '/dashboard/inventory?tab=suppliers' },
        { label: 'Purchases', path: '/dashboard/inventory?tab=purchases' },
        { label: 'Consumption', path: '/dashboard/inventory?tab=consumption' },
        { label: 'Waste Tracking', path: '/dashboard/inventory?tab=wastage' },
        { label: 'Alerts', path: '/dashboard/inventory?tab=alerts' },
        { label: 'Forecasting', path: '/dashboard/inventory?tab=forecasting' }
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: CustomersIcon,
      path: '/dashboard/customers',
      roles: ['admin', 'owner', 'manager', 'receptionist']
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: UserIcon,
      roles: ['admin', 'owner', 'manager'],
      subItems: [
        { label: 'AI Analytics & Health', path: '/dashboard/staff?tab=directory' },
        { label: 'Employees', path: '/dashboard/staff?tab=directory' },
        { label: 'Departments', path: '/dashboard/staff?tab=directory' },
        { label: 'Designations', path: '/dashboard/staff?tab=directory' },
        { label: 'Managers', path: '/dashboard/staff?tab=directory' },
        { label: 'Attendance', path: '/dashboard/staff?tab=attendance' },
        { label: 'Shift Planner', path: '/dashboard/staff?tab=roster' },
        { label: 'Payroll', path: '/dashboard/staff?tab=payroll' },
        { label: 'Leave', path: '/dashboard/staff?tab=attendance' },
        { label: 'Performance', path: '/dashboard/staff?tab=performance' },
        { label: 'Compliance', path: '/dashboard/staff?tab=performance' }
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: MessageSquare,
      path: '/dashboard/communication',
      roles: ['admin', 'owner', 'manager']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: LineChart,
      roles: ['admin', 'owner', 'manager'],
      subItems: [
        { label: 'Executive Dashboard', path: '/dashboard/analytics?tab=ceo' },
        { label: 'Sales', path: '/dashboard/analytics?tab=sales' },
        { label: 'Customers', path: '/dashboard/analytics?tab=customers' },
        { label: 'Staff', path: '/dashboard/analytics?tab=employees' },
        { label: 'Inventory', path: '/dashboard/analytics?tab=inventory' },
        { label: 'Reservations', path: '/dashboard/analytics?tab=reservations' },
        { label: 'Kitchen', path: '/dashboard/analytics?tab=kitchen' },
        { label: 'Finance', path: '/dashboard/analytics?tab=finance' },
        { label: 'AI Insights', path: '/dashboard/analytics?tab=ai-insights' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileSpreadsheet,
      path: '/dashboard/reports',
      roles: ['admin', 'owner', 'manager']
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: Building2,
      path: '/dashboard/branches',
      roles: ['admin', 'owner']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/dashboard/settings',
      roles: ['admin', 'owner']
    }
  ];

  const userRole = user?.role || 'customer';
  const visibleGroups = menuGroups.filter(g => g.roles.includes(userRole));

  // Automatically track Recently Visited pages
  useEffect(() => {
    let matchedLabel = '';
    const currentFullPath = location.pathname + location.search;

    for (const group of visibleGroups) {
      if (group.path && group.path === currentFullPath) {
        matchedLabel = group.label;
        break;
      }
      if (group.subItems) {
        for (const sub of group.subItems) {
          const subClean = sub.path.split('?')[0];
          if (subClean === location.pathname) {
            const currentTab = new URLSearchParams(location.search).get('tab');
            const subTab = sub.path.includes('?tab=') ? new URLSearchParams(sub.path.split('?')[1]).get('tab') : null;
            if (currentTab && subTab && currentTab === subTab) {
              matchedLabel = `${group.label} (${currentTab})`;
              break;
            } else if (!currentTab && !subTab) {
              matchedLabel = group.label;
              break;
            }
          }
        }
      }
      if (matchedLabel) break;
    }

    if (!matchedLabel) {
      const parts = location.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const rawName = parts[parts.length - 1];
        const tab = new URLSearchParams(location.search).get('tab');
        matchedLabel = tab ? `${rawName} (${tab})` : rawName;
      }
    }

    if (matchedLabel) {
      setRecentlyVisited(prev => {
        const filtered = prev.filter(item => item.path !== currentFullPath && item.label !== matchedLabel);
        const updated = [{ label: matchedLabel, path: currentFullPath }, ...filtered].slice(0, 5);
        localStorage.setItem('dinein_recently_visited', JSON.stringify(updated));
        return updated;
      });
    }
  }, [location.pathname, location.search]);

  // Filter modules based on search query
  const filteredGroups = visibleGroups.map(group => {
    const q = moduleSearchQuery.toLowerCase().trim();
    if (!q) return group;

    const groupMatch = group.label.toLowerCase().includes(q);
    const matchingSubItems = group.subItems?.filter(sub => sub.label.toLowerCase().includes(q)) || [];

    if (groupMatch) {
      return group;
    } else if (matchingSubItems.length > 0) {
      return { ...group, subItems: matchingSubItems };
    }
    return null;
  }).filter(Boolean);

  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('sidebar_collapsed') === 'true');
  const [expandedGroups, setExpandedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_expanded_groups');
      return saved ? JSON.parse(saved) : { staff: true };
    } catch (e) {
      return { staff: true };
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      localStorage.setItem('sidebar_collapsed', !prev);
      return !prev;
    });
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const isCurrentlyOpen = prev[groupId];
      const nextState = isCurrentlyOpen ? {} : { [groupId]: true };
      localStorage.setItem('sidebar_expanded_groups', JSON.stringify(nextState));
      return nextState;
    });
  };

  let pageTitle = 'Dashboard';
  visibleGroups.forEach(group => {
    if (group.path === location.pathname) {
      pageTitle = group.label;
    }
    if (group.subItems) {
      group.subItems.forEach(sub => {
        if (sub.path.split('?')[0] === location.pathname) {
          pageTitle = group.label;
        }
      });
    }
  });

  const activeSubTab = new URLSearchParams(location.search).get('tab');

  const sidebarWidth = isCollapsed ? 72 : 256;

  return (
    <div className="live-animated-bg text-[var(--color-text-secondary)] min-h-screen font-sans transition-colors duration-300 relative">
      
      {/* 4K Liquid Fluid Gradient Video-like Motion Background */}
      <FluidGradientBackground />

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-fade-in" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* 1. FIXED SIDEBAR PANEL (position: fixed, left: 0, top: 0, bottom: 0, height: 100vh) */}
      <aside 
        style={{ width: `${sidebarWidth}px` }}
        className={`glass-card-surface fixed top-0 bottom-0 left-0 z-40 h-screen flex flex-col justify-between transition-all duration-300 border-r border-[var(--color-border)] rounded-none overflow-hidden ${
          sidebarOpen ? 'translate-x-0 flex' : 'hidden md:flex'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden w-full">
          {/* Logo Header - Pinned at Top */}
          <div className="h-20 px-4 flex items-center justify-between border-b border-[var(--color-border)] shrink-0 w-full">
            <Link to="/dashboard" onClick={resetScrollToTop} className="flex items-center gap-3 overflow-hidden group">
              <div className="w-11 h-11 rounded-[16px] bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg relative shrink-0 transition-transform duration-300 group-hover:scale-105">
                <div className="absolute inset-0 rounded-[16px] bg-gradient-to-tr from-indigo-600 to-pink-500 blur-md opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none" />
                <span className="text-white font-black text-lg tracking-wider relative z-10 font-sans">D</span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-sm tracking-[0.08em] text-[var(--color-text-primary)] uppercase whitespace-nowrap">
                    DineIn <span className="text-[var(--color-primary)] font-black">AI</span>
                  </span>
                  <span className="text-[8px] font-extrabold text-[var(--color-primary)]/80 uppercase tracking-[0.16em] leading-none mt-0.5 whitespace-nowrap">
                    Hospitality OS
                  </span>
                </div>
              )}
            </Link>
            
            <button 
              onClick={toggleCollapse} 
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hidden md:flex items-center justify-center p-1.5 rounded-full hover:bg-[var(--color-hover)] transition-colors"
            >
              {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>

            <button className="text-[var(--color-text-muted)] md:hidden hover:text-[var(--color-text-primary)]" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items - Scrollable Middle Area inside Sidebar only */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none w-full min-w-0">
            
            {/* SEARCH MODULES INPUT */}
            {!isCollapsed && (
              <div className="relative mb-2 w-full">
                <Search size={14} className="text-[var(--color-text-muted)] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={moduleSearchQuery}
                  onChange={(e) => setModuleSearchQuery(e.target.value)}
                  className="w-full bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-full pl-9 pr-3 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all duration-200 shadow-sm"
                />
              </div>
            )}

            {/* RECENTLY VISITED SECTION */}
            {!isCollapsed && !moduleSearchQuery && recentlyVisited.length > 0 && (
              <div className="mb-3 p-2.5 bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] rounded-2xl space-y-1 w-full overflow-hidden">
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-[var(--color-text-muted)] uppercase tracking-wider px-1">
                  <Clock size={11} className="text-[var(--color-primary)] shrink-0" />
                  <span className="truncate">Recently Visited</span>
                </div>
                <div className="space-y-0.5 w-full">
                  {recentlyVisited.map((item, rIdx) => (
                    <Link
                      key={rIdx}
                      to={item.path}
                      onClick={resetScrollToTop}
                      className="block px-2.5 py-1 rounded-xl text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition-all truncate capitalize w-full"
                    >
                      • {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* FULL MODULE NAVIGATION (13 Core Modules) */}
            {filteredGroups.map((group) => {
              const GroupIcon = group.icon;
              const hasSubItems = group.subItems && group.subItems.length > 0;
              const isGroupExpanded = expandedGroups[group.id] || Boolean(moduleSearchQuery);
              const isDirectActive = group.path && location.pathname === group.path;
              const isChildActive = hasSubItems && group.subItems.some(sub => sub.path.split('?')[0] === location.pathname);
              const isActive = isDirectActive || isChildActive;

              return (
                <div key={group.id} className="space-y-1 w-full">
                  {hasSubItems ? (
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-purple)]/15 to-transparent text-[var(--color-text-primary)] border border-[var(--color-primary)]/30 glow-edge-cyan' 
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <GroupIcon size={16} className={`shrink-0 ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                        {!isCollapsed && (
                          <span className="truncate flex items-center gap-1.5">
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse shrink-0" />}
                            <span className="truncate">{group.label}</span>
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown 
                          size={12} 
                          className={`transition-transform duration-200 text-[var(--color-text-muted)] shrink-0 ${isGroupExpanded ? 'rotate-180' : ''}`} 
                        />
                      )}
                    </button>
                  ) : (
                    <Link
                      to={group.path}
                      onClick={() => {
                        setSidebarOpen(false);
                        resetScrollToTop();
                      }}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 w-full ${
                        isDirectActive 
                          ? 'bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-purple)]/15 to-transparent text-[var(--color-text-primary)] border border-[var(--color-primary)]/30 glow-edge-cyan' 
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <GroupIcon size={16} className={`shrink-0 ${isDirectActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                      {!isCollapsed && (
                        <span className="truncate flex items-center gap-1.5 min-w-0">
                          {isDirectActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse shrink-0" />}
                          <span className="truncate">{group.label}</span>
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Submenu Accordion */}
                  <AnimatePresence initial={false}>
                    {hasSubItems && isGroupExpanded && !isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden pl-7 pr-2 py-1 space-y-1 border-l border-[var(--color-border)] ml-5"
                      >
                        {group.subItems.map((sub, sIdx) => {
                          const isSubActiveItem = sub.path.split('?')[0] === location.pathname &&
                            (sub.path.includes('?tab=')
                              ? new URLSearchParams(sub.path.split('?')[1]).get('tab') === new URLSearchParams(location.search).get('tab')
                              : true);
                          return (
                            <Link
                              key={sIdx}
                              to={sub.path}
                              onClick={() => {
                                setSidebarOpen(false);
                                resetScrollToTop();
                              }}
                              className={`block py-1.5 px-3 rounded-full text-[11px] font-semibold transition-all truncate w-full ${
                                isSubActiveItem ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 font-extrabold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Profile Footer - Pinned at Bottom */}
          <div className="p-3 border-t border-[var(--color-border)] shrink-0 w-full">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center mb-1' : 'mb-2'}`}>
              <div className="w-9 h-9 rounded-full bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden shrink-0">
                <UserIcon size={16} className="text-[var(--color-text-secondary)]" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold truncate text-[var(--color-text-primary)] leading-tight">{user?.name || 'User'}</p>
                  <span className="text-[9px] font-extrabold uppercase text-[var(--color-primary)] tracking-wider">
                    {user?.role || 'Guest'}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] text-xs font-bold transition-all duration-150"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION AREA (margin-left: sidebar width, width: calc(100% - sidebar width), min-height: 100vh) */}
      <div 
        ref={mainContentRef}
        style={{ 
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`
        }}
        className="min-h-screen flex flex-col relative top-0 transition-all duration-300 min-w-0"
      >
        
        {/* TOP NAVIGATION HEADER - Sticky top 0 inside main application area */}
        <header className="glass-card-surface h-16 flex items-center justify-between px-6 sticky top-0 z-30 border-b border-[var(--color-border)] rounded-none shadow-sm w-full shrink-0 relative">
          
          {/* Centered Restaurant Brand Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden xl:flex items-center gap-2">
            <Sparkles size={13} className="text-[var(--color-primary)] animate-pulse" />
            <h1 className="text-xs font-black uppercase tracking-[0.25em] text-[var(--color-text-primary)]">
              {restaurantName}
            </h1>
            <Sparkles size={13} className="text-[var(--color-primary)] animate-pulse" />
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-full hover:bg-[var(--color-hover)] md:hidden text-[var(--color-text-secondary)]"
            >
              <Menu size={20} />
            </button>
            
            {/* Breadcrumbs */}
            <div className="text-[var(--color-text-muted)] hidden sm:flex items-center gap-1.5 text-xs font-semibold select-none">
              <Link to="/dashboard" onClick={resetScrollToTop} className="hover:text-[var(--color-text-primary)] transition-colors">Dashboard</Link>
              {location.pathname !== '/dashboard' && (
                <>
                  <span className="text-[var(--color-text-muted)]/60 text-[10px]">&gt;</span>
                  <span className="text-[var(--color-text-primary)] font-extrabold">{pageTitle}</span>
                  {activeSubTab && (
                    <>
                      <span className="text-[var(--color-text-muted)]/60 text-[10px]">&gt;</span>
                      <span className="text-[var(--color-primary)] font-extrabold capitalize">{activeSubTab.replace('-', ' ')}</span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Apple Branch Selector Pill Button */}
            {['owner', 'admin', 'manager'].includes(userRole) ? (
              <div>
                <button
                  ref={branchBtnRef}
                  onClick={handleToggleBranchSwitcher}
                  className="bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm transition-all duration-200 flex items-center gap-2 cursor-pointer text-[var(--color-text-primary)]"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]"></span>
                  </span>
                  <span className="text-[10px] font-extrabold text-[var(--color-text-muted)] uppercase tracking-wider">Branch:</span>
                  <span className="font-extrabold text-[11px] text-[var(--color-primary)]">{currentBranch?.name || 'ADAMBAKKAM-CHENNAI'}</span>
                  <ChevronDown size={12} className="text-[var(--color-text-muted)]" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            
            {/* Global Search Capsule */}
            <div className="hidden md:flex items-center relative">
              <Search size={14} className="text-[var(--color-text-muted)] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ERP..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="w-44 focus:w-64 bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-full pl-9 pr-4 py-1.5 text-xs text-[var(--color-text-primary)] outline-none transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              className="w-11 h-11 rounded-full bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/40 hover:scale-105 shadow-sm flex items-center justify-center transition-all duration-200"
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                title="Notifications"
                className="w-11 h-11 rounded-full bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/40 hover:scale-105 shadow-sm flex items-center justify-center transition-all duration-200 relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)] animate-pulse" />
                )}
              </button>

              {notifDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[80]" onClick={() => setNotifDropdownOpen(false)}></div>
                  <div className="glass-card-surface absolute right-0 mt-3 w-88 max-h-[420px] overflow-y-auto border border-[var(--color-border)] rounded-[22px] shadow-2xl p-4 z-[90] animate-fade-in space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[var(--color-text-primary)]">In-App Alerts</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
                          {unreadCount} New
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] font-extrabold text-[var(--color-primary)] hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-[var(--color-text-muted)] text-center py-6">No notifications found.</p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 rounded-2xl border text-xs space-y-1 transition-all cursor-pointer ${
                              n.is_read || n.status === 'read'
                                ? 'bg-[var(--color-bg-surface-elevated)]/50 border-[var(--color-border)]/60 opacity-75 hover:opacity-100'
                                : 'bg-[var(--color-bg-surface-elevated)] border-[var(--color-primary)]/40 shadow-sm hover:border-[var(--color-primary)]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-extrabold text-[var(--color-text-primary)] text-xs">{n.title}</p>
                              {n.priority && (
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                  n.priority === 'high' ? 'bg-rose-500/20 text-rose-400' : n.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {n.priority}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed font-medium">{n.message}</p>
                            {n.link && (
                              <span className="inline-block text-[10px] text-[var(--color-primary)] font-bold hover:underline pt-0.5">
                                View details →
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Button */}
            <button
              onClick={() => navigate('/dashboard/profile')}
              title="User Profile"
              className="w-11 h-11 rounded-full bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/40 hover:scale-105 shadow-sm flex items-center justify-center transition-all duration-200 overflow-hidden"
            >
              <UserIcon size={18} />
            </button>

          </div>
        </header>

        {/* PAGE CONTENT VIEWPORT */}
        <main className="flex-1 p-6 space-y-6 w-full min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Engine Gusteau Copilot Orb */}
      <FloatingAIOrb />

      {/* Portal-based Floating Branch Switcher Dropdown */}
      {isSwitcherOpen && createPortal(
        <div 
          ref={branchDropdownRef}
          style={{ top: `${branchCoords.top}px`, left: `${branchCoords.left}px` }}
          className="fixed w-80 glass-card-surface border border-[var(--color-border)] rounded-[22px] shadow-2xl p-4 z-[9999] animate-fade-in space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Select Active Branch</span>
            <span className="text-[10px] font-extrabold text-[var(--color-primary)]">{filteredBranches.length} Available</span>
          </div>

          {branches.length > 4 && (
            <div className="relative">
              <Search size={12} className="text-[var(--color-text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter branches..."
                value={switcherSearch}
                onChange={(e) => setSwitcherSearch(e.target.value)}
                className="w-full bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-full pl-8 pr-3 py-1 text-xs text-[var(--color-text-primary)] outline-none"
              />
            </div>
          )}

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-none">
            {filteredBranches.map((branch) => {
              const isSelected = currentBranch?.id === branch.id;
              return (
                <button
                  key={branch.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    selectBranch(branch.id);
                    setIsSwitcherOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    isSelected 
                      ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)] shadow-sm' 
                      : 'border-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-[var(--color-text-primary)]">{branch.name}</p>
                    {branch.branch_code && (
                      <span className="text-[9px] text-[var(--color-text-muted)] font-mono uppercase">{branch.branch_code}</span>
                    )}
                  </div>
                  {isSelected && <span className="text-[var(--color-primary)] font-black text-sm">✓</span>}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default DashboardLayout;
