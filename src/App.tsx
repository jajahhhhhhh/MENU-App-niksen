import React, { useState, useEffect } from 'react';
import { 
  Beer, 
  Utensils, 
  ClipboardList, 
  BarChart3, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Receipt,
  Search,
  Settings,
  X,
  Image as ImageIcon,
  Upload,
  Globe,
  Users,
  UserPlus,
  Crown,
  Award,
  Phone,
  Mail,
  UserCheck,
  Star,
  Gift,
  ChevronRight,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  ShoppingBag,
  Barcode,
  QrCode,
  Clock,
  AlertTriangle,
  Boxes,
  Check,
  RotateCcw,
  LogIn,
  LogOut,
  Timer,
  Package,
  AlertCircle,
  Store,
  Bike,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { MenuItem, Order, DailyReport, Member, StaffMember, StaffShift } from './types';
import { NiksenLogo } from './components/NiksenLogo';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'members' | 'staff' | 'reports' | 'manage'>('menu');
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [storeForm, setStoreForm] = useState({ shop_name: '', promptpay_id: '', staff_pin: '' });
  const [storeSaved, setStoreSaved] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [shiftLogs, setShiftLogs] = useState<StaffShift[]>([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', role: 'Head Bartender' });
  
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanNotification, setScanNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [manageSubTab, setManageSubTab] = useState<'menu_items' | 'inventory' | 'store_settings'>('menu_items');
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ name: '', phone: '', email: '' });
  const [memberDetailsModal, setMemberDetailsModal] = useState<(Member & { orders?: Order[] }) | null>(null);

  const [currentOrder, setCurrentOrder] = useState<{ 
    table: number; 
    items: { item: MenuItem; quantity: number }[]; 
    notes: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    memberId: number | null;
    pointsRedeemed: number;
  }>({
    table: 1,
    items: [],
    notes: '',
    discountType: 'percentage',
    discountValue: 0,
    memberId: null,
    pointsRedeemed: 0
  });

  const [showReceipt, setShowReceipt] = useState<Order | null>(null);
  const [showConfirmOrder, setShowConfirmOrder] = useState(false);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Management state
  const [newItem, setNewItem] = useState({ name: '', name_th: '', name_ru: '', category: '', price: '', image_url: '' });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category)))];

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setAuthed(!!d.authed))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchMenu();
    fetchOrders();
    fetchMembers();
    fetchStaff();
    fetchSettings();
  }, [authed]);

  useEffect(() => {
    setStoreForm(f => ({ ...f, shop_name: settings.shop_name || '', promptpay_id: settings.promptpay_id || '' }));
  }, [settings]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinInput }),
    });
    if (res.ok) { setAuthed(true); setPinError(false); }
    else { setPinError(true); setPinInput(''); }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthed(false);
  };

  const saveStoreSettings = async () => {
    const body: Record<string, string> = { shop_name: storeForm.shop_name, promptpay_id: storeForm.promptpay_id };
    if (storeForm.staff_pin) body.staff_pin = storeForm.staff_pin;
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setStoreSaved(true);
      setStoreForm(f => ({ ...f, staff_pin: '' }));
      fetchSettings();
      setTimeout(() => setStoreSaved(false), 2500);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
        setShiftLogs(data.shifts || []);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  };

  const handleBarcodeScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = barcodeInput.trim();
    if (!cleanCode) return;

    // Search by barcode or id
    const match = menuItems.find(
      i => (i.barcode && i.barcode.toLowerCase() === cleanCode.toLowerCase()) || 
           i.id.toString() === cleanCode ||
           i.name.toLowerCase().includes(cleanCode.toLowerCase())
    );

    if (match) {
      addToOrder(match);
      setScanNotification({
        message: `Scanned: ${match.name} (฿${match.price}) added to cart!`,
        type: 'success'
      });
      setBarcodeInput('');
    } else {
      setScanNotification({
        message: `No item found for code "${cleanCode}"`,
        type: 'error'
      });
    }

    setTimeout(() => {
      setScanNotification(null);
    }, 3500);
  };

  const handleStaffClockIn = async (staffId: number) => {
    try {
      const res = await fetch('/api/staff/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId })
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStaffClockOut = async (staffId: number) => {
    try {
      const res = await fetch('/api/staff/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId })
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStaffMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name) return;
    try {
      const res = await fetch('/api/staff/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaffForm)
      });
      if (res.ok) {
        setNewStaffForm({ name: '', role: 'Head Bartender' });
        setShowAddStaffModal(false);
        fetchStaff();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStock = async (itemId: number, newStock: number, lowThreshold?: number) => {
    try {
      const payload: any = { stock_quantity: Math.max(0, newStock) };
      if (lowThreshold !== undefined) payload.low_stock_threshold = lowThreshold;
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchMenu();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchSettings();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Failed to connect to Google. Please check your configuration.');
    }
  };

  const fetchMenu = async () => {
    const res = await fetch('/api/menu');
    const data = await res.json();
    setMenuItems(data.map((i: any) => ({ ...i, available: !!i.available })));
  };

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
  };

  const fetchMembers = async (search = '') => {
    try {
      const res = await fetch(`/api/members?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const fetchReport = async () => {
    const res = await fetch('/api/reports/daily');
    const data = await res.json();
    setReport(data);
  };

  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.phone) return;
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemberForm)
      });
      if (res.ok) {
        const member = await res.json();
        setNewMemberForm({ name: '', phone: '', email: '' });
        setShowAddMemberModal(false);
        fetchMembers();
        setSelectedMember(member);
        setCurrentOrder(prev => ({ ...prev, memberId: member.id }));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register member');
      }
    } catch (err) {
      console.error('Member creation error:', err);
    }
  };

  const handleViewMemberDetails = async (memberId: number) => {
    try {
      const res = await fetch(`/api/members/${memberId}`);
      if (res.ok) {
        const data = await res.json();
        setMemberDetailsModal(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
    const method = editingItem ? 'PATCH' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, price: parseFloat(newItem.price) })
    });
    
    if (res.ok) {
      setNewItem({ name: '', name_th: '', name_ru: '', category: '', price: '', image_url: '' });
      setEditingItem(null);
      fetchMenu();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      name_th: item.name_th || '',
      name_ru: item.name_ru || '',
      category: item.category,
      price: item.price.toString(),
      image_url: item.image_url || ''
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setNewItem({ name: '', name_th: '', name_ru: '', category: '', price: '', image_url: '' });
  };

  const toggleAvailability = async (item: MenuItem) => {
    const res = await fetch(`/api/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !item.available })
    });
    if (res.ok) fetchMenu();
  };

  const addToOrder = (item: MenuItem) => {
    setCurrentOrder(prev => {
      const existing = prev.items.find(i => i.item.id === item.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        };
      }
      return { ...prev, items: [...prev.items, { item, quantity: 1 }] };
    });
  };

  const removeFromOrder = (itemId: number) => {
    setCurrentOrder(prev => ({
      ...prev,
      items: prev.items.map(i => i.item.id === itemId ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter(i => i.quantity > 0)
    }));
  };

  const attachMemberToOrder = (member: Member) => {
    setSelectedMember(member);
    setCurrentOrder(prev => {
      let discountVal = prev.discountValue;
      let discountT = prev.discountType;
      if (member.tier === 'Platinum') {
        discountT = 'percentage';
        discountVal = 10;
      } else if (member.tier === 'Gold') {
        discountT = 'percentage';
        discountVal = 5;
      }
      return {
        ...prev,
        memberId: member.id,
        discountType: discountT,
        discountValue: discountVal
      };
    });
  };

  const detachMemberFromOrder = () => {
    setSelectedMember(null);
    setCurrentOrder(prev => ({ ...prev, memberId: null, pointsRedeemed: 0 }));
  };

  const submitOrder = async () => {
    if (currentOrder.items.length === 0) return;
    setShowConfirmOrder(true);
  };

  const confirmAndSubmitOrder = async () => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_number: currentOrder.table,
        notes: currentOrder.notes,
        discount_type: currentOrder.discountType,
        discount_value: currentOrder.discountValue,
        member_id: selectedMember?.id || currentOrder.memberId || null,
        points_redeemed: currentOrder.pointsRedeemed || 0,
        items: currentOrder.items.map(i => ({
          menu_item_id: i.item.id,
          quantity: i.quantity,
          price: i.item.price
        }))
      })
    });
    if (res.ok) {
      setCurrentOrder({ table: 1, items: [], notes: '', discountType: 'percentage', discountValue: 0, memberId: null, pointsRedeemed: 0 });
      setSelectedMember(null);
      setShowConfirmOrder(false);
      fetchOrders();
      fetchMembers();
      setActiveTab('orders');
    }
  };

  const markAsPaid = async (orderId: number) => {
    const res = await fetch(`/api/orders/${orderId}/pay`, { method: 'POST' });
    if (res.ok) {
      fetchOrders();
      fetchMembers();
      const orderRes = await fetch(`/api/orders/${orderId}`);
      const orderData = await orderRes.json();
      setShowReceipt(orderData);
    }
  };

  const updateOrderStatus = async (orderId: number, status: Order['status']) => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchOrders();
  };

  const formatCurrency = (amount: number) => {
    return `฿${Math.round(amount || 0).toLocaleString('en-US')}`;
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const subtotal = currentOrder.items.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);
  
  const discountAmount = currentOrder.discountType === 'percentage' 
    ? (subtotal * currentOrder.discountValue / 100)
    : currentOrder.discountValue;
  
  const pointsDiscountAmount = currentOrder.pointsRedeemed || 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount - pointsDiscountAmount);
  const tax = discountedSubtotal * 0.10; // TAX 10%
  const total = discountedSubtotal + tax;
  const pointsEarnedPreview = Math.floor(total / 50);

  const calculateOrderTotal = (order: Order) => {
    const itemsTotal = order.items?.reduce((sum, i) => sum + (i.price_at_time * i.quantity), 0) || 0;
    const discAmount = order.discount_type === 'percentage'
      ? (itemsTotal * (order.discount_value || 0) / 100)
      : (order.discount_value || 0);
    const ptsDiscount = order.points_redeemed || 0;
    const discSubtotal = Math.max(0, itemsTotal - discAmount - ptsDiscount);
    return discSubtotal * 1.10; // 10% TAX, no service
  };

  if (authed === null) {
    return <div className="min-h-screen bg-stone-900" />;
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-stone-800 border border-stone-700 rounded-3xl p-8 w-full max-w-sm text-center space-y-6 shadow-2xl">
          <div className="flex justify-center"><NiksenLogo variant="white" size="sm" /></div>
          <div>
            <div className="w-14 h-14 bg-stone-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-stone-100">Staff Login</h1>
            <p className="text-sm text-stone-400 mt-1">Enter your PIN to open the POS</p>
          </div>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            maxLength={8}
            value={pinInput}
            onChange={e => { setPinInput(e.target.value.replace(/[^0-9]/g, '')); setPinError(false); }}
            className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-stone-900 border border-stone-600 rounded-2xl py-4 text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="••••"
          />
          {pinError && <p className="text-sm text-red-400">Incorrect PIN — try again.</p>}
          <button
            type="submit"
            disabled={pinInput.length < 4}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-700 disabled:text-stone-500 text-stone-900 py-3.5 rounded-2xl font-bold transition-colors"
          >
            Unlock POS
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-stone-900 text-stone-100 px-6 py-3.5 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-stone-800 border border-stone-700/80 px-3.5 py-1.5 rounded-2xl flex items-center shadow-inner">
            <NiksenLogo variant="white" size="sm" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">POS SYSTEM</span>
            </div>
            <p className="text-[10px] text-stone-400 font-mono mt-0.5">BANGKOK, THAILAND • THB ฿ • TAX 10%</p>
          </div>
        </div>
        <nav className="flex gap-1 bg-stone-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${activeTab === 'menu' ? 'bg-stone-100 text-stone-900 shadow-sm font-bold' : 'hover:bg-stone-700'}`}
          >
            <Utensils className="w-4 h-4" />
            Menu
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${activeTab === 'orders' ? 'bg-stone-100 text-stone-900 shadow-sm font-bold' : 'hover:bg-stone-700'}`}
          >
            <ClipboardList className="w-4 h-4" />
            Orders
          </button>
          <button 
            onClick={() => { setActiveTab('members'); fetchMembers(); }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${activeTab === 'members' ? 'bg-emerald-500 text-stone-900 shadow-sm font-bold' : 'hover:bg-stone-700'}`}
          >
            <Crown className="w-4 h-4 text-amber-300" />
            Members
          </button>
          <button 
            onClick={() => { setActiveTab('staff'); fetchStaff(); }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${activeTab === 'staff' ? 'bg-amber-400 text-stone-900 shadow-sm font-bold' : 'hover:bg-stone-700'}`}
          >
            <Clock className="w-4 h-4" />
            Staff
          </button>
          <button 
            onClick={() => { setActiveTab('reports'); fetchReport(); }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${activeTab === 'reports' ? 'bg-stone-100 text-stone-900 shadow-sm font-bold' : 'hover:bg-stone-700'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Reports
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${activeTab === 'manage' ? 'bg-stone-100 text-stone-900 shadow-sm font-bold' : 'hover:bg-stone-700'}`}
          >
            <Settings className="w-4 h-4" />
            Manage
          </button>
          
          <div className="w-[1px] h-6 bg-stone-700 my-auto mx-1" />

          <button
            onClick={handleLogout}
            title="Lock POS"
            className="px-3 py-2 rounded-lg transition-all flex items-center text-stone-400 hover:bg-stone-700 hover:text-stone-100"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
              isSidebarOpen ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-emerald-500 text-stone-900 font-bold shadow-md'
            }`}
            title={isSidebarOpen ? "Hide Current Order Sidebar" : "Show Current Order Sidebar"}
          >
            {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            <span className="hidden md:inline">{isSidebarOpen ? 'Hide Order' : 'Show Order'}</span>
            {currentOrder.items.length > 0 && (
              <span className="bg-emerald-400 text-stone-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {currentOrder.items.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </button>
        </nav>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Menu Items</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    type="text" 
                    placeholder="Search menu..." 
                    className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Barcode Scanner Bar */}
              <div className="bg-stone-900 text-stone-100 p-4 rounded-2xl shadow-md border border-stone-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30">
                    <Barcode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                      Barcode / SKU Quick Scanner
                      <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full border border-stone-700 font-mono">Auto-Add to Cart</span>
                    </h3>
                    <p className="text-xs text-stone-400">Scan or type item barcode to instantly add to current order</p>
                  </div>
                </div>

                <form onSubmit={handleBarcodeScan} className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input 
                      type="text"
                      placeholder="Scan code (e.g. 8850000001)..."
                      className="w-full pl-9 pr-4 py-2 bg-stone-800 text-stone-100 border border-stone-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-emerald-500 text-stone-900 font-bold px-4 py-2 rounded-xl text-xs hover:bg-emerald-400 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Scan & Add
                  </button>
                </form>
              </div>

              {scanNotification && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
                    scanNotification.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {scanNotification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  {scanNotification.message}
                </motion.div>
              )}

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-stone-500 hover:bg-stone-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMenu.map(item => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToOrder(item)}
                    disabled={!item.available}
                    className={`p-0 overflow-hidden rounded-2xl bg-white border border-stone-200 shadow-sm text-left flex flex-col h-64 transition-all ${!item.available ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-emerald-500 hover:shadow-md'}`}
                  >
                    <div className="h-32 bg-stone-100 relative overflow-hidden">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                      {!item.available && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider">Sold Out</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold uppercase tracking-wider text-stone-400">{item.category}</span>
                          {item.barcode && (
                            <span className="font-mono text-[9px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Barcode className="w-2.5 h-2.5" />
                              {item.barcode}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base leading-tight line-clamp-2 mt-0.5">{item.name}</h3>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="font-mono text-emerald-600 font-bold text-lg">{formatCurrency(item.price)}</span>
                        {item.stock_quantity !== undefined && (
                          <div className="flex items-center gap-1 text-[11px]">
                            {item.stock_quantity <= (item.low_stock_threshold || 10) ? (
                              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 text-[10px]" title="Low Stock Alert">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                {item.stock_quantity} left
                              </span>
                            ) : (
                              <span className="text-stone-400 font-mono text-[10px]">Stock: {item.stock_quantity}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Active & Past Orders</h2>
              <div className="grid grid-cols-1 gap-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex justify-between items-center">
                    <div className="flex gap-6 items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                        order.order_type === 'pickup' ? 'bg-blue-100 text-blue-600' :
                        order.order_type === 'delivery' ? 'bg-purple-100 text-purple-600' : 'bg-stone-100'
                      }`}>
                        {order.order_type === 'pickup' ? <Store className="w-6 h-6" /> :
                         order.order_type === 'delivery' ? <Bike className="w-6 h-6" /> :
                         order.table_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">Order #{order.id}</span>
                          {order.member_name && (
                            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-600" />
                              {order.member_name}
                            </span>
                          )}
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              order.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 
                              order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                              order.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                              order.status === 'ready' ? 'bg-purple-100 text-purple-600' :
                              'bg-amber-100 text-amber-600'
                            }`}
                          >
                            <option value="open">Open</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <p className="text-sm text-stone-500">{new Date(order.created_at).toLocaleString()}</p>
                        {order.order_type && order.order_type !== 'dine_in' && (
                          <p className="text-xs font-bold mt-1 uppercase tracking-wide text-blue-600">
                            Online {order.order_type} · {order.customer_name} · {order.customer_phone}
                            {order.delivery_address ? ` · ${order.delivery_address}` : ''}
                          </p>
                        )}
                        {order.notes && (
                          <p className="text-xs text-amber-600 font-medium mt-1 italic">Note: {order.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-stone-400 uppercase font-bold tracking-wider">Total (10% Tax Inc.)</p>
                        <p className="font-mono font-bold text-lg text-emerald-600">{formatCurrency(order.total || 0)}</p>
                      </div>
                      {order.status !== 'paid' && order.status !== 'cancelled' && (
                        <button 
                          onClick={() => markAsPaid(order.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Pay Now
                        </button>
                      )}
                      {order.status === 'paid' && (
                        <button 
                          onClick={async () => {
                            const res = await fetch(`/api/orders/${order.id}`);
                            const data = await res.json();
                            setShowReceipt(data);
                          }}
                          className="text-stone-400 hover:text-stone-900 p-2 transition-colors"
                          title="View Receipt"
                        >
                          <Receipt className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Membership Club Tab */}
          {activeTab === 'members' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <Crown className="w-8 h-8 text-amber-500" />
                    Niksen Bar VIP Club
                  </h2>
                  <p className="text-stone-500 text-sm">Manage member points, tier rewards, and guest perks.</p>
                </div>
                <button 
                  onClick={() => setShowAddMemberModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
                >
                  <UserPlus className="w-5 h-5" />
                  Register New Member
                </button>
              </div>

              {/* Member Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between">
                  <div>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Total Active Members</p>
                    <p className="text-3xl font-mono font-bold mt-1">{members.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-stone-800 flex items-center justify-center text-emerald-400">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-amber-500 text-white p-6 rounded-3xl shadow-lg shadow-amber-100 flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-xs font-bold uppercase tracking-widest">Gold & Platinum VIPs</p>
                    <p className="text-3xl font-mono font-bold mt-1">
                      {members.filter(m => m.tier === 'Gold' || m.tier === 'Platinum').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-amber-100">
                    <Crown className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Points Issued</p>
                    <p className="text-3xl font-mono font-bold text-emerald-600 mt-1">
                      {members.reduce((sum, m) => sum + (m.points || 0), 0)} pts
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Gift className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Member Search & List */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input 
                      type="text" 
                      placeholder="Search member by phone or name..." 
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      value={memberSearchQuery}
                      onChange={(e) => {
                        setMemberSearchQuery(e.target.value);
                        fetchMembers(e.target.value);
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-stone-400 uppercase">Perks: 1 Pt earned per ฿50 spent</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map(member => (
                    <div 
                      key={member.id} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        selectedMember?.id === member.id 
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20' 
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              member.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                              member.tier === 'Gold' ? 'bg-amber-100 text-amber-700' :
                              'bg-stone-200 text-stone-700'
                            }`}>
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-base leading-tight">{member.name}</h3>
                              <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                {member.phone}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                            member.tier === 'Platinum' ? 'bg-purple-600 text-white shadow-sm' :
                            member.tier === 'Gold' ? 'bg-amber-500 text-white shadow-sm' :
                            'bg-stone-200 text-stone-700'
                          }`}>
                            <Crown className="w-3 h-3" />
                            {member.tier}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-4 bg-stone-50 p-3 rounded-xl border border-stone-100 text-center">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-stone-400">Available Points</p>
                            <p className="text-lg font-mono font-bold text-emerald-600">{member.points} pts</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-stone-400">Total Spent</p>
                            <p className="text-lg font-mono font-bold text-stone-800">{formatCurrency(member.total_spent)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-stone-100">
                        <button 
                          onClick={() => attachMemberToOrder(member)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            selectedMember?.id === member.id 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'bg-stone-100 hover:bg-emerald-500 hover:text-white text-stone-700'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {selectedMember?.id === member.id ? 'Attached to Order' : 'Attach to Order'}
                        </button>
                        <button 
                          onClick={() => handleViewMemberDetails(member.id)}
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && report && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">Daily Sales Report</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-500 text-white p-6 rounded-3xl shadow-lg shadow-emerald-200">
                  <p className="text-emerald-100 uppercase text-xs font-bold tracking-widest mb-1">Total Revenue (Inc. 10% Tax)</p>
                  <p className="text-4xl font-mono font-bold">{formatCurrency(report.summary.total_revenue || 0)}</p>
                </div>
                <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-lg shadow-stone-200">
                  <p className="text-stone-400 uppercase text-xs font-bold tracking-widest mb-1">Total Orders</p>
                  <p className="text-4xl font-mono font-bold">{report.summary.total_orders}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                    Category Breakdown
                  </h3>
                  <div className="space-y-4">
                    {report.categoryBreakdown.map(cat => (
                      <div key={cat.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-bold">{cat.category}</span>
                          <span className="font-mono">{formatCurrency(cat.revenue)}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${report.summary.total_revenue ? (cat.revenue / report.summary.total_revenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-500" />
                    Top Selling Items
                  </h3>
                  <div className="space-y-4">
                    {report.topItems.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-stone-300 font-bold italic text-xl">0{idx + 1}</span>
                          <span className="font-bold">{item.name}</span>
                        </div>
                        <span className="bg-stone-100 px-3 py-1 rounded-full text-xs font-bold">
                          {item.total_quantity} sold
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <Clock className="w-8 h-8 text-amber-500" />
                    Staff Shift & Time Tracker
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">Clock in/out staff members, manage bar shifts, and view daily hours worked.</p>
                </div>
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="bg-stone-900 text-stone-100 hover:bg-stone-800 px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  Add Staff Member
                </button>
              </div>

              {/* Staff Stats Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Clocked-In Staff</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">
                      {staffList.filter(s => s.status === 'clocked_in').length} / {staffList.length}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">Active on shift right now</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <UserCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Shift Hours Today</p>
                    <p className="text-3xl font-bold text-amber-600 font-mono mt-1">
                      {shiftLogs
                        .filter(s => {
                          const shiftDate = new Date(s.clock_in).toDateString();
                          return shiftDate === new Date().toDateString();
                        })
                        .reduce((sum, s) => sum + (s.hours_worked || 0), 0)
                        .toFixed(1)} hrs
                    </p>
                    <p className="text-xs text-stone-400 mt-1">Total logged staff hours</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                    <Timer className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Active Shifts</p>
                    <p className="text-3xl font-bold text-stone-900 mt-1">
                      {shiftLogs.filter(s => !s.clock_out).length}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">Shifts currently ongoing</p>
                  </div>
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-700">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Staff Roster Grid */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-stone-500" />
                  Staff Roster & Shift Controls
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {staffList.map(staff => {
                    const isClockedIn = staff.status === 'clocked_in';
                    const shiftStart = staff.current_shift_start ? new Date(staff.current_shift_start) : null;
                    const shiftDuration = shiftStart 
                      ? ((Date.now() - shiftStart.getTime()) / (1000 * 60 * 60)).toFixed(1) 
                      : null;

                    return (
                      <div 
                        key={staff.id} 
                        className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                          isClockedIn 
                            ? 'bg-emerald-50/50 border-emerald-300 shadow-md' 
                            : 'bg-white border-stone-200 shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center font-bold text-sm">
                              {staff.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 ${
                              isClockedIn 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                                : 'bg-stone-100 text-stone-500'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                              {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                            </span>
                          </div>

                          <div className="mt-4">
                            <h4 className="font-bold text-base text-stone-900">{staff.name}</h4>
                            <p className="text-xs text-stone-500 font-medium">{staff.role}</p>
                          </div>

                          {isClockedIn && shiftStart && (
                            <div className="mt-3 bg-white p-2.5 rounded-xl border border-emerald-200/60 text-xs font-mono text-emerald-800 flex items-center justify-between">
                              <span className="text-stone-400 font-sans text-[10px] uppercase font-bold">Shift Start</span>
                              <span>{shiftStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({shiftDuration}h)</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-5">
                          {isClockedIn ? (
                            <button
                              onClick={() => handleStaffClockOut(staff.id)}
                              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              Clock Out
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStaffClockIn(staff.id)}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              <LogIn className="w-4 h-4" />
                              Clock In
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shift History & Time Logs */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-amber-500" />
                    Today's Shift Log & Time Cards
                  </h3>
                  <button 
                    onClick={fetchStaff} 
                    className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Refresh Logs
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-xs text-stone-400 uppercase font-bold">
                        <th className="p-3.5">Staff Member</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Clock In</th>
                        <th className="p-3.5">Clock Out</th>
                        <th className="p-3.5">Hours Worked</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                      {shiftLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-stone-400 text-xs">
                            No shift logs recorded today yet.
                          </td>
                        </tr>
                      ) : (
                        shiftLogs.map(shift => {
                          const inTime = new Date(shift.clock_in);
                          const outTime = shift.clock_out ? new Date(shift.clock_out) : null;
                          const isActive = !shift.clock_out;

                          return (
                            <tr key={shift.id} className="hover:bg-stone-50/80 transition-colors">
                              <td className="p-3.5 font-bold text-stone-900">{shift.staff_name}</td>
                              <td className="p-3.5 text-stone-500 text-xs">{shift.role}</td>
                              <td className="p-3.5 font-mono text-xs">{inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({inTime.toLocaleDateString()})</td>
                              <td className="p-3.5 font-mono text-xs">
                                {outTime ? `${outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : <span className="text-emerald-600 font-bold italic">Ongoing Shift</span>}
                              </td>
                              <td className="p-3.5 font-mono font-bold text-stone-800">
                                {isActive ? (
                                  <span className="text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                                    {((Date.now() - inTime.getTime()) / (1000 * 3600)).toFixed(2)} hrs (Active)
                                  </span>
                                ) : (
                                  `${(shift.hours_worked || 0).toFixed(2)} hrs`
                                )}
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
                                }`}>
                                  {isActive ? 'In Shift' : 'Completed'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold">Management</h2>
                  <p className="text-stone-500 text-sm mt-0.5">Manage menu catalog, item barcodes, stock inventory, and store integrations.</p>
                </div>
                
                {/* Management Navigation Tabs */}
                <div className="flex bg-stone-200/80 p-1.5 rounded-2xl gap-1 shrink-0">
                  <button
                    onClick={() => setManageSubTab('menu_items')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      manageSubTab === 'menu_items' ? 'bg-white text-stone-900 shadow-md' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    Menu Items
                  </button>
                  <button
                    onClick={() => setManageSubTab('inventory')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                      manageSubTab === 'inventory' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Boxes className="w-4 h-4 text-emerald-400" />
                    Inventory & Stock
                    {menuItems.filter(i => (i.stock_quantity ?? 50) <= (i.low_stock_threshold ?? 10)).length > 0 && (
                      <span className="bg-amber-400 text-stone-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                        {menuItems.filter(i => (i.stock_quantity ?? 50) <= (i.low_stock_threshold ?? 10)).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setManageSubTab('store_settings')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      manageSubTab === 'store_settings' ? 'bg-white text-stone-900 shadow-md' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-blue-500" />
                    Store Integrations
                  </button>
                </div>
              </div>

              {manageSubTab === 'store_settings' && (
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 overflow-hidden">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <Globe className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Google Business Profile</h3>
                        <p className="text-sm text-stone-500">Link your bar to Google to sync reviews and store info.</p>
                        {settings.google_business_profile_id && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-[10px] bg-stone-100 px-2 py-1 rounded-lg font-mono text-stone-500">ID: {settings.google_business_profile_id}</span>
                            <span className="text-[10px] bg-stone-100 px-2 py-1 rounded-lg font-mono text-stone-500">Store: {settings.google_store_code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={handleConnectGoogle}
                      className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${settings.google_access_token ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'}`}
                    >
                      {settings.google_access_token ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Connected
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          Connect Google
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {manageSubTab === 'store_settings' && (
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Online Ordering & Security</h3>
                      <p className="text-sm text-stone-500">Customers order at <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded">/order</span> — share that link or print it as a QR code.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Shop name</label>
                      <input
                        type="text"
                        className="mt-1 w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={storeForm.shop_name}
                        onChange={e => setStoreForm({ ...storeForm, shop_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">PromptPay ID (phone or tax ID)</label>
                      <input
                        type="text"
                        placeholder="e.g. 0812345678"
                        className="mt-1 w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={storeForm.promptpay_id}
                        onChange={e => setStoreForm({ ...storeForm, promptpay_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Change staff PIN</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep"
                        maxLength={8}
                        className="mt-1 w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={storeForm.staff_pin}
                        onChange={e => setStoreForm({ ...storeForm, staff_pin: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveStoreSettings}
                      className="bg-stone-900 hover:bg-stone-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
                    >
                      Save Settings
                    </button>
                    {storeSaved && <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
                    {!settings.promptpay_id && <span className="text-xs text-amber-600">Set a PromptPay ID to show payment QR codes on online orders.</span>}
                  </div>
                </div>
              )}

              {manageSubTab === 'inventory' && (
                <div className="space-y-6">
                  {/* Inventory Overview Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Inventory SKUs</p>
                        <p className="text-3xl font-bold text-stone-900 mt-1">{menuItems.length}</p>
                        <p className="text-xs text-stone-400 mt-1">Tracked menu items</p>
                      </div>
                      <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-700">
                        <Package className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Low Stock Alerts
                        </p>
                        <p className="text-3xl font-bold text-amber-600 font-mono mt-1">
                          {menuItems.filter(i => (i.stock_quantity ?? 50) <= (i.low_stock_threshold ?? 10) && (i.stock_quantity ?? 50) > 0).length}
                        </p>
                        <p className="text-xs text-amber-600 mt-1 font-medium">Items below alert threshold</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Out of Stock</p>
                        <p className="text-3xl font-bold text-rose-600 font-mono mt-1">
                          {menuItems.filter(i => (i.stock_quantity ?? 50) <= 0).length}
                        </p>
                        <p className="text-xs text-rose-500 mt-1 font-medium">Depleted menu items</p>
                      </div>
                      <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Low Stock Callout Alert Banner */}
                  {menuItems.filter(i => (i.stock_quantity ?? 50) <= (i.low_stock_threshold ?? 10)).length > 0 && (
                    <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-center justify-between gap-4 text-amber-900 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-500 text-white p-2 rounded-xl shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Low Stock Alert Notice</h4>
                          <p className="text-xs text-amber-800">
                            {menuItems.filter(i => (i.stock_quantity ?? 50) <= (i.low_stock_threshold ?? 10)).length} items are running low or depleted. Restock inventory below to prevent order rejections.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inventory Search & Controls */}
                  <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-emerald-600" />
                        Item Availability & Stock Levels
                      </h3>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                          type="text" 
                          placeholder="Filter inventory..." 
                          className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={inventorySearch}
                          onChange={(e) => setInventorySearch(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-xs text-stone-400 uppercase font-bold">
                            <th className="p-4">Item & Barcode</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Current Stock</th>
                            <th className="p-4">Low Stock Limit</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Quick Restock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                          {menuItems
                            .filter(i => 
                              i.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                              i.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                              (i.barcode && i.barcode.includes(inventorySearch))
                            )
                            .map(item => {
                              const stock = item.stock_quantity ?? 50;
                              const limit = item.low_stock_threshold ?? 10;
                              const isLow = stock <= limit && stock > 0;
                              const isOut = stock <= 0;

                              return (
                                <tr key={item.id} className={`hover:bg-stone-50 transition-colors ${isOut ? 'bg-rose-50/40' : isLow ? 'bg-amber-50/40' : ''}`}>
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {item.image_url ? (
                                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                          <ImageIcon className="w-4 h-4 text-stone-300" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-bold text-stone-900">{item.name}</p>
                                        <p className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                                          <Barcode className="w-3 h-3" />
                                          {item.barcode || `88500000${item.id}`}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full font-bold">
                                      {item.category}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleUpdateStock(item.id, stock - 1)}
                                        className="w-7 h-7 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg flex items-center justify-center font-bold text-xs active:scale-95"
                                        title="Decrease 1"
                                      >
                                        -
                                      </button>
                                      <input 
                                        type="number"
                                        className="w-14 p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-center font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={stock}
                                        onChange={(e) => handleUpdateStock(item.id, parseInt(e.target.value) || 0)}
                                      />
                                      <button
                                        onClick={() => handleUpdateStock(item.id, stock + 1)}
                                        className="w-7 h-7 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg flex items-center justify-center font-bold text-xs active:scale-95"
                                        title="Increase 1"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                      <input 
                                        type="number"
                                        className="w-14 p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-center font-mono text-xs text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={limit}
                                        onChange={(e) => handleUpdateStock(item.id, stock, parseInt(e.target.value) || 5)}
                                      />
                                      <span className="text-xs text-stone-400">units</span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-center">
                                    {isOut ? (
                                      <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                        Out of Stock
                                      </span>
                                    ) : isLow ? (
                                      <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                        Low Stock Alert
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        In Stock
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right">
                                    <button
                                      onClick={() => handleUpdateStock(item.id, stock + 20)}
                                      className="bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm active:scale-95"
                                    >
                                      +20 Restock
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {manageSubTab === 'menu_items' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add/Edit Item Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm h-fit">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    {editingItem ? <Settings className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
                    {editingItem ? 'Edit Menu Item' : 'Add New Item'}
                  </h3>
                  <form onSubmit={handleSaveItem} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Item Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase mb-1">ชื่อภาษาไทย (TH)</label>
                        <input
                          type="text"
                          placeholder="Optional"
                          className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={newItem.name_th}
                          onChange={(e) => setNewItem({ ...newItem, name_th: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Название (RU)</label>
                        <input
                          type="text"
                          placeholder="Optional"
                          className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={newItem.name_ru}
                          onChange={(e) => setNewItem({ ...newItem, name_ru: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Category</label>
                      <input
                        type="text"
                        required
                        list="menu-categories"
                        placeholder="e.g. Coffee, Signature Tea, Bowls…"
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      />
                      <datalist id="menu-categories">
                        {Array.from(new Set(menuItems.map(i => i.category))).sort().map(c => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                      <p className="mt-1 text-[11px] text-stone-400">Pick an existing category or type a new one.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Price (THB ฿)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Item Image</label>
                      <div className="mt-1 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                          {newItem.image_url ? (
                            <img src={newItem.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-stone-300" />
                          )}
                        </div>
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-2 p-3 bg-stone-50 border border-dashed border-stone-300 rounded-xl hover:bg-stone-100 transition-colors">
                            <Upload className="w-4 h-4 text-stone-400" />
                            <span className="text-xs font-bold text-stone-500">Upload Photo</span>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editingItem && (
                        <button 
                          type="button"
                          onClick={cancelEdit}
                          className="flex-1 bg-stone-100 text-stone-600 py-3 rounded-xl font-bold hover:bg-stone-200 transition-all"
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        type="submit"
                        className={`flex-[2] text-white py-3 rounded-xl font-bold transition-all shadow-lg ${editingItem ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'}`}
                      >
                        {editingItem ? 'Update Item' : 'Save Item'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Menu List Table */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="p-4 text-xs font-bold text-stone-400 uppercase">Item</th>
                        <th className="p-4 text-xs font-bold text-stone-400 uppercase">Category</th>
                        <th className="p-4 text-xs font-bold text-stone-400 uppercase">Price</th>
                        <th className="p-4 text-xs font-bold text-stone-400 uppercase text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map(item => (
                        <tr key={item.id} className={`border-b border-stone-100 hover:bg-stone-50 transition-colors ${editingItem?.id === item.id ? 'bg-amber-50' : ''}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-stone-300" />
                                )}
                              </div>
                              <span className="font-bold">{item.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-600 font-bold uppercase">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-emerald-600">{formatCurrency(item.price)}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => toggleAvailability(item)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${item.available ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                              >
                                {item.available ? 'Available' : 'Sold Out'}
                              </button>
                              <button 
                                onClick={() => startEdit(item)}
                                className="p-2 text-stone-400 hover:text-amber-500 transition-colors"
                                title="Edit Item"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Current Order Sidebar */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="bg-white border-l border-stone-200 flex flex-col shadow-2xl z-10 overflow-hidden flex-shrink-0"
            >
              <div className="w-96 flex flex-col h-full">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-stone-900 rounded-xl transition-colors flex items-center justify-center"
                      title="Slide to Hide Current Order Bar"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold">Current Order</h2>
                  </div>
                  <div className="flex items-center gap-2 bg-stone-100 px-3 py-1 rounded-lg">
                    <span className="text-xs font-bold text-stone-400 uppercase">Table</span>
                    <input 
                      type="number" 
                      className="w-10 bg-transparent font-bold text-center focus:outline-none"
                      value={currentOrder.table}
                      onChange={(e) => setCurrentOrder(prev => ({ ...prev, table: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                {/* Member Selection Box in Order Sidebar */}
          <div className="px-6 py-3 bg-amber-50/70 border-b border-amber-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                Member Loyalty
              </span>
              {selectedMember && (
                <button 
                  onClick={detachMemberFromOrder} 
                  className="text-[10px] text-amber-700 hover:underline font-bold"
                >
                  Detach
                </button>
              )}
            </div>

            {selectedMember ? (
              <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex justify-between items-center shadow-xs">
                <div>
                  <p className="font-bold text-sm text-stone-900 leading-tight">{selectedMember.name}</p>
                  <p className="text-[10px] text-stone-500 font-mono">{selectedMember.phone} • {selectedMember.points} pts</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  selectedMember.tier === 'Platinum' ? 'bg-purple-600 text-white' :
                  selectedMember.tier === 'Gold' ? 'bg-amber-500 text-white' :
                  'bg-stone-200 text-stone-700'
                }`}>
                  {selectedMember.tier}
                </span>
              </div>
            ) : (
              <div className="flex gap-2">
                <select 
                  className="flex-1 text-xs p-2 bg-white border border-stone-200 rounded-xl focus:outline-none"
                  value={currentOrder.memberId || ''}
                  onChange={(e) => {
                    const mId = Number(e.target.value);
                    const m = members.find(mem => mem.id === mId);
                    if (m) attachMemberToOrder(m);
                    else detachMemberFromOrder();
                  }}
                >
                  <option value="">-- Select Member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.phone}) - {m.tier} [{m.points} pts]
                    </option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowAddMemberModal(true)}
                  className="p-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600"
                  title="Quick Register Member"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            )}

            {selectedMember && selectedMember.points > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-stone-600 font-medium">Redeem Pts:</span>
                <input 
                  type="number"
                  max={selectedMember.points}
                  min={0}
                  placeholder="Points"
                  value={currentOrder.pointsRedeemed || ''}
                  onChange={(e) => {
                    const val = Math.min(selectedMember.points, Math.max(0, Number(e.target.value)));
                    setCurrentOrder(prev => ({ ...prev, pointsRedeemed: val }));
                  }}
                  className="w-20 p-1 text-xs border border-stone-300 rounded-lg text-center font-mono"
                />
                <span className="text-[10px] text-emerald-600 font-bold">(-{formatCurrency(currentOrder.pointsRedeemed || 0)})</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {currentOrder.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-300 space-y-4">
                <ClipboardList className="w-16 h-16" />
                <p className="font-bold">No items selected</p>
              </div>
            ) : (
              currentOrder.items.map(item => (
                <div key={item.item.id} className="flex justify-between items-center group">
                  <div className="flex-1">
                    <h4 className="font-bold leading-tight">{item.item.name}</h4>
                    <p className="text-xs text-stone-400 font-mono">{formatCurrency(item.item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-stone-100 rounded-xl p-1">
                      <button onClick={() => removeFromOrder(item.item.id)} className="p-1 hover:bg-white rounded-lg transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => addToOrder(item.item)} className="p-1 hover:bg-white rounded-lg transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="w-20 text-right font-mono font-bold text-sm">
                      {formatCurrency(item.item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-6 py-3 border-t border-stone-100">
            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Special Requests / Notes</label>
            <textarea 
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-16 resize-none"
              placeholder="Add notes (e.g., extra spicy, no ice...)"
              value={currentOrder.notes}
              onChange={(e) => setCurrentOrder(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="px-6 py-3 border-t border-stone-100">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-stone-400 uppercase">Discount</label>
              <div className="flex bg-stone-100 p-1 rounded-lg">
                <button 
                  onClick={() => setCurrentOrder(prev => ({ ...prev, discountType: 'percentage' }))}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${currentOrder.discountType === 'percentage' ? 'bg-white shadow-sm text-emerald-600' : 'text-stone-400'}`}
                >
                  %
                </button>
                <button 
                  onClick={() => setCurrentOrder(prev => ({ ...prev, discountType: 'fixed' }))}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${currentOrder.discountType === 'fixed' ? 'bg-white shadow-sm text-emerald-600' : 'text-stone-400'}`}
                >
                  THB ฿
                </button>
              </div>
            </div>
            <div className="relative">
              <input 
                type="number"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                placeholder={currentOrder.discountType === 'percentage' ? "Enter % (e.g., 10)" : "Enter amount in THB"}
                value={currentOrder.discountValue || ''}
                onChange={(e) => setCurrentOrder(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">
                {currentOrder.discountType === 'percentage' ? '%' : 'THB ฿'}
              </span>
            </div>
          </div>

          <div className="p-6 bg-stone-50 space-y-2 border-t border-stone-200">
            <div className="flex justify-between text-sm text-stone-500">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-500 font-medium">
                <span>Discount ({currentOrder.discountType === 'percentage' ? `${currentOrder.discountValue}%` : 'Fixed'})</span>
                <span className="font-mono">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {pointsDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-amber-600 font-medium">
                <span>Points Redeemed ({currentOrder.pointsRedeemed} pts)</span>
                <span className="font-mono">-{formatCurrency(pointsDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-stone-500">
              <span>Tax (10%)</span>
              <span className="font-mono">{formatCurrency(tax)}</span>
            </div>

            {selectedMember && (
              <div className="flex justify-between text-xs text-emerald-600 font-bold pt-1 border-t border-stone-200/60">
                <span>Points Earned on Checkout:</span>
                <span>+{pointsEarnedPreview} pts</span>
              </div>
            )}

            <div className="flex justify-between text-xl font-bold pt-2 border-t border-stone-200">
              <span>Total Amount</span>
              <span className="font-mono text-emerald-600">{formatCurrency(total)}</span>
            </div>

            <button 
              onClick={submitOrder}
              disabled={currentOrder.items.length === 0}
              className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold text-lg mt-3 shadow-lg hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              Place Order
            </button>
          </div>
        </div>
      </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Toggle Button when Sidebar is Hidden */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0, x: 50 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.8, opacity: 0, x: 50 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed right-6 bottom-6 z-40 bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-stone-700 hover:bg-stone-800 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
            title="Open Current Order Panel"
          >
            <div className="relative">
              <ShoppingBag className="w-6 h-6 text-emerald-400" />
              {currentOrder.items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-stone-900 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {currentOrder.items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
            <div className="text-left pr-1">
              <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Current Order</p>
              <p className="font-mono font-bold text-sm text-emerald-400">{formatCurrency(total)}</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-stone-400 group-hover:-translate-x-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">Confirm Order</h3>
                <button onClick={() => setShowConfirmOrder(false)} className="p-2 hover:bg-stone-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-stone-100">
                  <span className="text-stone-400 font-bold uppercase text-xs tracking-widest">Table Number</span>
                  <span className="text-2xl font-bold bg-stone-100 px-4 py-1 rounded-xl">{currentOrder.table}</span>
                </div>

                {selectedMember && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-amber-700 uppercase">Attached Member</p>
                      <p className="text-sm font-bold text-stone-900">{selectedMember.name}</p>
                    </div>
                    <span className="text-xs bg-amber-500 text-white font-bold px-2.5 py-0.5 rounded-full">
                      +{pointsEarnedPreview} Pts
                    </span>
                  </div>
                )}

                <div className="space-y-3 max-h-52 overflow-y-auto pr-2">
                  {currentOrder.items.map(item => (
                    <div key={item.item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-bold">{item.item.name}</p>
                        <p className="text-xs text-stone-400">{item.quantity} x {formatCurrency(item.item.price)}</p>
                      </div>
                      <span className="font-mono font-bold">{formatCurrency(item.item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {currentOrder.notes && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Notes</p>
                    <p className="text-sm italic text-stone-700">{currentOrder.notes}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-stone-100 space-y-2">
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-500 font-medium">
                      <span>Discount ({currentOrder.discountType === 'percentage' ? `${currentOrder.discountValue}%` : 'Fixed'})</span>
                      <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {pointsDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm text-amber-600 font-medium">
                      <span>Points Redeemed ({currentOrder.pointsRedeemed} pts)</span>
                      <span className="font-mono">-{formatCurrency(pointsDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Tax (10%)</span>
                    <span className="font-mono">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-stone-200">
                    <span>Total Amount</span>
                    <span className="font-mono text-emerald-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowConfirmOrder(false)}
                    className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={confirmAndSubmitOrder}
                    className="flex-[2] bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    Confirm & Place
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Receipt Modal */}
        {showReceipt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">Receipt</h3>
                <button onClick={() => setShowReceipt(null)} className="p-2 hover:bg-stone-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto font-mono text-sm">
                <div className="text-center space-y-2 flex flex-col items-center">
                  <NiksenLogo variant="blue" size="md" />
                  <p className="text-stone-500 text-xs">Sukhumvit Soi 11 • Bangkok, Thailand</p>
                </div>
                
                <div className="border-y border-dashed border-stone-200 py-4 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span>#{showReceipt.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table:</span>
                    <span>{showReceipt.table_number}</span>
                  </div>
                  {showReceipt.member_name && (
                    <div className="flex justify-between font-bold text-amber-700">
                      <span>VIP Member:</span>
                      <span>{showReceipt.member_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(showReceipt.paid_at || showReceipt.created_at).toLocaleString()}</span>
                  </div>
                  {showReceipt.notes && (
                    <div className="flex justify-between text-amber-600 italic">
                      <span>Note:</span>
                      <span>{showReceipt.notes}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {showReceipt.items?.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <div className="flex-1">
                        <p>{item.name}</p>
                        <p className="text-xs text-stone-400">{item.quantity} x {formatCurrency(item.price_at_time)}</p>
                      </div>
                      <span className="font-bold">{formatCurrency(item.quantity * item.price_at_time)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-stone-200 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(showReceipt.items?.reduce((s, i) => s + (i.quantity * i.price_at_time), 0) || 0)}</span>
                  </div>
                  {showReceipt.discount_value && showReceipt.discount_value > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount ({showReceipt.discount_type === 'percentage' ? `${showReceipt.discount_value}%` : 'Fixed'})</span>
                      <span>-{formatCurrency(
                        showReceipt.discount_type === 'percentage'
                          ? ((showReceipt.items?.reduce((s, i) => s + (i.quantity * i.price_at_time), 0) || 0) * showReceipt.discount_value / 100)
                          : showReceipt.discount_value
                      )}</span>
                    </div>
                  )}
                  {showReceipt.points_redeemed && showReceipt.points_redeemed > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Points Discount ({showReceipt.points_redeemed} pts)</span>
                      <span>-{formatCurrency(showReceipt.points_redeemed)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax (10%)</span>
                    <span>{formatCurrency(
                      Math.max(0, (showReceipt.items?.reduce((s, i) => s + (i.quantity * i.price_at_time), 0) || 0) - (
                        showReceipt.discount_type === 'percentage'
                          ? ((showReceipt.items?.reduce((s, i) => s + (i.quantity * i.price_at_time), 0) || 0) * showReceipt.discount_value / 100)
                          : (showReceipt.discount_value || 0)
                      ) - (showReceipt.points_redeemed || 0)) * 0.1
                    )}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-stone-200">
                    <span>TOTAL</span>
                    <span>{formatCurrency(calculateOrderTotal(showReceipt))}</span>
                  </div>

                  {showReceipt.points_earned && showReceipt.points_earned > 0 && (
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-center font-bold text-emerald-700 mt-2">
                      + Earned {showReceipt.points_earned} Loyalty Points!
                    </div>
                  )}
                </div>

                <div className="text-center pt-2 space-y-2">
                  <p className="font-sans font-bold">Khob Khun Krap / Thank you!</p>
                  <p className="text-xs text-stone-400 italic">Please visit Niksen Bar again</p>
                </div>

                {/* PromptPay QR Code Payment Box */}
                <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl text-center space-y-3 shadow-inner font-sans my-4 border border-stone-800">
                  <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    PromptPay THB QR Payment
                  </div>
                  
                  <div className="bg-white p-3.5 rounded-2xl inline-block shadow-md mx-auto border border-stone-200">
                    <QRCodeSVG 
                      value={`00020101021230480016A000000677010111011300668123456785802TH5303764540${calculateOrderTotal(showReceipt).toFixed(2)}6304`}
                      size={145}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-stone-300 font-mono">Scan with any Thai Mobile Banking App to Pay</p>
                    <p className="text-emerald-400 font-mono font-bold text-xl">
                      {formatCurrency(calculateOrderTotal(showReceipt))}
                    </p>
                    <p className="text-[10px] text-stone-400">PromptPay ID: 081-234-5678 • Niksen Bar Bangkok</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-stone-50 border-t border-stone-200">
                <button 
                  onClick={() => window.print()}
                  className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  <Receipt className="w-5 h-5" />
                  Print Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Register Member Modal */}
        {showAddMemberModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  Register VIP Member
                </h3>
                <button onClick={() => setShowAddMemberModal(false)} className="p-2 hover:bg-stone-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleRegisterMember} className="p-8 space-y-4">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800 font-medium">
                  🎉 New members receive <span className="font-bold">50 Welcome Points</span> automatically!
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ananda Everingham"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="e.g. 0812345678"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    placeholder="e.g. member@niksenbar.com"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="flex-1 bg-stone-100 text-stone-600 py-3.5 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-emerald-500 text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    Create Membership
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Member Details Modal */}
        {memberDetailsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="text-xl font-bold">{memberDetailsModal.name}</h3>
                    <p className="text-xs text-stone-400">{memberDetailsModal.phone}</p>
                  </div>
                </div>
                <button onClick={() => setMemberDetailsModal(null)} className="p-2 hover:bg-stone-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-3 bg-stone-50 p-4 rounded-2xl text-center border border-stone-200">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-stone-400">Tier</p>
                    <span className="text-sm font-bold text-amber-600 uppercase">{memberDetailsModal.tier}</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-stone-400">Points</p>
                    <span className="text-sm font-bold text-emerald-600 font-mono">{memberDetailsModal.points} pts</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-stone-400">Lifetime Spent</p>
                    <span className="text-sm font-bold text-stone-800 font-mono">{formatCurrency(memberDetailsModal.total_spent)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-stone-900 mb-3">Order History</h4>
                  {memberDetailsModal.orders && memberDetailsModal.orders.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {memberDetailsModal.orders.map(o => (
                        <div key={o.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold">Order #{o.id} • Table {o.table_number}</p>
                            <p className="text-stone-400 text-[10px]">{new Date(o.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className="font-mono font-bold text-emerald-600">{formatCurrency(o.total || 0)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 italic">No previous orders recorded yet.</p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => {
                      attachMemberToOrder(memberDetailsModal);
                      setMemberDetailsModal(null);
                    }}
                    className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-emerald-600 transition-all"
                  >
                    Select Member For Current Order
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
