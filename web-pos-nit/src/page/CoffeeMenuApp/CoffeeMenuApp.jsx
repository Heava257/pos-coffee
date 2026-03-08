import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Menu, Search, ShoppingCart, Plus, Minus, X,
  Home, FileText, Star, User, ChevronLeft, LogOut, Settings, History, Globe
} from 'lucide-react';
import { request } from '../../util/helper';
import { Config } from '../../util/config';
import { getProfile, setLogout } from '../../store/profile.store';
import { message, Modal, Badge, Empty, Button } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- SHARED COMPONENTS ---

const MainWrapper = ({ children, bgClass = "bg-[#F8F9FA]" }) => (
  <div className={cn("min-h-screen font-sans antialiased text-[#2D3436]", bgClass)}>
    <div className="max-w-[1280px] mx-auto min-h-screen relative flex flex-col bg-white shadow-sm overflow-hidden md:rounded-3xl md:my-6 md:min-h-[calc(100vh-48px)]">
      <div className="w-full h-full relative flex flex-col overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .premium-modal .ant-modal-content { border-radius: 24px !important; padding: 0 !important; overflow: hidden; }
      .premium-modal .ant-modal-header { padding: 20px 24px; border-bottom: 1px solid #F1F2F6; margin: 0; }
      .premium-modal .ant-modal-body { padding: 24px; }
    `}</style>
  </div>
);

const SplashView = ({ businessName }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center"
    >
      <div className="w-20 h-20 bg-[#1A3C28] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#1A3C28]/20">
        <ShoppingCart size={36} color="white" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#1A3C28]">
        {businessName || "MINGLY COFFEE"}
      </h1>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
            className="w-1.5 h-1.5 bg-[#1A3C28]/20 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  </div>
);


// --- VIEW COMPONENTS ---

const ProductCard = ({ item, isStarred, onToggleStar, onClick }) => (
  <div
    className="group bg-white rounded-2xl border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-gray-100/50 transition-all p-3 cursor-pointer relative"
    onClick={onClick}
  >
    <div className="relative aspect-square rounded-xl bg-gray-50 overflow-hidden mb-4 shadow-sm">
      {item.image ? (
        <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-3xl">☕</div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStar(item); }}
        className={cn(
          "absolute top-2 left-2 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md transition-all",
          isStarred ? "bg-amber-400 text-white" : "bg-white/80 text-gray-400 hover:bg-white hover:text-amber-400"
        )}
      >
        <Star size={16} fill={isStarred ? "currentColor" : "none"} strokeWidth={2.5} />
      </button>
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-gray-100">
        <Star size={12} className="fill-amber-500 text-amber-500" />
        <span className="text-[10px] font-bold">4.9</span>
      </div>
    </div>
    <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{item.name}</h4>
    <p className="text-[10px] text-gray-400 mb-3 line-clamp-1">Freshly brewed coffee...</p>
    <div className="flex justify-between items-center">
      <span className="font-extrabold text-[#1A3C28]">${parseFloat(item.price).toFixed(2)}</span>
      <button className="w-8 h-8 flex items-center justify-center bg-[#1A3C28] text-white rounded-lg shadow-lg shadow-[#1A3C28]/20 hover:scale-110 active:scale-95 transition-all">
        <Plus size={16} strokeWidth={3} />
      </button>
    </div>
  </div>
);

const HomeView = ({
  selectedShop, categories, currentCategory, setCurrentCategory,
  menuItems, cart, setIsCartOpen, searchText, setSearchText,
  setOptionsModalItem, starredItems, onToggleStar
}) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col px-6 pb-24 pt-8">
    <div className="flex justify-between items-center mb-8">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Welcome to</p>
        <h1 className="text-2xl font-extrabold text-[#1A3C28]">{selectedShop?.business_name || "Mingly Coffee"}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-600" />
        </button>
      </div>
    </div>

    <div className="relative mb-8">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="text" placeholder="Search for coffee, snacks..."
        className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#1A3C28]/10 transition-all"
        value={searchText} onChange={(e) => setSearchText(e.target.value)}
      />
    </div>

    <div className="relative bg-[#1A3C28] rounded-3xl p-8 text-white overflow-hidden mb-10 shadow-lg shadow-[#1A3C28]/10">
      <div className="relative z-10 max-w-[65%]">
        <h2 className="text-xl font-bold mb-2 leading-tight">Get 20% discount on your first order!</h2>
        <p className="text-xs text-white/60 mb-6">Enjoy premium coffee brewed from the finest beans.</p>
        <button className="bg-white text-[#1A3C28] px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-black/10">Order Now</button>
      </div>
      <img src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300&auto=format&fit=crop"
        className="absolute -right-8 -bottom-8 w-44 h-44 object-cover rounded-full border-8 border-white/10 rotate-12" alt="Coffee" />
    </div>

    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Categories</h3>
        <button onClick={() => setCurrentCategory(null)} className="text-sm font-bold text-[#1A3C28]">View all</button>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
        {[{ id: null, name: 'All' }, ...categories].map((cat) => (
          <button
            key={cat.id} onClick={() => setCurrentCategory(cat)}
            className={cn("px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
              currentCategory?.id === cat.id ? "bg-[#1A3C28] text-white shadow-md shadow-[#1A3C28]/20" : "bg-gray-50 text-gray-500")}
          >{cat.name}</button>
        ))}
      </div>
    </div>

    <h3 className="text-lg font-bold text-gray-800 mb-6 font-sans">{searchText ? "Search Results" : "Most Popular"}</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {menuItems
        .filter(i => !searchText || i.name.toLowerCase().includes(searchText.toLowerCase()))
        .map((item) => (
          <ProductCard
            key={item.id} item={item}
            isStarred={starredItems.some(s => s.id === item.id)}
            onToggleStar={onToggleStar}
            onClick={() => setOptionsModalItem(item)}
          />
        ))}
    </div>
  </motion.div>
);

const StarredView = ({ starredItems, onToggleStar, setOptionsModalItem }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col px-6 pb-24 pt-8">
    <h1 className="text-2xl font-extrabold text-[#1A3C28] mb-2">My Starred</h1>
    <p className="text-xs text-gray-400 font-bold mb-8 uppercase tracking-widest">Your favorite collections ({starredItems.length})</p>

    {starredItems.length === 0 ? (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <Star size={32} className="text-gray-200" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 mb-2">No Starred Items Yet</h3>
        <p className="text-sm text-gray-400">Items you mark as favorite will appear here for quick access next time!</p>
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {starredItems.map((item) => (
          <ProductCard
            key={item.id} item={item} isStarred={true}
            onToggleStar={onToggleStar} onClick={() => setOptionsModalItem(item)}
          />
        ))}
      </div>
    )}
  </motion.div>
);

// --- SUB-VIEWS ---

const HistoryView = ({ history, onBack }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col px-6 pb-32 pt-12 max-w-[800px] mx-auto w-full">
    <div className="flex items-center gap-4 mb-8">
      <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full"><ChevronLeft size={20} /></button>
      <h1 className="text-2xl font-extrabold text-[#1A3C28]">Order History</h1>
    </div>

    {history.length === 0 ? (
      <Empty description="No orders found" className="mt-20" />
    ) : (
      <div className="space-y-4">
        {history.map((order) => (
          <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order #{order.order_no || order.id}</p>
                <p className="text-xs font-bold text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <Badge status={order.status === 'completed' ? 'success' : 'processing'} text={<span className="text-[10px] font-black uppercase ml-1">{order.status}</span>} />
            </div>
            <div className="py-3 border-y border-dashed border-gray-100 mb-3">
              <p className="text-sm font-bold text-gray-700">{order.product_names || 'Items'}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400">{order.total_quantity || 0} items</span>
              <span className="text-lg font-black text-[#1A3C28]">${parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </motion.div>
);

const SettingsView = ({ onBack }) => {
  const [notif, setNotif] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col px-6 pb-32 pt-12 max-w-[800px] mx-auto w-full">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full"><ChevronLeft size={20} /></button>
        <h1 className="text-2xl font-extrabold text-[#1A3C28]">App Settings</h1>
      </div>

      <div className="space-y-4">
        {[
          { label: 'Push Notifications', desc: 'Get updates on your order status', value: notif, set: setNotif },
          { label: 'Dark Mode', desc: 'Reduce eye strain in low light', value: darkMode, set: setDarkMode },
        ].map((item, i) => (
          <div key={i} className="flex justify-between items-center p-6 bg-white border border-gray-100 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-gray-800">{item.label}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.desc}</p>
            </div>
            <div
              onClick={() => item.set(!item.value)}
              className={cn("w-12 h-6 rounded-full transition-all cursor-pointer relative p-1", item.value ? "bg-[#1A3C28]" : "bg-gray-200")}
            >
              <div className={cn("w-4 h-4 bg-white rounded-full transition-all", item.value ? "translate-x-6" : "translate-x-0")}></div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const ProfileView = ({ selectedShop, selectedTable, setActiveTab, setSubView, onFetchHistory }) => {
  const profile = getProfile();
  const navigate = useNavigate();

  const handleLogout = () => {
    Modal.confirm({
      title: 'Sign Out', content: 'Are you sure you want to sign out?',
      okText: 'Sign Out', okType: 'danger', cancelText: 'Cancel', centered: true,
      onOk: () => { setLogout(); navigate("/login"); }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center px-6 pb-32 pt-12 max-w-[800px] mx-auto w-full"
    >
      <div className="w-full mb-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-[#1A3C28] tracking-tight">My Profile</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Manage your account and preferences</p>
      </div>

      <div className="w-full bg-white rounded-[32px] p-8 flex flex-col items-center mb-10 border border-gray-100 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#1A3C28] to-[#2D5A41] opacity-[0.03] transition-opacity"></div>
        <div className="relative">
          <div className="w-24 h-24 bg-[#1A3C28] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-2xl shadow-[#1A3C28]/30 uppercase border-4 border-white">
            {profile?.firstname?.charAt(0) || "G"}
          </div>
          <div className="absolute bottom-6 right-0 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
        </div>
        <h3 className="text-xl font-extrabold text-gray-800 mb-1">{profile?.firstname ? `${profile.firstname} ${profile.lastname || ''}` : "Guest User"}</h3>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">{profile ? 'Registered Customer' : 'Limited Access'}</p>
        <div className="flex gap-3">
          <div className="px-5 py-2 bg-[#faf9f5] rounded-2xl text-[11px] font-black border border-gray-100 text-[#1A3C28] uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#1A3C28] rounded-full"></div> TABLE {selectedTable || 'N/A'}
          </div>
          <div className="px-5 py-2 bg-[#faf9f5] rounded-2xl text-[11px] font-black border border-gray-100 text-[#1A3C28] uppercase tracking-wider">{selectedShop?.business_name || 'Mingly'}</div>
        </div>
        {!profile && (
          <button onClick={() => navigate("/login")} className="mt-8 px-8 py-3 bg-[#1A3C28] text-white rounded-xl text-xs font-black shadow-lg shadow-[#1A3C28]/20 transition-all">SIGN IN FOR FULL ACCESS</button>
        )}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: History, label: 'Order History', color: 'text-blue-500', bg: 'bg-blue-50', action: () => { onFetchHistory(); setSubView('history'); } },
          { icon: Star, label: 'My Favorites', color: 'text-amber-500', bg: 'bg-amber-50', action: () => setActiveTab('starred') },
          { icon: Globe, label: 'Language', color: 'text-purple-500', bg: 'bg-purple-50', action: () => Modal.info({ title: 'Select Language', content: 'Language selection coming soon!', centered: true }) },
          { icon: Settings, label: 'App Settings', color: 'text-gray-500', bg: 'bg-gray-100', action: () => setSubView('settings') },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="flex justify-between items-center p-6 bg-white border border-gray-50 rounded-[24px] hover:border-gray-200 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", item.bg)}>
                <item.icon size={22} className={item.color} />
              </div>
              <div className="text-left">
                <span className="text-sm font-extrabold text-gray-700 block">{item.label}</span>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">View or change</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {profile && (
        <button onClick={handleLogout} className="w-full mt-10 flex items-center justify-center gap-3 p-6 border-2 border-red-50 rounded-[24px] text-red-500 font-extrabold text-sm hover:bg-red-50 transition-all">
          <LogOut size={20} /> SIGN OUT
        </button>
      )}
    </motion.div>
  );
};

const CategoryView = ({ currentCategory, setCurrentCategory, menuItems, searchText, setSearchText, setOptionsModalItem, starredItems, onToggleStar }) => {
  const filtered = menuItems.filter(i => (currentCategory.id === null || i.category_id === currentCategory.id) && (!searchText || i.name.toLowerCase().includes(searchText.toLowerCase())));
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col px-6 pb-24 pt-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setCurrentCategory(null)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold text-[#1A3C28]">{currentCategory.name}</h1>
      </div>
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder={`Search in ${currentCategory.name}...`} className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#1A3C28]/10 transition-all font-sans" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((item) => (
          <ProductCard
            key={item.id} item={item} onToggleStar={onToggleStar}
            isStarred={starredItems.some(s => s.id === item.id)}
            onClick={() => setOptionsModalItem(item)}
          />
        ))}
      </div>
    </motion.div>
  );
};

// --- MAIN APPLICATION ---

const CoffeeMenuApp = () => {
  const [selectedShop, setSelectedShop] = useState(() => JSON.parse(localStorage.getItem('coffee_pos_shop')));
  const [selectedTable, setSelectedTable] = useState(() => localStorage.getItem('coffee_pos_table'));
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('coffee_pos_cart')) || []);
  const [starredItems, setStarredItems] = useState(() => JSON.parse(localStorage.getItem('coffee_pos_starred')) || []);

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSizes, setProductSizes] = useState({});
  const [splash, setSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [optionsModalItem, setOptionsModalItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileSubView, setProfileSubView] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [optionQty, setOptionQty] = useState(1);
  const [selectedTemp, setSelectedTemp] = useState('Iced');
  const [selectedSugar, setSelectedSugar] = useState('100%');

  useEffect(() => { if (!optionsModalItem) { setOptionQty(1); setSelectedTemp('Iced'); setSelectedSugar('100%'); } }, [optionsModalItem]);

  const isDrink = useMemo(() => {
    if (!optionsModalItem) return false;
    const cat = categories.find(c => c.id === optionsModalItem.category_id);
    if (!cat) return false;
    const name = cat.name.toLowerCase();
    return name.includes('coffee') || name.includes('juice') || name.includes('milk') || name.includes('drink') || name.includes('tea');
  }, [optionsModalItem, categories]);


  useEffect(() => {
    localStorage.setItem('coffee_pos_table', selectedTable);
    localStorage.setItem('coffee_pos_shop', JSON.stringify(selectedShop));
    localStorage.setItem('coffee_pos_cart', JSON.stringify(cart));
    localStorage.setItem('coffee_pos_starred', JSON.stringify(starredItems));
  }, [selectedTable, selectedShop, cart, starredItems]);

  useEffect(() => {
    const profile = getProfile();
    const isGuest = localStorage.getItem("is_guest") === "true";
    if (isGuest && profile?.branch_id) {
      setSelectedShop({ id: profile.branch_id, business_id: profile.business_id, name: profile.branch_name, business_name: profile.business_name });
      setSelectedTable(profile.table_no);
      localStorage.removeItem("is_guest");
    }
    setTimeout(() => setSplash(false), 1500);
  }, []);

  useEffect(() => { fetchShopProducts(); }, [selectedShop, currentCategory?.id]);

  const fetchShopProducts = async () => {
    try {
      setLoading(true);
      if (categories.length === 0) {
        const catRes = await request("category", "get");
        if (catRes?.list) setCategories(catRes.list);
      }
      const productRes = await request("product", "get", { branch_id: selectedShop?.id, category_id: currentCategory?.id });
      if (productRes?.list) {
        setMenuItems(productRes.list);
        let sizesMap = {};
        productRes.list.forEach(p => { if (p.sizes) { try { sizesMap[p.id] = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes; } catch (e) { } } });
        setProductSizes(sizesMap);
      }
    } catch { } finally { setLoading(false); }
  };

  const fetchOrderHistory = async () => {
    try {
      const res = await request("order", "get", { user_id: getProfile()?.id });
      if (res?.list) setOrderHistory(res.list);
    } catch (e) { message.error("Failed to fetch history"); }
  };

  const fetchStarredItems = async () => {
    const profile = getProfile();
    if (!profile || (!(profile.id || profile.user_id)) || profile.role_code === "guest") return;
    try {
      const res = await request("favorite", "get");
      if (res?.list) setStarredItems(res.list);
    } catch (e) { console.error("Failed to sync favorites"); }
  };

  useEffect(() => {
    fetchStarredItems();
  }, []);


  const onToggleStar = async (item) => {
    const profile = getProfile();
    const isStarred = starredItems.some(s => s.id === item.id);

    // Optimistic UI update
    if (isStarred) {
      setStarredItems(starredItems.filter(s => s.id !== item.id));
    } else {
      setStarredItems([...starredItems, item]);
    }

    const isAuthenticated = profile && (profile.id || profile.user_id) && profile.role_code !== "guest";

    if (isAuthenticated) {
      try {
        await request("favorite", "post", { product_id: item.id });
        message.success(isStarred ? "Removed from Starred" : "Added to Starred!");
        fetchStarredItems(); // Final sync
      } catch (e) { message.error("Failed to sync Starred"); }
    } else {
      message.info(isStarred ? "Removed from local Starred" : "Added to local Starred!");
    }
  };

  const addToCart = (item, size, qty, note = "") => {
    const price = size ? parseFloat(size.price) : parseFloat(item.price);
    const optionsText = isDrink ? `${selectedTemp}, ${selectedSugar} Sugar` : "";
    const cartId = `${item.id}-${size?.id || 'base'}-${selectedTemp}-${selectedSugar}-${note}`;

    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.cartId === cartId);
      if (existingItem) {
        return prevCart.map(i => i.cartId === cartId
          ? { ...i, quantity: i.quantity + qty, totalPrice: (i.quantity + qty) * price }
          : i
        );
      }
      return [...prevCart, {
        ...item,
        cartId,
        size,
        quantity: qty,
        note,
        totalPrice: price * qty,
        basePrice: price,
        customization: optionsText
      }];
    });

    message.success("Added to cart!");
    setOptionsModalItem(null);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      message.warning("Your basket is empty!");
      return;
    }

    const sub_total = cart.reduce((s, i) => s + (i.totalPrice || 0), 0);
    const orderData = {
      business_id: selectedShop?.business_id,
      branch_id: selectedShop?.id,
      customer_name: "Guest",
      table_no: selectedTable || "",
      sub_total: sub_total,
      total_amount: sub_total,
      payment_method: "Cash",
      order_type: "dine_in",
      cart_items: cart.map(item => ({
        product_id: item.id,
        qty: item.quantity,
        price: item.basePrice,
        note: item.customization || item.note || ""
      })),
      status: "unpaid"
    };

    setLoading(true);
    try {
      const res = await request("order", "post", orderData);
      if (res && res.success) {
        message.success("Order Placed Successfully!");
        setCart([]);
        localStorage.setItem('coffee_pos_cart', JSON.stringify([]));
        setIsCartOpen(false);
        setActiveTab('home');
      } else {
        message.error(res?.message || "Failed to place order.");
      }
    } catch (error) {
      message.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const updateCartQty = (cartId, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, totalPrice: newQty * item.basePrice };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
    message.info("Item removed");
  };

  if (splash) return <SplashView businessName={selectedShop?.business_name} />;

  return (
    <MainWrapper>
      <div className="flex-1 flex flex-col relative min-h-screen">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-gray-100 border-t-[#1A3C28] rounded-full animate-spin"></div>
            </motion.div>
          ) : activeTab === 'profile' ? (
            profileSubView === 'history' ? (
              <HistoryView history={orderHistory} onBack={() => setProfileSubView(null)} />
            ) : profileSubView === 'settings' ? (
              <SettingsView onBack={() => setProfileSubView(null)} />
            ) : (
              <ProfileView selectedShop={selectedShop} selectedTable={selectedTable} setActiveTab={setActiveTab} setSubView={setProfileSubView} onFetchHistory={fetchOrderHistory} />
            )
          ) : activeTab === 'starred' ? (
            <StarredView starredItems={starredItems} onToggleStar={onToggleStar} setOptionsModalItem={setOptionsModalItem} />
          ) : currentCategory ? (
            <CategoryView
              currentCategory={currentCategory} setCurrentCategory={setCurrentCategory}
              menuItems={menuItems} starredItems={starredItems} onToggleStar={onToggleStar}
              searchText={searchText} setSearchText={setSearchText} setOptionsModalItem={setOptionsModalItem}
            />
          ) : (
            <HomeView
              selectedShop={selectedShop} categories={categories} currentCategory={currentCategory} setCurrentCategory={setCurrentCategory}
              menuItems={menuItems} starredItems={starredItems} onToggleStar={onToggleStar}
              cart={cart} setIsCartOpen={setIsCartOpen} searchText={searchText} setSearchText={setSearchText}
              getTotalPrice={() => cart.reduce((sum, item) => sum + (item.totalPrice || 0), 0)} setOptionsModalItem={setOptionsModalItem}
            />
          )}
        </AnimatePresence>

        <div className="fixed bottom-0 md:bottom-8 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-[480px] bg-white/90 backdrop-blur-xl border-t md:border border-gray-100 md:rounded-[32px] px-8 py-4 flex justify-between items-center z-50 md:shadow-2xl shadow-gray-200/50">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'order', icon: FileText, label: 'Order', badge: cart.length },
            { id: 'starred', icon: Star, label: 'Starred' },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map(tab => (
            <button
              key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'order') setIsCartOpen(true); else setCurrentCategory(null); }}
              className={cn("flex flex-col items-center gap-1.5 transition-all", (activeTab === tab.id || (tab.id === 'order' && isCartOpen)) ? "text-[#1A3C28]" : "text-gray-300")}
            >
              <div className="relative">
                <tab.icon size={22} strokeWidth={(activeTab === tab.id || (tab.id === 'order' && isCartOpen)) ? 3 : 2} />
                {tab.badge > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] flex items-center justify-center text-white font-black">{tab.badge}</span>}
              </div>
              <span className="text-[10px] font-bold uppercase">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Modal
        open={!!optionsModalItem}
        onCancel={() => setOptionsModalItem(null)}
        footer={null}
        centered
        width={450}
        className="premium-modal"
        destroyOnClose
      >
        <div className="font-sans">
          <div className="relative h-64 bg-gray-50 overflow-hidden">
            {optionsModalItem?.image ? (
              <img src={Config.getFullImagePath(optionsModalItem.image)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl bg-gray-100">☕</div>
            )}
            <button
              onClick={() => setOptionsModalItem(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-extrabold text-[#1A3C28]">{optionsModalItem?.name}</h2>
              <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Most Loved</span>
            </div>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">Customize your drink to perfection. Select your preferred options below.</p>

            {isDrink && (
              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Temperature</h4>
                  <div className="flex gap-2">
                    {['Hot', 'Iced', 'Frappe'].map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTemp(t)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          selectedTemp === t ? "bg-[#1A3C28] text-white border-[#1A3C28]" : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Sugar Level</h4>
                  <div className="flex flex-wrap gap-2">
                    {['0%', '25%', '50%', '75%', '100%', '120%'].map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSugar(s)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                          selectedSugar === s ? "bg-[#1A3C28] text-white border-[#1A3C28]" : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-50">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Unit Price</span>
                <span className="text-2xl font-black text-[#1A3C28]">${parseFloat(optionsModalItem?.price || 0).toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                <button
                  onClick={() => setOptionQty(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-[#1A3C28] active:scale-90 transition-all"
                >
                  <Minus size={18} strokeWidth={3} />
                </button>
                <span className="text-lg font-bold w-6 text-center">{optionQty}</span>
                <button
                  onClick={() => setOptionQty(prev => prev + 1)}
                  className="w-10 h-10 bg-[#1A3C28] text-white shadow-md shadow-[#1A3C28]/20 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>
            </div>

            <button
              className="w-full h-16 bg-[#1A3C28] text-white rounded-2xl font-black shadow-xl shadow-[#1A3C28]/20 hover:shadow-[#1A3C28]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              onClick={() => addToCart(optionsModalItem, null, optionQty)}
            >
              <ShoppingCart size={20} strokeWidth={2.5} />
              <span>ADD TO BASKET — ${(parseFloat(optionsModalItem?.price || 0) * optionQty).toFixed(2)}</span>
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isCartOpen}
        onCancel={() => { setIsCartOpen(false); setActiveTab('home'); }}
        footer={null}
        centered
        width={500}
        className="premium-modal"
        title={
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#1A3C28] rounded-full"></span>
            <span className="text-base font-black text-gray-800 uppercase tracking-tight">Your Order Checkout</span>
          </div>
        }
      >
        <div className="p-6 font-sans">
          {cart.length === 0 ? (
            <div className="py-12 flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart size={32} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-400">Your basket is empty</h3>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar mb-8">
                {cart.map((item, idx) => (
                  <div key={item.cartId} className="group flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 hover:border-gray-200 transition-all">
                    <div className="flex gap-4 items-center">
                      <div className="relative">
                        <img src={Config.getFullImagePath(item.image)} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                        <span className="absolute -top-1 -right-1 bg-[#1A3C28] text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">{item.name}</h4>
                        {item.customization && <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">{item.customization}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-black text-[#1A3C28]">${(item.basePrice || 0).toFixed(2)}</span>
                          <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg">
                            <button onClick={() => updateCartQty(item.cartId, -1)} className="text-gray-400 hover:text-red-500 transition-colors"><Minus size={12} strokeWidth={3} /></button>
                            <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.cartId, 1)} className="text-gray-400 hover:text-[#1A3C28] transition-colors"><Plus size={12} strokeWidth={3} /></button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="font-black text-gray-800 text-sm">${(item.totalPrice || 0).toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#1A3C28]/[0.02] p-6 rounded-3xl border border-dashed border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-bold text-gray-600">${(cart.reduce((s, i) => s + (i.totalPrice || 0), 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Service Fee</span>
                  <span className="text-sm font-bold text-green-600 uppercase">Free</span>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                  <span className="text-sm font-black text-[#1A3C28]">GRAND TOTAL</span>
                  <span className="text-3xl font-black text-[#1A3C28]">${(cart.reduce((s, i) => s + (i.totalPrice || 0), 0)).toFixed(2)}</span>
                </div>
              </div>

              <button
                className={cn(
                  "w-full mt-8 h-14 bg-[#1A3C28] text-white rounded-2xl font-black shadow-xl shadow-[#1A3C28]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3",
                  loading && "opacity-70 cursor-not-allowed"
                )}
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? "PLACING ORDER..." : "PLACE ORDER NOW ☕"}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </MainWrapper>
  );
};

export default CoffeeMenuApp;
