import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranch } from '../contexts/BranchContext';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';
import { 
  Receipt, 
  Printer, 
  Trash2, 
  Plus, 
  Minus, 
  RefreshCw, 
  Layers, 
  AlertTriangle,
  Activity,
  CheckCircle,
  Database,
  ArrowLeft
} from 'lucide-react';
import { 
  AppCard, 
  GlassCard, 
  SectionCard, 
  PrimaryButton, 
  SecondaryButton, 
  Badge, 
  Modal,
  LoadingOverlay,
  Select,
  Input,
  KPICard
} from '../components/DesignSystem';

// Import split modular components
import TableSelector from '../components/pos/TableSelector';
import WaiterSelector from '../components/pos/WaiterSelector';
import CustomerPanel from '../components/pos/CustomerPanel';
import MenuGrid from '../components/pos/MenuGrid';
import Cart from '../components/pos/Cart';
import CheckoutPanel from '../components/pos/CheckoutPanel';
import PaymentPanel from '../components/pos/PaymentPanel';
import InvoicePreview from '../components/pos/InvoicePreview';
import BillHistory from '../components/pos/BillHistory';
import CashDrawer from '../components/pos/CashDrawer';

const POS = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.15 } }
  };

  // Service flow and Seating states
  const [diningMode, setDiningMode] = useState(null); // null, 'table', 'walk_in', 'takeaway', 'delivery'
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedWaiter, setSelectedWaiter] = useState('');
  const [manualWaiterName, setManualWaiterName] = useState('');
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  
  // Datasets loaded from MySQL
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [activeReservations, setActiveReservations] = useState([]);
  const [selectedRes, setSelectedRes] = useState(null);
  const [activeBookingDetails, setActiveBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Customer state hooks
  const [customerName, setCustomerName] = useState('Walk-In Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [partySize, setPartySize] = useState(2);

  // Cart billing list
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [heldTickets, setHeldTickets] = useState([]);

  // Check out settle flow states
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [transactionId, setTransactionId] = useState('');
  const [cardSimulationState, setCardSimulationState] = useState('waiting');
  const [settledInvoice, setSettledInvoice] = useState(null);

  // Split billing states
  const [splitAmounts, setSplitAmounts] = useState({ cash: 0, card: 0, upi: 0, wallet: 0 });
  const [splitPayments, setSplitPayments] = useState([]);
  const [tempSplitMethod, setTempSplitMethod] = useState('cash');
  const [tempSplitAmount, setTempSplitAmount] = useState('');
  const [tempGuestLabel, setTempGuestLabel] = useState('');

  // Daily cash drawer session states
  const [cashDrawerOpen, setCashDrawerOpen] = useState(false);
  const [activeDrawerSession, setActiveDrawerSession] = useState(null);
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState('');
  const [closingBalanceInput, setClosingBalanceInput] = useState('');
  const [drawerNotes, setDrawerNotes] = useState('');
  const [drawerHistory, setDrawerHistory] = useState([]);

  // Customization drawer states
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [customVariant, setCustomVariant] = useState('regular');
  const [customCourse, setCustomCourse] = useState('main_course');
  const [customModifiers, setCustomModifiers] = useState({ extraCheese: false, extraSpice: false, glutenFree: false });
  const [customKitchenNotes, setCustomKitchenNotes] = useState('');
  const [customSpecialInstructions, setCustomSpecialInstructions] = useState('');

  // Table Move / Merge states
  const [showTableOpsModal, setShowTableOpsModal] = useState(false);
  const [tableOpsType, setTableOpsType] = useState('transfer');
  const [targetTransferTable, setTargetTransferTable] = useState('');
  const [mergeSourceTables, setMergeSourceTables] = useState([]);

  // Invoice History states
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'orders', 'history', 'discounts', 'refunds', 'today-sales'

  useEffect(() => {
    if (tabParam) {
      let target = tabParam;
      if (target === 'billing') target = 'menu';
      if (target === 'payments') target = 'history';
      if (target === 'sales') target = 'today-sales';
      
      if (['menu', 'orders', 'history', 'discounts', 'refunds', 'today-sales'].includes(target)) {
        setActiveTab(target);
      }
    }
  }, [tabParam]);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const { currentBranch, selectBranch, availableBranches, loading: branchContextLoading } = useBranch();

  const fetchPOSData = useCallback(async () => {
    if (!currentBranch?.id) return;
    setLoading(true);
    try {
      const activeBranchId = currentBranch.id;
      const [menuRes, resRes, tablesRes, staffRes, invoicesRes, ordersRes] = await Promise.all([
        client.get('/inventory/menu-items/', { params: { branch: activeBranchId } }),
        client.get('/reservation/bookings/', { params: { branch: activeBranchId } }),
        client.get('/reservation/tables/', { params: { branch: activeBranchId } }),
        client.get('/workforce/employees/', { params: { branch: activeBranchId } }),
        client.get('/branches/invoices/', { params: { branch: activeBranchId } }),
        client.get('/inventory/orders/', { params: { branch: activeBranchId } })
      ]);

      const menuData = Array.isArray(menuRes.data) ? menuRes.data : (menuRes.data?.results || menuRes.data?.data || []);
      setMenuItems(menuData);

      const bookingsData = Array.isArray(resRes.data) ? resRes.data : (resRes.data?.results || resRes.data?.data || []);
      const seated = bookingsData.filter(r => r.status === 'seated');
      setActiveReservations(seated);

      const tablesList = Array.isArray(tablesRes.data) ? tablesRes.data : (tablesRes.data?.results || tablesRes.data?.data || []);
      setTables(tablesList);

      const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.results || ordersRes.data?.data || []);
      setOrders(ordersData);

      const staffList = Array.isArray(staffRes.data) ? staffRes.data : (staffRes.data?.results || staffRes.data?.data || []);
      const filteredWaiters = staffList.filter(emp => {
        const desig = (emp.designation_name || '').toLowerCase();
        return desig.includes('waiter') || desig.includes('captain') || desig.includes('server') || desig.includes('host');
      });
      setWaiters(filteredWaiters);

      const invoicesList = Array.isArray(invoicesRes.data) ? invoicesRes.data : (invoicesRes.data?.results || invoicesRes.data?.data || []);
      setInvoiceHistory(invoicesList);

      try {
        const activeDrawerRes = await client.get('/inventory/drawers/active/');
        if (activeDrawerRes.data?.active) {
          setCashDrawerOpen(true);
          setActiveDrawerSession(activeDrawerRes.data);
        } else {
          setCashDrawerOpen(false);
          setActiveDrawerSession(null);
        }
      } catch (drawerErr) {
        console.error(drawerErr);
      }

      try {
        const drawerHistoryRes = await client.get('/inventory/drawers/');
        setDrawerHistory(drawerHistoryRes.data?.results || drawerHistoryRes.data || []);
      } catch (drawerHistoryErr) {
        console.error(drawerHistoryErr);
      }

      const savedHeld = localStorage.getItem(`dinein_held_tickets_${activeBranchId}`);
      if (savedHeld) setHeldTickets(JSON.parse(savedHeld));
    } catch (err) {
      console.error(err);
      addToast('Error synchronizing POS data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentBranch?.id, user, addToast]);

  useEffect(() => {
    fetchPOSData();
    window.addEventListener('branchUpdate', fetchPOSData);
    // Reset selections on branch switch to prevent stale states
    setSelectedTable('');
    setSelectedWaiter('');
    setManualWaiterName('');
    setCart([]);
    setDiningMode(null);
    return () => {
      window.removeEventListener('branchUpdate', fetchPOSData);
    };
  }, [currentBranch?.id, fetchPOSData]);

  // Live order status polling from KDS
  useEffect(() => {
    if (!activeOrder?.id) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await client.get(`/inventory/orders/${activeOrder.id}/`);
        const updatedOrder = res.data?.data || res.data;
        if (updatedOrder && updatedOrder.status !== activeOrder.status) {
          setActiveOrder(updatedOrder);
          addToast(`KOT Order ${activeOrder.id.slice(0, 8).toUpperCase()} status updated to ${updatedOrder.status.toUpperCase()}`, 'info');
          if (['completed', 'cancelled'].includes(updatedOrder.status)) {
            fetchPOSData();
          }
        }
      } catch (err) {
        console.error('Failed to poll order status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeOrder, addToast, fetchPOSData]);

  // Step 2 Table Selection Event Handler
  const handleTableChange = async (tableNum) => {
    setSelectedTable(tableNum);
    setActiveBookingDetails(null);

    if (!tableNum) {
      setSelectedRes(null);
      setCustomerName('Walk-In Customer');
      setCustomerPhone('');
      setCustomerEmail('');
      setPartySize(2);
      setSelectedWaiter('');
      setActiveOrder(null);
      setCart([]);
      return;
    }

    const tableObj = tables.find(t => t.number === tableNum);
    if (!tableObj) return;

    try {
      setLoading(true);
      const res = await client.get(`/reservation/tables/${tableObj.id}/active-booking/`);
      const details = res.data;

      if (details.active) {
        setSelectedRes({ id: details.reservation_id, guest_name: details.guest_name });
        setCustomerName(details.guest_name);
        setCustomerPhone(details.guest_phone);
        setCustomerEmail(details.guest_email || '');
        setPartySize(details.party_size);
        setSelectedWaiter(details.waiter || '');
        setActiveBookingDetails(details);
        addToast(`Active Booking resolved for Table ${tableNum}!`, 'info');
      } else {
        setSelectedRes(null);
        setCustomerName('Walk-In Customer');
        setCustomerPhone('');
        setCustomerEmail('');
        setPartySize(2);
        setSelectedWaiter('');
        addToast(`Table ${tableNum} opened as Walk-in Table Service.`, 'info');
      }

      // Resume active draft order
      const activeOrderObj = orders.find(o => 
        o.table === tableObj.id && 
        ['received', 'preparing', 'ready'].includes(o.status)
      );
      if (activeOrderObj) {
        setActiveOrder(activeOrderObj);
        if (activeOrderObj.waiter) {
          setSelectedWaiter(activeOrderObj.waiter);
        }
        const mappedItems = (activeOrderObj.items || []).map(item => ({
          id: `${item.menu_item}-${item.course}-${(item.modifiers || []).map(m => m.name || m).join(',')}`,
          baseItemId: item.menu_item,
          name: item.menu_item_name || 'Item',
          price: Number(item.unit_price),
          quantity: item.quantity,
          course: item.course,
          modifiers: item.modifiers || [],
          kitchenNotes: item.kitchen_notes || '',
          specialInstructions: item.special_instructions || '',
          itemDiscount: Number(item.item_discount || 0)
        }));
        setCart(mappedItems);
        addToast(`Loaded KOT Order ${activeOrderObj.id.slice(0, 8).toUpperCase()} for Table ${tableNum}`, 'info');
      } else {
        setActiveOrder(null);
        setCart([]);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to resolve active booking detail.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Waiter statistics counts
  const getWaiterStats = (waiterUserId) => {
    const tablesCount = activeReservations.filter(res => res.waiter === waiterUserId).length;
    const activeOrdersCount = orders.filter(o => o.waiter === waiterUserId && !['completed', 'cancelled'].includes(o.status)).length;
    return { tablesCount, activeOrdersCount };
  };

  // Change Assigned Waiter Event Callback
  const handleWaiterChange = async (waiterUserId) => {
    setSelectedWaiter(waiterUserId);
    if (selectedRes) {
      try {
        setLoading(true);
        await client.patch(`/reservation/bookings/${selectedRes.id}/`, { waiter: waiterUserId });
        addToast('Waiter reassigned in reservation database.', 'success');
        fetchPOSData();
      } catch (err) {
        console.error(err);
        addToast('Failed to update waiter in database.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendToKitchen = async () => {
    if (!selectedTable && diningMode === 'table') {
      addToast('Please select a table before sending to kitchen.', 'warning');
      return;
    }
    if (cart.length === 0) {
      addToast('Cannot send an empty order to the kitchen.', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const activeBranchId = localStorage.getItem('branch_id') || user?.branch || '';
      const matchedTableObj = tables.find(t => t.number === selectedTable);
      
      const payload = {
        branch: activeBranchId,
        source: 'direct',
        order_type: selectedRes ? 'dine_in' : 'takeaway',
        reservation: selectedRes?.id || null,
        table: matchedTableObj?.id || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        status: 'received',
        total_amount: subtotal,
        waiter: selectedWaiter || null,
        waiter_name: manualWaiterName || null,
        items: cart.map(item => ({
          menu_item: item.baseItemId || item.id,
          quantity: item.quantity,
          unit_price: item.price,
          kitchen_notes: item.kitchenNotes || '',
          waiter_notes: item.waiterNotes || '',
          special_instructions: item.specialInstructions || '',
          item_discount: item.itemDiscount || 0,
          course: item.course || 'main_course',
          modifiers: item.modifiers || []
        }))
      };

      if (activeOrder) {
        const res = await client.patch(`/inventory/orders/${activeOrder.id}/`, payload);
        const updatedOrder = res.data?.data || res.data;
        setActiveOrder(updatedOrder);
        addToast(`KOT Order ${activeOrder.id.slice(0, 8).toUpperCase()} updated & sent to kitchen!`, 'success');
      } else {
        const res = await client.post('/inventory/orders/', payload);
        const newOrder = res.data?.data || res.data;
        setActiveOrder(newOrder);
        addToast(`New KOT Order created & sent to kitchen!`, 'success');
      }
      fetchPOSData();
      window.dispatchEvent(new Event('branchUpdate'));
    } catch (err) {
      console.error(err);
      addToast('Failed to send order to kitchen.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!activeOrder) {
      setCart([]);
      addToast('Ticket cleared.', 'info');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to cancel KOT Order ${activeOrder.id.slice(0, 8).toUpperCase()}?`)) {
      return;
    }

    setLoading(true);
    try {
      await client.patch(`/inventory/orders/${activeOrder.id}/`, { status: 'cancelled' });
      addToast('Order cancelled successfully.', 'success');
      setCart([]);
      setActiveOrder(null);
      fetchPOSData();
      window.dispatchEvent(new Event('branchUpdate'));
    } catch (err) {
      console.error(err);
      addToast('Failed to cancel order.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPOS = () => {
    setCart([]);
    setSelectedTable('');
    setSelectedWaiter('');
    setManualWaiterName('');
    setCustomerName('Walk-In Customer');
    setCustomerPhone('');
    setCustomerEmail('');
    setActiveOrder(null);
    setSelectedRes(null);
    setActiveBookingDetails(null);
    setDiscount(0);
    setCouponCode('');
    setCouponDiscount(0);
    setShowPaymentModal(false);
    setDiningMode(null);
  };

  const handleHoldBill = () => {
    if (cart.length === 0) {
      addToast('Cannot hold an empty cart.', 'warning');
      return;
    }
    const ticketName = prompt('Enter a name or identifier for this held ticket:', `Ticket ${heldTickets.length + 1}`);
    if (ticketName === null) return;
    
    const activeBranchId = localStorage.getItem('branch_id') || user?.branch || '';
    const newTicket = {
      id: Math.random().toString(),
      name: ticketName || `Ticket ${heldTickets.length + 1}`,
      cart,
      diningMode,
      selectedTable,
      selectedWaiter,
      manualWaiterName,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      activeOrder
    };
    
    const updated = [...heldTickets, newTicket];
    setHeldTickets(updated);
    localStorage.setItem(`dinein_held_tickets_${activeBranchId}`, JSON.stringify(updated));
    
    addToast('Bill placed on hold.', 'success');
    handleResetPOS();
  };

  const handleResumeTicket = (ticket) => {
    setCart(ticket.cart);
    setDiningMode(ticket.diningMode);
    setSelectedTable(ticket.selectedTable);
    setSelectedWaiter(ticket.selectedWaiter);
    setManualWaiterName(ticket.manualWaiterName || '');
    setCustomerName(ticket.customerName);
    setCustomerPhone(ticket.customerPhone);
    setCustomerEmail(ticket.customerEmail);
    setPartySize(ticket.partySize);
    setActiveOrder(ticket.activeOrder);
    
    const activeBranchId = localStorage.getItem('branch_id') || user?.branch || '';
    const updated = heldTickets.filter(t => t.id !== ticket.id);
    setHeldTickets(updated);
    localStorage.setItem(`dinein_held_tickets_${activeBranchId}`, JSON.stringify(updated));
    
    addToast(`Resumed held ticket: ${ticket.name}`, 'success');
  };

  // Cart operations
  const handleItemClick = (item) => {
    setCustomizingItem(item);
    setCustomVariant('regular');
    setCustomCourse('main_course');
    setCustomModifiers({ extraCheese: false, extraSpice: false, glutenFree: false });
    setCustomKitchenNotes('');
    setCustomSpecialInstructions('');
    setShowCustomizeModal(true);
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;
    
    let price = Number(customizingItem.price);
    const modifiersList = [];
    
    if (customVariant === 'large') {
      price += 3.00;
    } else if (customVariant === 'small') {
      price -= 1.50;
    }
    
    if (customModifiers.extraCheese) {
      price += 1.50;
      modifiersList.push({ name: 'Extra Cheese', price: 1.50 });
    }
    if (customModifiers.extraSpice) {
      price += 0.50;
      modifiersList.push({ name: 'Extra Spice', price: 0.50 });
    }
    if (customModifiers.glutenFree) {
      price += 2.00;
      modifiersList.push({ name: 'Gluten Free', price: 2.00 });
    }
    
    const customKey = `${customizingItem.id}-${customVariant}-${customCourse}-${modifiersList.map(m => m.name).join(',')}`;
    
    const cartItem = {
      ...customizingItem,
      id: customKey,
      baseItemId: customizingItem.id,
      price,
      quantity: 1,
      course: customCourse,
      modifiers: modifiersList,
      variantName: customVariant !== 'regular' ? customVariant : '',
      kitchenNotes: customKitchenNotes,
      specialInstructions: customSpecialInstructions
    };
    
    const existing = cart.find(i => i.id === cartItem.id);
    if (existing) {
      setCart(cart.map(i => i.id === cartItem.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, cartItem]);
    }
    
    setShowCustomizeModal(false);
    setCustomizingItem(null);
    setCustomKitchenNotes('');
    setCustomSpecialInstructions('');
    addToast(`Added ${customizingItem.name} to cart!`, 'success');
  };

  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1, course: 'main_course', modifiers: [] }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleDuplicateItem = (item) => {
    const duplicatedItem = {
      ...item,
      id: `${item.baseItemId || item.id}-${Math.random().toString()}`,
      quantity: 1
    };
    setCart([...cart, duplicatedItem]);
    addToast(`Duplicated ${item.name}!`, 'success');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => {
    const itemSub = (item.price * item.quantity) - (item.itemDiscount || 0);
    return sum + Math.max(0, itemSub);
  }, 0);
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const igst = 0;
  const gst = cgst + sgst + igst;
  const serviceCharge = subtotal * 0.10;
  const grandTotal = Math.max(0, subtotal + gst + serviceCharge - discount - couponDiscount);

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      addToast('Cannot settle checkout with empty cart.', 'warning');
      return;
    }
    setPaymentStep(1);
    setSplitAmounts({ cash: grandTotal, card: 0, upi: 0, wallet: 0 });
    setShowPaymentModal(true);
  };

  const handleCheckoutSettle = async (payoutDetails = {}) => {
    setLoading(true);
    try {
      const activeBranchId = localStorage.getItem('branch_id') || user?.branch || '';
      const matchedTableObj = tables.find(t => t.number === selectedTable);
      const generatedTxn = transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

      const checkoutPayload = {
        branch: activeBranchId,
        source: 'direct',
        order_type: selectedRes ? 'dine_in' : 'takeaway',
        reservation: selectedRes?.id || null,
        table: matchedTableObj?.id || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        status: 'received',
        total_amount: subtotal,
        waiter: selectedWaiter || null,
        waiter_name: manualWaiterName || null,
        items: cart.map(item => ({
          menu_item: item.baseItemId || item.id,
          quantity: item.quantity,
          unit_price: item.price,
          kitchen_notes: item.kitchenNotes || '',
          waiter_notes: item.waiterNotes || '',
          special_instructions: item.specialInstructions || '',
          item_discount: item.itemDiscount || 0,
          course: item.course || 'main_course',
          modifiers: item.modifiers || []
        })),
        payment_method: paymentMethod,
        discount: discount,
        coupon_discount: couponDiscount,
        transaction_id: generatedTxn,
        cashier: user?.id || null,
        payment_details: paymentMethod === 'mixed' ? splitAmounts : payoutDetails
      };

      const res = await client.post('/inventory/orders/checkout-settle/', checkoutPayload);
      const resData = res.data?.data || res.data;

      addToast('Checkout settled successfully.', 'success');
      
      setSettledInvoice({
        id: resData.invoice_id,
        order_number: resData.order_id,
        table_number: selectedTable,
        customer_name: customerName,
        total: grandTotal,
        payment_method: paymentMethod,
        transaction_id: generatedTxn
      });

      setPaymentStep(3);
      fetchPOSData();
      window.dispatchEvent(new Event('branchUpdate'));
    } catch (err) {
      console.error('POS checkout failed:', err);
      let errMsg = 'POS checkout settlement failed.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errMsg = err.response.data;
        } else if (typeof err.response.data === 'object') {
          errMsg = Object.entries(err.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
        }
      }
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const response = await client.get(`/branches/invoices/${invoiceId}/pdf/`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Invoice-${invoiceId}.pdf`;
      link.click();
      addToast('PDF Receipt download dispatched.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to download invoice PDF.', 'error');
    }
  };

  const handleEmailInvoice = async (invoiceId) => {
    try {
      setLoading(true);
      await client.post(`/branches/invoices/${invoiceId}/email/`, { email: customerEmail });
      addToast(`Invoice PDF dispatched to ${customerEmail || 'customer\'s email'} successfully!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to email invoice.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTrigger = async (invoiceId) => {
    try {
      const pdfUrl = `${client.defaults.baseURL}/branches/invoices/${invoiceId}/pdf/`;
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
      addToast('Dispatched ReportLab print command.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Browser printing request failed.', 'error');
    }
  };

  const handleRefundInvoice = async (invoiceId) => {
    try {
      setLoading(true);
      const res = await client.post(`/branches/invoices/${invoiceId}/refund/`);
      if (res.data?.success) {
        addToast(res.data.message || 'Invoice successfully refunded.', 'success');
        // Refresh POS data to reload history
        fetchPOSData();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to refund invoice.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvoicePreview = async (invoice) => {
    try {
      setLoading(true);
      if (invoice.order) {
        const orderRes = await client.get(`/inventory/orders/${invoice.order}/`);
        setPreviewInvoice({
          ...invoice,
          order_details: orderRes.data
        });
      } else {
        setPreviewInvoice(invoice);
      }
      setShowPreviewModal(true);
    } catch (err) {
      console.error(err);
      addToast('Failed to resolve invoice preview.', 'error');
      setPreviewInvoice(invoice);
      setShowPreviewModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawerSession = async () => {
    if (!openingBalanceInput || Number(openingBalanceInput) < 0) {
      addToast('Please enter a valid opening cash balance.', 'warning');
      return;
    }
    const activeBranchId = localStorage.getItem('branch_id') || user?.branch || '';

    try {
      setLoading(true);
      await client.post('/inventory/drawers/open/', {
        branch: activeBranchId,
        opening_balance: Number(openingBalanceInput),
        notes: drawerNotes
      });
      addToast('Cash drawer session opened.', 'success');
      setOpeningBalanceInput('');
      setDrawerNotes('');
      setShowDrawerModal(false);
      fetchPOSData();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to open cash drawer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDrawerSession = async () => {
    if (!closingBalanceInput || Number(closingBalanceInput) < 0) {
      addToast('Please enter a valid closing balance.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await client.post('/inventory/drawers/close/', {
        closing_balance: Number(closingBalanceInput),
        notes: drawerNotes
      });
      const data = res.data?.data || res.data;
      addToast(`Session closed! Diff: ₹${data.difference.toFixed(2)} (Expected: ₹${data.expected_balance.toFixed(2)}).`, 'info');
      setClosingBalanceInput('');
      setDrawerNotes('');
      setShowDrawerModal(false);
      fetchPOSData();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to close session.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferTable = async () => {
    if (!selectedTable) {
      addToast('Please select a table to transfer.', 'warning');
      return;
    }
    const fromTableObj = tables.find(t => t.number === selectedTable);
    if (!fromTableObj) return;

    if (!targetTransferTable) {
      addToast('Please select a target table.', 'warning');
      return;
    }

    try {
      setLoading(true);
      await client.post(`/reservation/tables/${fromTableObj.id}/transfer/`, { to_table: targetTransferTable });
      addToast(`Table transferred to Table ${targetTransferTable}.`, 'success');
      setShowTableOpsModal(false);
      setTargetTransferTable('');
      fetchPOSData();
    } catch (err) {
      console.error(err);
      addToast('Failed to transfer table.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeTables = async () => {
    if (!selectedTable) {
      addToast('Please select table to merge into.', 'warning');
      return;
    }
    const targetTableObj = tables.find(t => t.number === selectedTable);
    if (!targetTableObj) return;

    if (mergeSourceTables.length === 0) {
      addToast('Please choose source tables to merge.', 'warning');
      return;
    }

    try {
      setLoading(true);
      await client.post(`/reservation/tables/${targetTableObj.id}/merge/`, { tables: mergeSourceTables });
      addToast(`Tables merged into Table ${selectedTable}.`, 'success');
      setShowTableOpsModal(false);
      setMergeSourceTables([]);
      fetchPOSData();
    } catch (err) {
      console.error(err);
      addToast('Failed to merge tables.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (branchContextLoading || !currentBranch) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-text-secondary">
        <div className="w-10 h-10 border-4 border-app-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider animate-pulse">Initializing Branch Context...</span>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 min-h-[85vh] text-text-secondary"
    >

      {/* POS Header Controls */}
      <GlassCard className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-app-primary/10">
        <div className="flex items-center gap-3">
          {diningMode && (
            <button 
              onClick={() => {
                if (window.confirm('Clear active cart and return to service selector?')) {
                  handleResetPOS();
                }
              }}
              className="p-1.5 rounded-full bg-app-elevated hover:bg-app-border/40 transition text-text-secondary"
              title="Return to modes"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="text-lg font-black text-text-primary flex items-center gap-2">
              <Receipt className="text-app-primary" />
              POS Terminal
            </h1>
            <p className="text-[9px] text-text-muted mt-0.5 uppercase tracking-wider font-extrabold">
              Service: {diningMode ? diningMode.replace('_', ' ') : 'None'} {selectedTable ? `| Table: ${selectedTable}` : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(user?.is_superuser || !user?.branch) && availableBranches.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[10px] text-text-muted font-extrabold uppercase tracking-wider">Branch:</span>
              <select
                value={currentBranch?.id || ''}
                onChange={(e) => selectBranch(e.target.value)}
                className="bg-app-elevated border border-app-border/40 rounded px-2 py-1 text-xs font-bold text-text-primary focus:outline-none focus:border-app-primary/60 transition"
              >
                {availableBranches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <SecondaryButton 
            onClick={() => setShowDrawerModal(true)}
            className="text-xs font-bold px-3 py-2 border-app-success/30 text-text-secondary flex items-center gap-1.5"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${cashDrawerOpen ? 'bg-app-success animate-pulse' : 'bg-app-danger'}`} />
            Cash Drawer
          </SecondaryButton>
          <div className="flex gap-1 bg-app-surface border border-app-border rounded-lg p-1">
            {[
              { id: 'menu', label: 'Billing Studio' },
              { id: 'orders', label: 'Order Tickets' },
              { id: 'history', label: 'Payments History' },
              { id: 'discounts', label: 'Discounts & Coupons' },
              { id: 'refunds', label: 'Refund Processing' },
              { id: 'today-sales', label: "Today's Sales BI" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams({ tab: tab.id });
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded transition ${
                  activeTab === tab.id
                    ? 'bg-app-primary text-white shadow-app-sm'
                    : 'text-text-secondary hover:bg-app-elevated hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Redesigned Workflow View */}
      {activeTab === 'menu' && (
        <div>
          {/* Step 1 & 2: Mode and Table Selector maps */}
          <TableSelector
            diningMode={diningMode}
            setDiningMode={setDiningMode}
            selectedTable={selectedTable}
            onSelectTable={handleTableChange}
            tables={tables}
            onResetMode={handleResetPOS}
          />

          {/* Step 3, 4, 5: Main billing view once service mode and table are set */}
          {diningMode && (diningMode !== 'table' || selectedTable) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Catalog Main Area */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Waiter Selection searchable HUD */}
                <AppCard className="p-4 border border-app-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <WaiterSelector
                      waiters={waiters}
                      selectedWaiter={selectedWaiter}
                      onSelectWaiterChange={handleWaiterChange}
                      manualWaiterName={manualWaiterName}
                      onManualWaiterNameChange={setManualWaiterName}
                      getWaiterStats={getWaiterStats}
                    />
                    
                    <div className="flex flex-col justify-end">
                      <CustomerPanel
                        customerName={customerName}
                        customerPhone={customerPhone}
                        customerEmail={customerEmail}
                        partySize={partySize}
                        bookingDetails={activeBookingDetails}
                      />
                    </div>
                  </div>

                  {selectedTable && (
                    <div className="mt-3 flex justify-end">
                      <SecondaryButton
                        onClick={() => {
                          setTargetTransferTable('');
                          setMergeSourceTables([]);
                          setShowTableOpsModal(true);
                        }}
                        className="text-[10px] font-bold py-1 px-2.5 border-app-primary/30 text-app-primary flex items-center gap-1"
                      >
                        <Layers size={11} />
                        Table Operations
                      </SecondaryButton>
                    </div>
                  )}
                </AppCard>

                {/* Catalog Dishe Cards Selector */}
                <MenuGrid
                  menuItems={menuItems}
                  onAddDirect={addToCart}
                  onItemClick={handleItemClick}
                />
              </div>

              {/* Right Billing Cart Sidebar Panel */}
              <div className="space-y-6">
                {heldTickets.length > 0 && (
                  <AppCard className="p-3 border border-app-border/40 bg-app-primary/5 text-xs">
                    <h4 className="font-extrabold text-text-primary uppercase tracking-wider mb-2">Held Receipts ({heldTickets.length})</h4>
                    <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                      {heldTickets.map(t => (
                        <div key={t.id} className="p-2 bg-app-elevated border border-app-border rounded-app-md flex justify-between items-center text-[10px]">
                          <span>{t.name}</span>
                          <SecondaryButton onClick={() => handleResumeTicket(t)} className="text-[9px] px-2 py-0.5">Resume</SecondaryButton>
                        </div>
                      ))}
                    </div>
                  </AppCard>
                )}

                <SectionCard title="Cart Receipt" subtitle="Calculated food ticket items">
                  <Cart
                    cart={cart}
                    updateQuantity={updateQuantity}
                    removeFromCart={removeFromCart}
                    onDuplicateItem={handleDuplicateItem}
                    subtotal={subtotal}
                    cgst={cgst}
                    sgst={sgst}
                    serviceCharge={serviceCharge}
                    discount={discount}
                    setDiscount={setDiscount}
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    couponDiscount={couponDiscount}
                    setCouponDiscount={setCouponDiscount}
                    grandTotal={grandTotal}
                    activeOrder={activeOrder}
                    addToast={addToast}
                  />

                  <CheckoutPanel
                    activeOrder={activeOrder}
                    onSendToKitchen={handleSendToKitchen}
                    onHoldBill={handleHoldBill}
                    onVoidBill={handleCancelOrder}
                    onOpenCheckout={handleOpenCheckout}
                    loading={loading}
                  />
                </SectionCard>
              </div>

            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fade-in text-xs font-medium text-text-secondary">
          <div className="flex justify-between items-center bg-app-surface/50 border border-app-border p-4 rounded-app-xl">
            <div>
              <h3 className="text-sm font-extrabold text-text-primary">Order Tickets Manager</h3>
              <p className="text-[10px] text-text-muted">Browse active kitchen KDS tickets, prepare times, and status progression logs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map(o => (
              <GlassCard key={o.id} className="p-4 border-app-border space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-extrabold text-text-primary text-xs block">Order #{o.id.slice(0, 6).toUpperCase()}</span>
                    <span className="text-[9px] text-text-muted block font-semibold">{o.order_type.replace('_', ' ').toUpperCase()} • {o.source.toUpperCase()}</span>
                  </div>
                  <Badge status={o.status === 'completed' ? 'success' : o.status === 'preparing' ? 'warning' : 'info'}>
                    {o.status}
                  </Badge>
                </div>

                <div className="divide-y divide-app-border/40 py-1.5 text-xs font-semibold text-text-primary">
                  {o.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{item.quantity}x {item.menu_item_name}</span>
                      <span>₹{Number(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-[11px] pt-1.5 border-t border-app-border/45 font-bold">
                  <span>Total Amount:</span>
                  <span className="text-app-primary">₹{Number(o.total_amount || 0).toFixed(2)}</span>
                </div>
              </GlassCard>
            ))}
            {orders.length === 0 && (
              <div className="col-span-full p-8 text-center text-text-muted border border-dashed border-app-border rounded-xl bg-app-elevated">
                No active order tickets loaded.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <AppCard className="p-4 border border-app-border">
          <BillHistory
            invoiceHistory={invoiceHistory}
            onOpenPreview={handleOpenInvoicePreview}
            onDownloadPDF={handleDownloadPDF}
            onPrint={handlePrintTrigger}
            onRefundInvoice={handleRefundInvoice}
          />
        </AppCard>
      )}

      {activeTab === 'discounts' && (
        <div className="space-y-6 animate-fade-in text-xs font-medium text-text-secondary">
          <div className="flex justify-between items-center bg-app-surface/50 border border-app-border p-4 rounded-app-xl">
            <div>
              <h3 className="text-sm font-extrabold text-text-primary">Discounts & Campaigns Analytics</h3>
              <p className="text-[10px] text-text-muted">Performance tracking for coupon codes, manual manager overrides, and promotion usage.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard title="Total Coupons Used" value={<span>248 Uses</span>} description="Active checkout applications" />
            <KPICard title="Revenue Saved" value={<span>₹2,480.00</span>} trend="up" description="Discount value distributed" />
            <KPICard title="Average Discount %" value={<span>12.4%</span>} description="Mean order reduction value" />
            <KPICard title="Top Campaign" value={<span>WEEKEND20</span>} description="High engagement code usage" />
          </div>

          <SectionCard title="Active Promotions Ledger" subtitle="Coupon definitions and usage limits">
            <div className="divide-y divide-app-border border border-app-border rounded-xl bg-app-elevated">
              {[
                { code: 'WELCOME10', discount: '10%', type: 'Percentage', usage: 142, status: 'active' },
                { code: 'WEEKEND20', discount: '20%', type: 'Percentage', usage: 84, status: 'active' },
                { code: 'FLAT100', discount: '₹10.00', type: 'Fixed Value', usage: 22, status: 'active' }
              ].map((promo, idx) => (
                <div key={idx} className="p-3.5 flex justify-between items-center">
                  <div>
                    <span className="font-extrabold text-text-primary text-sm block">{promo.code}</span>
                    <span className="text-[10px] text-text-muted font-bold block">{promo.type} reduction</span>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge status="success">{promo.status}</Badge>
                    <span className="text-[10px] text-text-muted block font-bold">{promo.usage} checkouts applied</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === 'refunds' && (
        <div className="space-y-6 animate-fade-in text-xs font-medium text-text-secondary">
          <div className="flex justify-between items-center bg-app-surface/50 border border-app-border p-4 rounded-app-xl">
            <div>
              <h3 className="text-sm font-extrabold text-text-primary">Refund Operations Control</h3>
              <p className="text-[10px] text-text-muted">Reverse inventory deductions, void invoices, loyalty adjustments, and auditing records.</p>
            </div>
          </div>

          <div className="border border-app-border rounded-xl overflow-hidden bg-app-elevated">
            <table className="w-full text-left text-xs border-collapse font-medium">
              <thead>
                <tr className="bg-app-surface border-b border-app-border font-extrabold text-text-primary uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Invoice ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoiceHistory.map(inv => (
                  <tr key={inv.id} className="border-b border-app-border/40 hover:bg-app-surface transition-colors">
                    <td className="p-3.5 text-text-primary font-bold">#{inv.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-3.5">{inv.customer_name || 'Walk-In Customer'}</td>
                    <td className="p-3.5 font-bold text-text-primary">₹{Number(inv.grand_total).toFixed(2)}</td>
                    <td className="p-3.5 capitalize">{inv.payment_method}</td>
                    <td className="p-3.5">
                      <Badge status={inv.status === 'refunded' ? 'danger' : 'success'}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      {inv.status !== 'refunded' ? (
                        <button
                          onClick={() => handleRefundInvoice(inv.id)}
                          className="px-2.5 py-1 text-[10px] font-black uppercase text-app-danger border border-app-danger/25 bg-app-danger/5 hover:bg-app-danger/10 rounded transition-colors"
                        >
                          Refund E2E
                        </button>
                      ) : (
                        <span className="text-[10px] text-text-muted italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {invoiceHistory.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-text-muted">No transactions registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'today-sales' && (
        <div className="space-y-6 animate-fade-in text-xs font-medium text-text-secondary">
          <div className="flex justify-between items-center bg-app-surface/50 border border-app-border p-4 rounded-app-xl">
            <div>
              <h3 className="text-sm font-extrabold text-text-primary">Today's Sales Cockpit (BI Dashboard)</h3>
              <p className="text-[10px] text-text-muted">Real-time hourly earnings curves, checkout counts, payment method breakdowns, and average invoice amounts.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Today's Revenue" value={<span>₹{Number(invoiceHistory.filter(i => i.status !== 'refunded').reduce((acc, i) => acc + Number(i.grand_total), 0)).toFixed(2)}</span>} trend="up" description="Gross checkout sales totals" />
            <KPICard title="Active Transactions" value={<span>{invoiceHistory.length} bills</span>} description="Generated invoices count" />
            <KPICard title="Refund Deductions" value={<span>-${Number(invoiceHistory.filter(i => i.status === 'refunded').reduce((acc, i) => acc + Number(i.grand_total), 0)).toFixed(2)}</span>} trend="down" description="Reversed invoice void totals" />
            <KPICard title="Average Ticket Size" value={<span>₹{Number(invoiceHistory.length > 0 ? invoiceHistory.reduce((acc, i) => acc + Number(i.grand_total), 0) / invoiceHistory.length : 0).toFixed(2)}</span>} description="Mean ticket billing value" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionCard title="Payment Method Mix" subtitle="Division of payment gateway channels used">
              <div className="space-y-4">
                {['cash', 'card', 'upi', 'wallet'].map(method => {
                  const count = invoiceHistory.filter(i => i.payment_method === method).length;
                  const pct = invoiceHistory.length > 0 ? Math.round((count / invoiceHistory.length) * 100) : 0;
                  return (
                    <div key={method} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="capitalize">{method} Gateway</span>
                        <span className="text-text-primary">{count} bills ({pct}%)</span>
                      </div>
                      <div className="w-full bg-app-surface h-2 rounded-full overflow-hidden border border-app-border">
                        <div className="h-full bg-app-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Category Revenue Performance" subtitle="Sales value by menu item categories">
              <div className="space-y-3 text-xs leading-normal">
                <div className="flex justify-between font-semibold border-b border-app-border/40 pb-1 text-[10px] text-text-muted uppercase tracking-wider">
                  <span>Category</span>
                  <span className="text-right">Revenue Share</span>
                </div>
                {[
                  { cat: 'Main Course', amt: '₹1,240.00', pct: 45 },
                  { cat: 'Beverages', amt: '₹680.00', pct: 25 },
                  { cat: 'Desserts', amt: '₹420.00', pct: 15 },
                  { cat: 'Appetizers', amt: '₹380.00', pct: 15 }
                ].map((c, idx) => (
                  <div key={idx} className="flex justify-between font-bold text-text-primary">
                    <span>{c.cat}</span>
                    <span className="text-app-primary">{c.amt} ({c.pct}%)</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Checkout Payment simulation Modal drawer */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="POS Cashier Settlement Checkout"
      >
        <PaymentPanel
          grandTotal={grandTotal}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          splitAmounts={splitAmounts}
          setSplitAmounts={setSplitAmounts}
          splitPayments={splitPayments}
          setSplitPayments={setSplitPayments}
          tempSplitMethod={tempSplitMethod}
          setTempSplitMethod={setTempSplitMethod}
          tempSplitAmount={tempSplitAmount}
          setTempSplitAmount={setTempSplitAmount}
          tempGuestLabel={tempGuestLabel}
          setTempGuestLabel={setTempGuestLabel}
          paymentStep={paymentStep}
          setPaymentStep={setPaymentStep}
          transactionId={transactionId}
          setTransactionId={setTransactionId}
          cardSimulationState={cardSimulationState}
          setCardSimulationState={setCardSimulationState}
          onSubmitPayment={handleCheckoutSettle}
          addToast={addToast}
        />
      </Modal>

      {/* Invoice Detail Modal preview drawer */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewInvoice(null);
        }}
        title="Settled Invoice Receipt"
      >
        <InvoicePreview
          invoice={previewInvoice}
          orderDetails={previewInvoice?.order_details}
          onDownloadPDF={handleDownloadPDF}
          onEmailInvoice={handleEmailInvoice}
          onPrint={handlePrintTrigger}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewInvoice(null);
          }}
        />
      </Modal>

      {/* Cash Drawer Daily count balance session Modal */}
      <Modal
        isOpen={showDrawerModal}
        onClose={() => setShowDrawerModal(false)}
        title="Physical Cash Drawer Audit"
      >
        <CashDrawer
          cashDrawerOpen={cashDrawerOpen}
          activeDrawerSession={activeDrawerSession}
          openingBalanceInput={openingBalanceInput}
          setOpeningBalanceInput={setOpeningBalanceInput}
          closingBalanceInput={closingBalanceInput}
          setClosingBalanceInput={setClosingBalanceInput}
          drawerNotes={drawerNotes}
          setDrawerNotes={setDrawerNotes}
          onOpenSession={handleOpenDrawerSession}
          onCloseSession={handleCloseDrawerSession}
          onClose={() => setShowDrawerModal(false)}
        />
      </Modal>

      {/* Table Merge & Transfer operations modal */}
      <Modal
        isOpen={showTableOpsModal}
        onClose={() => setShowTableOpsModal(false)}
        title="Merge or Move Table Seating Session"
      >
        <div className="space-y-4 text-xs">
          <div className="flex gap-2 border-b border-app-border pb-2">
            <button
              onClick={() => setTableOpsType('transfer')}
              className={`flex-1 py-1.5 font-bold rounded text-center transition ${
                tableOpsType === 'transfer' ? 'bg-app-primary text-white' : 'bg-app-elevated text-text-secondary'
              }`}
            >
              Transfer Seat
            </button>
            <button
              onClick={() => setTableOpsType('merge')}
              className={`flex-1 py-1.5 font-bold rounded text-center transition ${
                tableOpsType === 'merge' ? 'bg-app-primary text-white' : 'bg-app-elevated text-text-secondary'
              }`}
            >
              Merge Seats
            </button>
          </div>

          {tableOpsType === 'transfer' ? (
            <div className="space-y-3">
              <Select
                label="Transfer Table To"
                value={targetTransferTable}
                onChange={(e) => setTargetTransferTable(e.target.value)}
              >
                <option value="">Choose vacant table</option>
                {tables.filter(t => t.number !== selectedTable && t.status === 'available').map(t => (
                  <option key={t.id} value={t.number}>Table {t.number}</option>
                ))}
              </Select>
              <PrimaryButton onClick={handleTransferTable} className="w-full mt-2">
                Move Table Billing Session
              </PrimaryButton>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="max-h-[140px] overflow-y-auto border border-app-border rounded p-2 space-y-1">
                {tables.filter(t => t.number !== selectedTable && t.status === 'occupied').map(t => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-app-elevated">
                    <input
                      type="checkbox"
                      checked={mergeSourceTables.includes(t.number)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMergeSourceTables([...mergeSourceTables, t.number]);
                        } else {
                          setMergeSourceTables(mergeSourceTables.filter(num => num !== t.number));
                        }
                      }}
                    />
                    <span>Table {t.number} ({t.status})</span>
                  </label>
                ))}
              </div>
              <PrimaryButton onClick={handleMergeTables} className="w-full mt-2">
                Merge Selected Tables
              </PrimaryButton>
            </div>
          )}
        </div>
      </Modal>

      {/* Item Modifiers customization popup modal */}
      <Modal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        title={customizingItem ? `Customize: ${customizingItem.name}` : 'Customize Item'}
      >
        {customizingItem && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Select Variant Size" value={customVariant} onChange={(e) => setCustomVariant(e.target.value)}>
                <option value="regular">Regular</option>
                {customizingItem.category === 'Pizza' && <option value="large">Large (+₹3.00)</option>}
                {customizingItem.category === 'Pizza' && <option value="small">Small (-₹1.50)</option>}
              </Select>
              <Select label="Course Placement" value={customCourse} onChange={(e) => setCustomCourse(e.target.value)}>
                <option value="starter">Starter</option>
                <option value="main_course">Main Course</option>
                <option value="dessert">Dessert</option>
                <option value="beverage">Beverage</option>
              </Select>
            </div>

            <div className="space-y-2">
              <span className="font-extrabold text-text-primary block uppercase text-[10px] tracking-wider">Dishes Modifiers Add-ons</span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 bg-app-elevated border border-app-border/40 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customModifiers.extraCheese}
                    onChange={(e) => setCustomModifiers({ ...customModifiers, extraCheese: e.target.checked })}
                  />
                  <span>Extra Cheese (+₹1.50)</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-app-elevated border border-app-border/40 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customModifiers.extraSpice}
                    onChange={(e) => setCustomModifiers({ ...customModifiers, extraSpice: e.target.checked })}
                  />
                  <span>Extra Spice (+₹0.50)</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-app-elevated border border-app-border/40 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customModifiers.glutenFree}
                    onChange={(e) => setCustomModifiers({ ...customModifiers, glutenFree: e.target.checked })}
                  />
                  <span>Gluten Free (+₹2.00)</span>
                </label>
              </div>
            </div>

            <Input
              label="Kitchen Prep Note instructions"
              placeholder="e.g. less oil, extra hot..."
              value={customKitchenNotes}
              onChange={(e) => setCustomKitchenNotes(e.target.value)}
            />

            <PrimaryButton onClick={handleConfirmCustomization} className="w-full mt-2">
              Apply Modifier & Add to Cart
            </PrimaryButton>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default POS;
