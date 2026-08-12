import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Mic, 
  MicOff, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Camera, 
  QrCode, 
  Settings, 
  Bell, 
  Activity, 
  Database, 
  History, 
  Bookmark, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock, 
  Cpu, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  DollarSign, 
  BookOpen, 
  ChevronRight,
  Maximize,
  Layout,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';
import Character from '../assets/character.png';

const FloatingAIOrb = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  // Workspace configuration state
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem('gusteau_v4_open') === 'true');
  const [isMinimized, setIsMinimized] = useState(false);
  const [windowMode, setWindowMode] = useState('side'); // 'side' (docked right), 'floating' (centered modal), 'fullscreen'
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'workflows', 'insights', 'alerts'
  const [query, setQuery] = useState('');
  
  // Resizing panel states & handlers
  const [panelWidth, setPanelWidth] = useState(480);
  const isResizing = useRef(false);

  const startResizing = (e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 320 && newWidth < 900) {
      setPanelWidth(newWidth);
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  };

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleGlobalShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, []);

  // Voice & Input states
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [mascotMood, setMascotMood] = useState('idle'); // 'idle', 'thinking', 'celebrating', 'warning', 'pointing'
  const [unreadCount, setUnreadCount] = useState(1);

  // File/Image upload mock states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Persistent Chat Logs
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('gusteau_v4_logs');
      return saved ? JSON.parse(saved) : [
        {
          role: 'assistant',
          agent: 'Gusteau v4 OS',
          text: "Bonjour! I am Gusteau, your Enterprise AI Operating System. I am fully context-aware of your HQ Main Branch. Select a quick command or upload a barcode/invoice to orchestrate workflows.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        }
      ];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('gusteau_v4_logs', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('gusteau_v4_open', isOpen);
  }, [isOpen]);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, thinkingSteps]);

  // Escape key event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Context awareness indicators based on current route
  const erpContext = (() => {
    const path = location.pathname;
    if (path.includes('/reservations')) {
      return { module: 'Reservations Desk', agent: 'Reservation Agent 📅', load: '14 Active Bookings' };
    }
    if (path.includes('/kds')) {
      return { module: 'Kitchen Display', agent: 'Kitchen Agent 🍳', load: '6 Active Tickets' };
    }
    if (path.includes('/pos')) {
      return { module: 'POS Billing', agent: 'POS Agent 💳', load: '₹42,850 Gross Daily' };
    }
    if (path.includes('/inventory')) {
      return { module: 'Inventory Stocks', agent: 'Inventory Agent 📦', load: '12 Low Stock Items' };
    }
    if (path.includes('/staff')) {
      return { module: 'HR & Workforce', agent: 'Workforce Agent 👥', load: '12 Staff Active' };
    }
    return { module: 'Operations Dashboard', agent: 'HQ Orchestrator 🧠', load: 'System Synced' };
  })();

  // Multi-step agentic execution targeting real backend
  const executeAgenticWorkflow = async (cmdText, confirmedAction = null) => {
    const cleanCmd = cmdText.trim();
    if (!cleanCmd) return;

    if (!confirmedAction) {
      setMessages(prev => [...prev, {
        role: 'user',
        text: cleanCmd,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      }]);
    }

    setQuery('');
    setIsTyping(true);
    setMascotMood('thinking');
    setThinkingSteps(["Gusteau: Analyzing query...", "Gusteau: Resolving active branch..."]);

    try {
      const activeBranchId = localStorage.getItem('selected_branch') || localStorage.getItem('branch_id');
      const payload = {
        message: cleanCmd,
        history: messages.map(m => ({
          role: m.role,
          text: m.text,
          reply: m.reply || m.text,
        })),
        active_branch_id: activeBranchId,
        context: {
          current_path: location.pathname,
          confirmed_action: confirmedAction
        }
      };

      const response = await client.post('/feedback/copilot/chat/', payload);
      const resData = response.data?.data || response.data;
      
      const { intent, action, reply, navigate: navPath, widget, thinking_steps, requires_confirmation, parameters } = resData;

      if (thinking_steps && thinking_steps.length > 0) {
        for (let i = 0; i < thinking_steps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setThinkingSteps(prev => [...prev, thinking_steps[i]]);
        }
      }

      setThinkingSteps([]);
      setIsTyping(false);
      
      if (requires_confirmation) {
        setMascotMood('warning');
      } else if (action === 'delete') {
        setMascotMood('warning');
      } else {
        setMascotMood('celebrating');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        agent: `Gusteau [${intent || 'HQ Orchestrator'}]`,
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: widget ? 'widget' : 'text',
        widget: widget,
        requires_confirmation: requires_confirmation,
        original_command: cleanCmd,
        parameters: parameters,
        intent: intent,
        action: action
      }]);

      setUnreadCount(0);

      if (navPath && !requires_confirmation) {
        addToast(`Orchestrating layout split...`, 'success');
        navigate(navPath);
      }

      setTimeout(() => setMascotMood('idle'), 2000);

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMascotMood('warning');
      const errMessage = err.response?.data?.message || err.message || "Execution pipeline timeout.";
      setMessages(prev => [...prev, {
        role: 'assistant',
        agent: 'Gusteau [System]',
        text: `Error processing request: ${errMessage}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      }]);
      setTimeout(() => setMascotMood('idle'), 1500);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    executeAgenticWorkflow(query);
  };

  // Mock upload handlers
  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsUploading(true);
      addToast(`Uploading file: ${file.name}`, 'info');
      
      setTimeout(() => {
        setIsUploading(false);
        addToast(`File ${file.name} uploaded successfully!`, 'success');
        setSelectedFile(null);
        
        // Execute automatic extraction workflow based on file type/name
        if (file.name.toLowerCase().includes('invoice')) {
          executeAgenticWorkflow("Refund invoice 1045");
        } else if (file.name.toLowerCase().includes('qr') || file.name.toLowerCase().includes('barcode')) {
          executeAgenticWorkflow("Open KDS delayed alerts");
        } else {
          executeAgenticWorkflow("Tomatoes low stock warning");
        }
      }, 2000);
    }
  };

  const handleVoiceToggle = () => {
    setIsListening(prev => !prev);
    if (!isListening) {
      addToast("Gusteau V4 speech recognition active...", "info");
      setTimeout(() => {
        setIsListening(false);
        executeAgenticWorkflow("Refund invoice 1045");
      }, 2500);
    }
  };

  const renderRichWidget = (widget) => {
    if (!widget || !widget.type) return null;
    const { type, data } = widget;
    
    switch (type) {
      case 'reservation':
        return (
          <div className="p-3 bg-slate-900/85 border border-white/10 rounded-xl text-[10px] space-y-1.5 font-bold shadow-lg">
            <span className="text-indigo-400 block font-black text-[11px] uppercase tracking-wider">📅 RESERVATION CONFIRMED</span>
            <div className="grid grid-cols-2 gap-1 text-slate-350">
              <div>Guest: <span className="text-white">{data?.guest_name ?? 'Walk-in'}</span></div>
              <div>Phone: <span className="text-white">{data?.guest_phone ?? 'N/A'}</span></div>
              <div>Party: <span className="text-white">{data?.party_size ?? 2} Pax</span></div>
              <div>Table: <span className="text-white">{data?.table_number ?? 'T-4'}</span></div>
            </div>
            <div>Time slot: <span className="text-indigo-300 font-bold">{data?.start_time ? new Date(data.start_time).toLocaleString() : 'N/A'}</span></div>
            <div className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md inline-block">WhatsApp Notification Sent</div>
          </div>
        );
      case 'refund':
        return (
          <div className="p-3 bg-slate-900/85 border border-white/10 rounded-xl text-[10px] space-y-1.5 font-bold shadow-lg">
            <span className="text-rose-400 block font-black text-[11px] uppercase tracking-wider">↩️ TRANSACTION REFUNDED</span>
            <div className="space-y-1 text-slate-350">
              <div>Invoice check: <span className="text-white font-extrabold">{data?.invoice_id ?? 'N/A'}</span></div>
              <div>Reversed amount: <span className="text-emerald-400 font-extrabold">{data?.amount ?? '₹0'}</span></div>
              {data?.loyalty_deducted && <div>Loyalty points: <span className="text-amber-400">-{data.loyalty_deducted} pts</span></div>}
            </div>
            <div className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md inline-block">Stock quantities restored</div>
          </div>
        );
      case 'inventory':
        return (
          <div className="p-3 bg-slate-900/85 border border-white/10 rounded-xl text-[10px] space-y-1.5 font-bold shadow-lg">
            <span className="text-amber-400 block font-black text-[11px] uppercase tracking-wider">📦 STOCK STATUS REPORT</span>
            <div className="space-y-1 text-slate-350">
              <div>Ingredient: <span className="text-white">{data?.ingredient_name ?? data?.item ?? 'N/A'}</span></div>
              <div>Current Level: <span className="text-white font-extrabold">{data?.stock ?? data?.quantity ?? '0 kg'}</span></div>
            </div>
            <div className={`text-[8px] px-2 py-0.5 rounded-md inline-block font-black uppercase ${
              data?.severity === 'Critical' ? 'bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
            }`}>
              Risk: {data?.severity ?? 'Warning'}
            </div>
          </div>
        );
      case 'payroll':
      case 'attendance':
        return (
          <div className="p-3 bg-slate-900/85 border border-white/10 rounded-xl text-[10px] space-y-1.5 font-bold shadow-lg">
            <span className="text-emerald-400 block font-black text-[11px] uppercase tracking-wider">👥 STAFF & ATTENDANCE ROSTER</span>
            <div className="space-y-1 text-slate-350">
              {data?.net && <div>Net Payroll: <span className="text-white font-extrabold">{data.net}</span></div>}
              {data?.active_staff_count && <div>Present Staff: <span className="text-white font-extrabold">{data.active_staff_count} Active</span></div>}
            </div>
            <div className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md inline-block">Ledger State Locked</div>
          </div>
        );
      default:
        return (
          <div className="p-3 bg-slate-900/85 border border-white/10 rounded-xl text-[9px] text-slate-300 font-bold">
            <pre className="whitespace-pre-wrap">{JSON.stringify(data ?? {}, null, 2)}</pre>
          </div>
        );
    }
  };

  // Window size classes mapping based on windowMode
  const getWindowClasses = () => {
    if (isMinimized) return 'hidden';
    switch (windowMode) {
      case 'fullscreen':
        return 'fixed inset-0 w-screen h-screen rounded-none z-[9999]';
      case 'floating':
        return 'w-[90vw] sm:w-[680px] lg:w-[880px] h-[640px] rounded-[32px] mb-4';
      case 'side':
      default:
        return 'h-[680px] rounded-[32px] mb-4';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            style={windowMode === 'side' ? { width: `${panelWidth}px` } : {}}
            className={`${getWindowClasses()} bg-slate-950/90 backdrop-blur-3xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden relative select-none text-slate-100`}
          >
            {/* Resizable Drag Handle */}
            {windowMode === 'side' && (
              <div 
                className="absolute top-0 left-0 w-1.5 h-full cursor-ew-resize hover:bg-indigo-500/30 transition-colors z-[100]"
                onMouseDown={startResizing}
              />
            )}
            {/* BACKGROUND GRADIENT DECORATION */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* HEADER COMPONENT */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 shrink-0 z-10">
              <div className="flex items-center gap-3">
                {/* Embedded dynamic mascot in header */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/20 flex items-center justify-center p-1 relative overflow-hidden shadow-md shadow-[0_0_12px_rgba(99,102,241,0.25)] transition duration-300 hover:scale-105 cursor-pointer shrink-0">
                  <img src={Character} alt="Mascot Avatar" className="w-full h-full object-contain rounded-full" />
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950 animate-ping" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight flex items-center gap-2">
                    Gusteau V4
                    <span className="text-[7px] bg-indigo-500/20 text-indigo-400 py-0.5 px-2 rounded-full border border-indigo-500/10 uppercase tracking-widest font-black">AI OPERATING SYSTEM</span>
                  </h3>
                  <p className="text-[9px] text-text-muted font-bold flex items-center gap-1.5">
                    <Activity size={10} className="text-emerald-400" />
                    Restaurant Health: 94% | Branch: HQ Main
                  </p>
                </div>
              </div>

              {/* Window Layout Controllers */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWindowMode(windowMode === 'side' ? 'floating' : 'side')}
                  className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-white/5 transition"
                  title="Toggle layout split width"
                >
                  <Layout size={13} />
                </button>
                <button
                  onClick={() => setWindowMode(windowMode === 'fullscreen' ? 'side' : 'fullscreen')}
                  className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-white/5 transition"
                  title="Toggle fullscreen workspace"
                >
                  <Maximize size={13} />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-white/5 transition"
                  title="Minimize"
                >
                  <Minus size={13} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-white/5 transition"
                  title="Close Workspace"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* SPLIT COCKPIT PANEL LAYOUT */}
            <div className="flex-1 flex divide-x divide-white/5 min-h-0 relative z-10">
              
              {/* Left Panel: Streaming, Thinking & Chat Log */}
              <div className="flex-1 flex flex-col justify-between p-4 min-h-0 relative">
                
                {/* Horizontal navigation tabs */}
                <div className="flex gap-1.5 border-b border-white/5 pb-2 mb-3 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                  {[
                    { id: 'chat', label: '💬 Chat workspace' },
                    { id: 'workflows', label: '⚡ Agent Actions' },
                    { id: 'insights', label: '📊 Insights Desk' },
                    { id: 'alerts', label: '🔔 Low Stock Alerts' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                          : 'bg-white/5 text-slate-350 hover:bg-white/10'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-1.5 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                  {activeTab === 'chat' && (
                    <div className="space-y-4 pb-2">
                      {messages.map((msg, idx) => {
                        if (!msg) return null;
                        return (
                          <div key={idx} className={`flex items-start gap-2 ${msg.role === 'user' ? 'max-w-[85%] ml-auto flex-row-reverse' : 'w-full'}`}>
                          <div className={`w-10 h-10 rounded-full border border-white/20 flex items-center justify-center overflow-hidden shrink-0 mt-1 shadow-md transition duration-300 hover:scale-105 ${
                            msg.role === 'user' ? 'bg-slate-900' : 'bg-slate-900 shadow-[0_0_12px_rgba(99,102,241,0.25)] animate-pulse'
                          }`}>
                            <img 
                              src={msg.role === 'user' ? '/seeder_images/waiter1.jpg' : Character} 
                              alt="Avatar" 
                              className="w-full h-full object-cover rounded-full" 
                              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop"; }}
                            />
                          </div>
                          
                          {msg.role === 'user' ? (
                            <div className="space-y-0.5 max-w-[85%]">
                              <span className="text-[7px] text-text-muted font-black uppercase tracking-widest block pl-1">
                                Logged In Staff
                              </span>
                              <div className="p-3 bg-indigo-600 text-white font-bold rounded-2xl rounded-br-none text-[11px] leading-relaxed">
                                <p className="whitespace-pre-line">{msg.text}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 space-y-0.5 min-w-0">
                              <span className="text-[7px] text-indigo-400 font-black uppercase tracking-widest block pl-1">
                                {msg.agent || 'Gusteau HQ'}
                              </span>
                              
                              <div className="w-full bg-slate-950/80 border border-indigo-500/25 rounded-2xl overflow-hidden font-mono shadow-2xl">
                                {/* Header Bar */}
                                <div className="px-3 py-1.5 bg-indigo-950/45 border-b border-indigo-500/20 flex justify-between items-center text-[8px] sm:text-[9px]">
                                  <span className="text-indigo-400 font-extrabold tracking-wider">🖥️ GUSTEAU AI OPERATING SYSTEM v5.0</span>
                                  <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[7px] font-black uppercase">
                                    INTENT: {msg.intent ? msg.intent.toUpperCase() : 'UNKNOWN'} ({Math.round((msg.confidence || 0.98) * 100)}%)
                                  </span>
                                </div>

                                <div className="p-3.5 space-y-3.5 text-[10px]">
                                  {/* Thoughts Section */}
                                  {msg.thinking_steps && msg.thinking_steps.length > 0 && (
                                    <div className="space-y-1">
                                      <span className="text-indigo-300 font-extrabold text-[8px] uppercase tracking-widest block opacity-75">💭 System Thoughts</span>
                                      <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl space-y-1">
                                        {msg.thinking_steps.map((step, sIdx) => (
                                          <div key={sIdx} className="flex items-center gap-1.5 text-slate-350 text-[9px] font-bold">
                                            <span className="text-emerald-400">✓</span>
                                            <span>{step}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Agents Working & Collaboration Section */}
                                  {msg.tasks && msg.tasks.length > 0 && (
                                    <div className="space-y-1">
                                      <span className="text-indigo-300 font-extrabold text-[8px] uppercase tracking-widest block opacity-75">👥 Agent Collaboration Workspace</span>
                                      <div className="grid grid-cols-2 gap-1.5 p-2 bg-white/5 border border-white/5 rounded-xl text-[9px]">
                                        <div className="flex items-center justify-between px-2 py-0.5 bg-slate-900 rounded border border-white/5 font-extrabold">
                                          <span className="text-indigo-400">Reservation Agent</span>
                                          <span className="text-emerald-400 font-black">✓</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2 py-0.5 bg-slate-900 rounded border border-white/5 font-extrabold">
                                          <span className="text-indigo-400 font-extrabold">POS Billing Agent</span>
                                          <span className="text-emerald-400 font-black">✓</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2 py-0.5 bg-slate-900 rounded border border-white/5 font-extrabold">
                                          <span className="text-indigo-400 font-extrabold">Kitchen Agent</span>
                                          <span className="text-emerald-400 font-black">✓</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2 py-0.5 bg-slate-900 rounded border border-white/5 font-extrabold">
                                          <span className="text-indigo-400 font-extrabold">Notification Agent</span>
                                          <span className="text-emerald-400 font-black">✓</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Chain Execution Timeline Section */}
                                  {msg.tasks && msg.tasks.length > 0 && (
                                    <div className="space-y-1">
                                      <span className="text-indigo-300 font-extrabold text-[8px] uppercase tracking-widest block opacity-75">⏱️ Chain Execution Timeline</span>
                                      <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                                        {msg.tasks.map((task, tIdx) => (
                                          <div key={tIdx} className="flex items-start gap-2 text-[9px]">
                                            <span className="text-emerald-500 font-bold">✔</span>
                                            <div className="flex-1 leading-normal font-bold">
                                              <span className="text-slate-350">{task.name}</span>
                                              <span className="text-slate-500 mx-1">•</span>
                                              <span className="text-slate-200">{task.detail}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Workspace Memory Context Section */}
                                  <div className="space-y-1">
                                    <span className="text-indigo-300 font-extrabold text-[8px] uppercase tracking-widest block opacity-75">💾 Local Context Memory</span>
                                    <div className="grid grid-cols-3 gap-1.5 text-[8px] font-bold text-slate-400">
                                      <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-center">
                                        <span className="block text-[6px] text-slate-500 uppercase tracking-widest">Active Branch</span>
                                        <span className="text-slate-300 truncate block mt-0.5">HQ Main Branch</span>
                                      </div>
                                      <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-center">
                                        <span className="block text-[6px] text-slate-500 uppercase tracking-widest">Shift Context</span>
                                        <span className="text-slate-300 truncate block mt-0.5">Morning Shift</span>
                                      </div>
                                      <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-center">
                                        <span className="block text-[6px] text-slate-500 uppercase tracking-widest">Telemetry</span>
                                        <span className="text-slate-300 truncate block mt-0.5">Health: 94%</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Final Response Section */}
                                  <div className="space-y-1 pt-1.5 border-t border-white/5">
                                    <span className="text-indigo-300 font-extrabold text-[8px] uppercase tracking-widest block opacity-75">💬 Final Response</span>
                                    <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-slate-200 text-[10px] leading-relaxed">
                                      <p className="whitespace-pre-wrap">{msg.text}</p>
                                      
                                      {/* Embedded Rich Widgets */}
                                      {msg.type === 'widget' && msg.widget && (
                                        <div className="mt-2.5">
                                          {renderRichWidget(msg.widget)}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Destructive Confirmations */}
                                  {msg.requires_confirmation && (
                                    <div className="mt-2.5 pt-2 border-t border-white/5 space-y-2">
                                      <p className="text-amber-400 font-extrabold text-[9px] uppercase tracking-wider">⚠️ Confirmation Required</p>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            executeAgenticWorkflow(msg.original_command, { 
                                              confirmed: true, 
                                              parameters: msg.parameters, 
                                              action: msg.action, 
                                              intent: msg.intent 
                                            });
                                            msg.requires_confirmation = false;
                                          }}
                                          className="flex-1 py-1.5 px-2.5 bg-red-650 hover:bg-red-550 text-white rounded-lg text-[9px] font-black uppercase transition cursor-pointer"
                                        >
                                          Confirm Action
                                        </button>
                                        <button
                                          onClick={() => {
                                            setMessages(prev => [...prev, {
                                              role: 'assistant',
                                              agent: 'Gusteau [System]',
                                              text: 'Operation aborted.',
                                              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                              type: 'text'
                                            }]);
                                            msg.requires_confirmation = false;
                                          }}
                                          className="py-1.5 px-2.5 bg-white/10 hover:bg-white/15 text-slate-350 rounded-lg text-[9px] font-black uppercase transition cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );})}

                      {/* Welcome Banner Screen */}
                      {messages.length <= 1 && (
                        <div className="p-4 bg-gradient-to-br from-indigo-950/20 to-slate-950 border border-indigo-500/10 rounded-2xl flex flex-col items-center text-center space-y-3 my-2 shadow-2xl">
                          <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center p-2 bg-slate-900 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-105 transition duration-300">
                            <img src={Character} alt="Welcome Mascot" className="w-full h-full object-contain rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-white font-extrabold text-[12px] tracking-tight">Gusteau Enterprise AI OS</h4>
                            <p className="text-[9px] text-slate-400 font-semibold max-w-[200px] leading-relaxed">
                              Ready to coordinate Reservations, POS billing, Staff schedules, and Inventory monitors.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Step-by-Step Thinking visual indicator with 64x64 avatar */}
                      {isTyping && (
                        <div className="flex items-start gap-3 pl-2 py-2 mr-auto bg-indigo-950/20 border border-indigo-500/10 rounded-2xl p-3 max-w-[90%] shadow-[0_0_12px_rgba(99,102,241,0.1)]">
                          <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 flex items-center justify-center p-1 bg-slate-950 animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.6)] shrink-0">
                            <img src={Character} alt="Thinking Mascot" className="w-full h-full object-contain rounded-full" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <span className="text-[7px] text-indigo-400 font-extrabold uppercase tracking-widest block">Gusteau [Thinking Engine]</span>
                            {thinkingSteps.length > 0 ? (
                              <div className="space-y-0.5">
                                {thinkingSteps.map((step, sIdx) => (
                                  <div key={sIdx} className="flex items-center gap-2 text-[9px] font-semibold text-slate-350 leading-tight">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping shrink-0" />
                                    <span className="truncate">{step}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-100" />
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-200" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>
                  )}

                  {activeTab === 'workflows' && (
                    <div className="space-y-4 pb-2">
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-wider block">Agentic operations triggers</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Create Reservation', cmd: 'Create reservation tomorrow at Table 4 for 4 guests' },
                          { label: 'Refund Invoice #1045', cmd: 'Refund invoice 1045' },
                          { label: 'Low Stock Tomatoes', cmd: 'Tomatoes low stock warning' },
                          { label: 'Verify Delayed Tickets', cmd: 'Open kitchen queue delays alert' },
                          { label: 'Show Payroll Summary', cmd: 'Show payroll summary' },
                          { label: 'Operations Analytics', cmd: 'Show sales today payment breakdown' }
                        ].map((w, idx) => (
                          <button
                            key={idx}
                            onClick={() => executeAgenticWorkflow(w.cmd)}
                            className="p-3 bg-white/5 hover:bg-indigo-600 border border-white/5 hover:border-indigo-500 rounded-xl font-bold text-left text-[10px] text-white transition duration-150"
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'insights' && (
                    <div className="space-y-3 pb-2 text-[10px] font-semibold text-slate-350">
                      <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl space-y-1">
                        <span className="font-black text-indigo-400 uppercase tracking-widest text-[9px] block">Yield Optimization Suggestion</span>
                        <p className="leading-relaxed">Cheese Pizza continues to represent high profit index margins. Suggest increasing base catalog price by 5%.</p>
                      </div>
                      <div className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl space-y-1">
                        <span className="font-black text-rose-400 uppercase tracking-widest text-[9px] block">Burnout warning alert</span>
                        <p className="leading-relaxed">Line cook Vikram has logged high overtime index scores this morning. Roster adjustments recommended.</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'alerts' && (
                    <div className="space-y-2 pb-2">
                      {[
                        { title: 'Tomatoes Stock Warning', desc: 'Current tomatoes count at 12 kg (Threshold: 30 kg).', style: 'border-red-500/25 bg-red-500/5 text-red-300' },
                        { title: 'Delayed Cooking Alert', desc: 'Grill order #3142 active check exceeds safety limit.', style: 'border-amber-500/25 bg-amber-500/5 text-amber-300' }
                      ].map((n, idx) => (
                        <div key={idx} className={`p-3 border rounded-xl space-y-0.5 text-[10px] font-bold ${n.style}`}>
                          <span className="block font-black text-white">{n.title}</span>
                          <p className="opacity-80 font-semibold">{n.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload status indicator */}
                {isUploading && (
                  <div className="px-3 py-1 bg-indigo-600/20 text-indigo-400 text-[9px] font-bold rounded-lg mb-2 animate-pulse">
                    Orchestrating file upload checks...
                  </div>
                )}

                {/* Command Pinned Input area */}
                <div className="pt-3 border-t border-white/5 shrink-0 bg-transparent">
                  <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*,application/pdf"
                    />
                    <button
                      type="button"
                      onClick={triggerFileUpload}
                      className="p-2 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition"
                      title="Upload PDF, Excel or Invoice"
                    >
                      <Paperclip size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={handleVoiceToggle}
                      className={`p-2 rounded-xl border transition-all ${
                        isListening 
                          ? 'bg-rose-600 border-rose-500 text-white animate-pulse' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                      }`}
                      title="Microphone voice input"
                    >
                      <Mic size={13} />
                    </button>

                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={isListening ? "Listening..." : "Orchestrate Gusteau commands..."}
                      disabled={isListening}
                      className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white outline-none placeholder-slate-500 font-bold text-xs"
                    />
                    
                    <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer">
                      <Send size={13} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Panel: Context Awareness Telemetry (Hidden on side width mode) */}
              {windowMode !== 'side' && (
                <div className="w-[30%] p-4 space-y-4 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 lg:flex flex-col hidden">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Database size={13} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Live telemetry</span>
                  </div>

                  <div className="space-y-3 font-semibold text-[10px] text-slate-350">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-text-muted font-bold block uppercase tracking-wider">ERP module context</span>
                      <span className="text-white font-extrabold">{erpContext.module}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[8px] text-text-muted font-bold block uppercase tracking-wider">Active agent</span>
                      <span className="text-indigo-400 font-extrabold">{erpContext.agent}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[8px] text-text-muted font-bold block uppercase tracking-wider">Telemetry load</span>
                      <span className="text-white font-extrabold">{erpContext.load}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[8px] text-text-muted font-bold block uppercase tracking-wider">Active Branch</span>
                      <span className="text-white font-extrabold">HQ Main Branch</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[8px] text-text-muted font-bold block uppercase tracking-wider">Mascot mood state</span>
                      <span className="text-emerald-400 font-extrabold capitalize">{mascotMood}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl space-y-1 text-[9px] font-bold text-slate-350">
                    <span className="text-indigo-400 font-black block uppercase tracking-wider">Predictive alert</span>
                    <p className="leading-normal">Table 4 occupancy expires soon. Waiter dispatch prepared.</p>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1 text-[9px] font-bold text-slate-350">
                    <span className="text-white font-black block uppercase tracking-wider">Recent command history</span>
                    <div className="space-y-1">
                      {["Verify delayed tickets", "Tomatoes low stock", "Refund invoice 1045"].map((h, hIdx) => (
                        <div key={hIdx} className="text-slate-400 truncate">
                          • {h}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING 3D MASCOT CHARACTER (Integrated transparent chef mascot character widget) */}
      {(!isOpen || isMinimized) && (
        <motion.div
          className="relative cursor-pointer select-none z-50 flex flex-col items-center group mascot-trigger-btn"
          initial={{ x: 30, y: 10 }}
          whileHover={{ x: 5, y: -2 }}
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
        >
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 right-8 w-5 h-5 bg-indigo-600 border border-white/20 text-white rounded-full flex items-center justify-center text-[9px] font-black animate-bounce shadow-lg">
              {unreadCount}
            </span>
          )}

          {/* Transparent Pixar Mascot with breathing keyframes */}
          <motion.div
            animate={
              mascotMood === 'idle' ? { y: [0, -4, 0] } :
              mascotMood === 'thinking' ? { rotate: [0, 6, -6, 0], scale: 1.05 } :
              mascotMood === 'celebrating' ? { scale: [1, 1.1, 1], rotate: [0, 360, 0] } :
              { y: [0, -6, 0], rotate: 8 }
            }
            transition={{
              repeat: mascotMood === 'idle' ? Infinity : 0,
              duration: mascotMood === 'idle' ? 3.0 : 1,
              ease: "easeInOut"
            }}
            className="w-12 h-12 rounded-full border border-white/20 shadow-[0_0_12px_rgba(99,102,241,0.25)] hover:scale-110 transition-transform duration-300 flex items-center justify-center p-1 bg-slate-900 drop-shadow-lg cursor-pointer"
          >
            <img 
              src={Character} 
              alt="Gusteau Chef Mascot" 
              className="w-full h-full object-contain rounded-full" 
            />
          </motion.div>
        </motion.div>
      )}

      {/* Minimized toggle bar */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/10 hover:bg-indigo-500 hover:scale-105 transition-transform text-[10px] font-black uppercase tracking-wider mb-2 cursor-pointer"
        >
          Maximize Assistant Workspace
        </button>
      )}

    </div>
  );
};

export default FloatingAIOrb;
