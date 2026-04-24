import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Menu, Search, ShoppingCart, Plus, Minus, X,
  Home, FileText, Star, User, ChevronLeft, LogOut, Settings, History, Globe,
  Clock, DollarSign, Coffee, Flame, CheckCircle2, Smile
} from 'lucide-react';
import { request } from '../../util/helper';
import { Config } from '../../util/config';
import { getProfile, setLogout, getGuestProfile } from '../../store/profile.store';
import { message, Modal, Badge, Empty, Button, Spin } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLanguage, translations } from '../../store/language.store';
import logo from '../../assets/logo.png';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- SHARED COMPONENTS ---

const MainWrapper = ({ children, bgClass = "bg-[#FDFBF7]", isMobile }) => (
  <div className={cn("min-h-screen font-sans antialiased text-[#2D3436] transition-all duration-500", bgClass)}>
    <div className={cn(
      "relative flex flex-col bg-white overflow-hidden transition-all duration-700 w-full min-h-screen",
      !isMobile && "border-none shadow-none"
    )}>
      <div className="w-full h-full relative flex flex-col overflow-y-auto no-scrollbar scroll-smooth">
        {children}
      </div>
    </div>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap');
      :root {
        --primary: #00B761;
        --secondary: #2D3436;
        --accent: #E8F5E9;
        --cream: #FDFBF7;
        --sage: #F1F8F1;
      }
      .font-outfit { font-family: 'Outfit', sans-serif; }
      .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .premium-modal .ant-modal-content { border-radius: 40px !important; padding: 0 !important; overflow: hidden; background: #FFFEFD; border: 1px solid rgba(0,0,0,0.03); }
      .glass-effect { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.5); }
      .green-gradient { background: linear-gradient(135deg, #00B761 0%, #009650 100%); }
      .shadow-soft { box-shadow: 0 20px 40px -15px rgba(0, 183, 97, 0.15); }
      .active-green { background: #00B761 !important; color: white !important; border-color: #00B761 !important; }
      .card-glow:hover { box-shadow: 0 15px 30px -10px rgba(0, 183, 97, 0.12); }
      .gold-glow { box-shadow: 0 10px 20px -5px rgba(212, 175, 55, 0.2); }
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
      <div className="w-20 h-20 bg-[#00B761] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#00B761]/20">
        <ShoppingCart size={36} color="white" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#00B761]">
        {businessName || "MINGLY COFFEE"}
      </h1>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
            className="w-1.5 h-1.5 bg-[#00B761]/20 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  </div>
);


// --- VIEW COMPONENTS ---

const ProductCard = ({ item, isStarred, onToggleStar, onClick, isMobile, businessConfig }) => {
  const discountPercent = businessConfig?.global_discount || 0;
  const originalPrice = parseFloat(item.price);
  const finalPrice = discountPercent > 0 ? originalPrice * (1 - discountPercent / 100) : originalPrice;

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white group relative flex flex-col p-3 rounded-[32px] border border-gray-100/60 hover:border-[#00B761]/20 transition-all duration-500 card-glow shadow-sm"
      onClick={onClick}
    >
      {/* Favorite Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleStar(item); }}
        className={cn(
          "absolute top-5 right-5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          isStarred ? "bg-[#00B761] text-white" : "bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500 shadow-sm"
        )}
      >
        <Star size={14} fill={isStarred ? "currentColor" : "none"} strokeWidth={3} />
      </button>

      {/* Product Image */}
      <div className="aspect-[4/5] rounded-[24px] bg-[#FAFAFA] overflow-hidden mb-4 relative">
        {item.image ? (
          <img 
            src={Config.optimizeCloudinary(Config.getFullImagePath(item.image), "w_400,c_fill,f_auto,q_auto")} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-[#F5F7F5]">☕</div>
        )}
        {discountPercent > 0 && (
          <div className="absolute bottom-3 left-3 bg-[#00B761] text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg">
            -{discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-2 pb-2">
        <h4 className="text-[14px] font-bold text-gray-800 line-clamp-1 mb-1 font-outfit tracking-tight group-hover:text-[#00B761] transition-colors">{item.name}</h4>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[15px] font-black text-[#00B761]">${finalPrice.toFixed(2)}</span>
            {discountPercent > 0 && (
              <span className="text-[10px] text-gray-300 line-through font-bold">${originalPrice.toFixed(2)}</span>
            )}
          </div>
          <div className="w-8 h-8 bg-[#00B761]/5 text-[#00B761] rounded-xl flex items-center justify-center group-hover:bg-[#00B761] group-hover:text-white transition-all duration-500 shadow-sm">
             <Plus size={16} strokeWidth={3} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const getIconForCategory = (name) => {
  const n = name.toLowerCase();
  if (n.includes('coffee')) return '☕';
  if (n.includes('tea')) return '🍵';
  if (n.includes('food') || n.includes('bakery')) return '🥐';
  return '🍽️';
};

const TopSellerCard = ({ item, onClick, businessConfig }) => {
  const discountPercent = businessConfig?.global_discount || 0;
  const originalPrice = parseFloat(item.price);
  const finalPrice = discountPercent > 0 ? originalPrice * (1 - discountPercent / 100) : originalPrice;

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className="relative w-64 h-44 rounded-[32px] overflow-hidden flex-shrink-0 cursor-pointer shadow-lg group"
      onClick={onClick}
    >
      <img src={Config.optimizeCloudinary(Config.getFullImagePath(item.image), "w_500,c_fill,f_auto,q_auto")} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-5 left-5 right-5">
        <h4 className="text-white font-outfit font-black text-lg mb-0.5 truncate">{item.name}</h4>
        <div className="flex items-center gap-2">
          <span className="text-[#00B761] font-black text-base">${finalPrice.toFixed(2)}</span>
          {discountPercent > 0 && (
            <span className="text-white/40 font-bold text-xs line-through">${originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const HomeView = ({ selectedShop, categories, currentCategory, setCurrentCategory, menuItems, starredItems, onToggleStar, searchText, setSearchText, setOptionsModalItem, isMobile, businessConfig }) => {
  const { lang } = useLanguage();
  const t = translations[lang] || translations.en;
  const profile = getProfile();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col pb-40 bg-[#FAFAFA]">
      {/* Sticky Premium Header */}
      <div className="sticky top-0 z-[60] glass-effect px-6 py-4 mb-4 border-b border-gray-100/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#00B761] to-[#00D16B] rounded-[16px] blur opacity-25"></div>
              <div className="relative w-10 h-10 rounded-[14px] bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-50">
                {selectedShop?.image ? (
                  <img src={Config.optimizeCloudinary(Config.getFullImagePath(selectedShop.image), "w_100,c_fill,f_auto,q_auto")} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00B761] to-[#009650] text-white font-black text-lg">C</div>
                )}
              </div>
            </div>
            <div>
              <p className="text-[8px] font-black text-[#00B761]/60 uppercase tracking-[0.15em] mb-0">{t.premium_experience || "Premium Experience"}</p>
              <h1 className="text-sm font-outfit font-black text-gray-800 leading-tight">{t.hi || "Hi"}, {profile?.firstname || t.guest || "Guest"}!</h1>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="relative w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-[#00B761]"
          >
            <Bell size={18} strokeWidth={2.5} />
            <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
          </motion.button>
        </div>
      </div>

      <div className="px-6">

        {/* Search Bar - Modern Design */}
        <div className="relative mb-8">
          <div className="relative flex items-center bg-gray-50/50 border border-gray-100/50 rounded-2xl h-12 px-4 focus-within:bg-white focus-within:border-[#00B761]/30 transition-all duration-300">
            <Search className="text-gray-300" size={16} strokeWidth={3} />
            <input
              type="text" placeholder={t.search_product || "Search your favorite..."}
              className="flex-1 h-full bg-transparent border-none px-3 text-[13px] font-bold text-gray-800 placeholder:text-gray-300 focus:ring-0"
              value={searchText} onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 px-1">
             <h3 className="text-lg font-black text-gray-800 font-outfit tracking-tight">Categories</h3>
             <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Swipe for more</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentCategory(null)}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-[32px] min-w-[85px] transition-all duration-500",
                !currentCategory ? "bg-[#00B761] text-white shadow-lg shadow-[#00B761]/20" : "bg-white border border-gray-50 text-gray-400 hover:border-[#00B761]/20"
              )}
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", !currentCategory ? "bg-white/20" : "bg-[#F5F7F5]")}>
                <Menu size={20} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">All</span>
            </motion.button>

            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentCategory(cat)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-[32px] min-w-[85px] transition-all duration-500",
                  currentCategory?.id === cat.id ? "bg-[#00B761] text-white shadow-lg shadow-[#00B761]/20" : "bg-white border border-gray-50 text-gray-400 hover:border-[#00B761]/20"
                )}
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors", currentCategory?.id === cat.id ? "bg-white/20" : "bg-[#F5F7F5]")}>
                  {getIconForCategory(cat.name)}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider line-clamp-1">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Featured Items / Recommendations */}
        <div className="mb-10">
           <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-xl font-black text-gray-800 font-outfit tracking-tight">Our Favorites</h3>
              <div className="flex items-center gap-2 text-[10px] font-black text-[#00B761] uppercase tracking-widest bg-[#00B761]/5 px-4 py-2 rounded-full">
                 <Flame size={12} strokeWidth={3} />
                 Trending
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              {(menuItems || []).slice(0, 4).map((item) => (
                <ProductCard
                  key={item.id} item={item} onToggleStar={onToggleStar}
                  isStarred={starredItems.some(s => s.id === item.id)}
                  onClick={() => setOptionsModalItem(item)}
                  isMobile={isMobile}
                  businessConfig={businessConfig}
                />
              ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
};




const NavBar = ({ activeTab, setActiveTab, cartCount, setIsCartOpen, isMobile }) => {
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;

  const tabs = [
    { id: 'home', icon: Home, label: 'Menu' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'status', icon: Clock, label: 'Status' },
    { id: 'profile', icon: User, label: 'Account' },
  ];

  const toggleLang = () => {
    setLang(lang === 'en' ? 'kh' : 'en');
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 z-[100] pointer-events-none">
        <div className="w-full max-w-[450px] mx-auto glass-effect rounded-[28px] p-2 flex justify-between items-center pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/60">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex-1 py-3.5 flex flex-col items-center gap-1 transition-all duration-300",
                  isActive ? "text-[#00B761]" : "text-gray-300"
                )}
              >
                <tab.icon size={22} strokeWidth={isActive ? 3 : 2} />
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -bottom-1 w-1 h-1 bg-[#00B761] rounded-full"
                  />
                )}
              </button>
            );
          })}
          <div className="w-px h-6 bg-gray-100/50 mx-1" />
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative w-12 h-12 bg-[#1A1A1A] text-white rounded-[20px] flex items-center justify-center shadow-lg active:scale-95 transition-all"
          >
            <ShoppingCart size={20} strokeWidth={2.5} />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 bg-[#00B761] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 w-full bg-white/80 backdrop-blur-xl z-[100] border-b border-[#F1F2F6] px-10 py-5 flex justify-between items-center">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 green-gradient rounded-2xl flex items-center justify-center text-white p-2 shadow-lg"><Star fill="white" size={24} /></div>
          <span className="font-serif text-2xl font-black text-[#00B761]">Atelier Coffee</span>
        </div>
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all", activeTab === tab.id ? "bg-[#00B761] text-white shadow-lg" : "text-gray-400 hover:text-[#00B761] hover:bg-gray-50")}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 bg-white border border-[#F1F2F6] px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#FDFBF7] transition-all"
        >
          <Globe size={16} />
          <span>{lang === 'en' ? 'ភាសាខ្មែរ' : 'English'}</span>
        </button>

        <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-3 bg-[#FAF9F6] text-[#00B761] px-6 py-3 rounded-2xl font-black text-[11px] uppercase border border-[#F1F2F6] hover:border-[#00B761]/30 transition-all">
          <ShoppingCart size={18} />
          <span>{t.order || 'Cart'} • {cartCount} {t.items || 'Items'}</span>
        </button>
      </div>
    </div>
  );
};

const StarredView = ({ starredItems, onToggleStar, setOptionsModalItem, businessConfig }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col px-6 pb-24 pt-8">
    <h1 className="text-2xl font-extrabold text-[#00B761] mb-2">My Starred</h1>
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
            businessConfig={businessConfig}
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
      <h1 className="text-2xl font-extrabold text-[#00B761]">Order History</h1>
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
              <span className="text-lg font-black text-[#00B761]">${parseFloat(order.total_amount).toFixed(2)}</span>
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
        <h1 className="text-2xl font-extrabold text-[#00B761]">App Settings</h1>
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
              className={cn("w-12 h-6 rounded-full transition-all cursor-pointer relative p-1", item.value ? "bg-[#00B761]" : "bg-gray-200")}
            >
              <div className={cn("w-4 h-4 bg-white rounded-full transition-all", item.value ? "translate-x-6" : "translate-x-0")}></div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const OrderTracker = ({ status, onBack }) => {
  const t = translations[useLanguage().lang] || translations.en;

  const statusConfig = {
    'unpaid': { icon: DollarSign, label: t.waiting_for_cashier, color: 'text-amber-500', desc: t.pending_status_desc },
    'pending': { icon: Coffee, label: t.order_received || 'Order Received', color: 'text-blue-500', desc: t.pending_status_desc },
    'cooking': { icon: Flame, label: t.brewing_cooking, color: 'text-orange-500', desc: t.cooking_status_desc },
    'served': { icon: CheckCircle2, label: t.ready_pickup, color: 'text-green-500', desc: t.ready_status_desc },
    'received': { icon: Smile, label: t.served_enjoy, color: 'text-green-600', desc: t.served_status_desc }
  };

  const current = statusConfig[status] || statusConfig['unpaid'];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center px-8 text-center bg-white min-h-screen">
      <div className="mb-10 relative">
        <div className="absolute inset-0 bg-[#00B761]/10 rounded-full blur-3xl" />
        <div className="relative w-48 h-48 rounded-full bg-gray-50 flex items-center justify-center">
          <img src="https://img.freepik.com/free-vector/hand-drawn-delivery-concept-illustration_23-2149156093.jpg" className="w-32 h-32 object-contain" />
        </div>
      </div>

      <h2 className="text-2xl font-outfit font-black text-gray-800 mb-2">{current.label}</h2>
      <p className="text-gray-400 text-sm mb-12 max-w-[250px] leading-relaxed">
        {current.desc}
      </p>

      <button
        onClick={onBack}
        className="w-full h-16 bg-[#00B761] text-white rounded-2xl font-black shadow-xl shadow-[#00B761]/20 active:scale-[0.98] transition-all"
      >
        {t.back_to_home || 'Back To Home'}
      </button>
    </motion.div>
  );
};

const ProfileView = ({ selectedShop, selectedTable, setActiveTab, setSubView, onFetchHistory }) => {
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;
  const profile = getProfile();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center px-6 pb-32 pt-12 max-w-[800px] mx-auto w-full"
    >
      <div className="w-full mb-10 text-center md:text-left">
        <h1 className="text-3xl font-outfit font-black text-gray-800 tracking-tight">{t.profile}</h1>
      </div>

      <div className="w-full bg-white rounded-[32px] p-8 flex flex-col items-center mb-10 border border-gray-50 shadow-sm relative overflow-hidden group">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-[#00B761] text-3xl font-black mb-6 border-4 border-white shadow-lg">
          {profile?.firstname?.charAt(0) || "G"}
        </div>
        <h3 className="text-xl font-outfit font-black text-gray-800 mb-1">{profile?.firstname ? `${profile.firstname} ${profile.lastname || ''}` : t.guest || "Guest Customer"}</h3>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{selectedShop?.name || 'Main Branch'} — {t.table_label} {selectedTable || 'N/A'}</p>

        {!profile && (
          <button onClick={() => navigate("/login")} className="px-8 py-3 bg-[#00B761] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#00B761]/20 transition-all">{t.sign_in}</button>
        )}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: History, label: t.history, action: () => { onFetchHistory(); setSubView('history'); } },
          { icon: Star, label: t.favorites, action: () => setActiveTab('starred') },
          { icon: Globe, label: t.language, action: () => { setLang(lang === 'en' ? 'kh' : 'en'); message.success(lang === 'en' ? "ប្តូរទៅភាសាខ្មែរជោគជ័យ" : "Switched to English"); } },
          { icon: Settings, label: t.settings, action: () => setSubView('settings') },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="flex justify-between items-center p-6 bg-white border border-gray-50 rounded-3xl hover:shadow-lg transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                <item.icon size={22} className="text-gray-400" />
              </div>
              <span className="text-sm font-bold text-gray-700">{item.label}</span>
            </div>
            <ChevronLeft size={16} className="rotate-180 text-gray-300" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const CategoryView = ({ currentCategory, setCurrentCategory, menuItems, searchText, setSearchText, setOptionsModalItem, starredItems, onToggleStar, isMobile, businessConfig }) => {
  const { lang } = useLanguage();
  const t = translations[lang] || translations.en;
  const filtered = menuItems.filter(i => (currentCategory.id === null || i.category_id === currentCategory.id) && (!searchText || i.name.toLowerCase().includes(searchText.toLowerCase())));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col px-6 pb-40 pt-8 bg-[#FAFAFA]"
    >
      {/* Category Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => { setCurrentCategory(null); setSearchText(""); }}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-50 text-gray-400 hover:text-[#00B761] transition-all"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">{t.category_label}</p>
          <h1 className="text-xl font-outfit font-black text-[#00B761] leading-tight">{currentCategory.name}</h1>
        </div>
      </div>
      
      {/* Section Title */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-gray-800 font-outfit tracking-tight">{currentCategory.name}</h3>
        <span className="text-[10px] font-black text-[#00B761] bg-[#00B761]/5 px-3 py-1.5 rounded-full uppercase tracking-widest">{filtered.length} Items</span>
      </div>

      {/* Search - Floating Style */}
      <div className="mb-8">
        <div className="relative flex items-center bg-white border border-gray-100 rounded-[24px] h-14 px-5 focus-within:border-[#00B761]/30 transition-all shadow-sm">
          <Search className="text-[#00B761]" size={18} strokeWidth={3} />
          <input
            type="text"
            placeholder={`${t.search_in_category} ${currentCategory.name}...`}
            className="flex-1 h-full bg-transparent border-none px-4 text-[13px] font-bold text-gray-800 placeholder:text-gray-300 focus:ring-0"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* Product List - Modern Two-Column Grid */}
      <div className="grid grid-cols-2 gap-4 pb-10">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-200" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No results found</p>
          </div>
        ) : (
          filtered.map((item) => (
            <ProductCard
              key={item.id} item={item} onToggleStar={onToggleStar}
              isStarred={starredItems.some(s => s.id === item.id)}
              onClick={() => setOptionsModalItem(item)}
              isMobile={isMobile}
              businessConfig={businessConfig}
            />
          ))
        )}
      </div>
    </motion.div>
  );
};

// --- MAIN APPLICATION ---
const NoBranchView = ({ onSelectBranch }) => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang] || translations.en;
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        const res = await request("branch", "get");
        if (res && res.list) setBranches(res.list);
      } catch (e) { console.error("Failed to fetch branches"); }
      finally { setLoading(false); }
    };
    fetchBranches();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
      className="min-h-screen bg-white flex flex-col items-center px-8 pt-16 pb-10"
    >
      {/* Header Icon */}
      <div className="w-20 h-20 bg-[#00B761]/10 rounded-3xl flex items-center justify-center mb-10 shadow-xl shadow-[#00B761]/5">
        <Coffee size={40} className="text-[#00B761]" />
      </div>

      <h1 className="text-3xl font-outfit font-black text-gray-800 text-center mb-4 leading-tight">
        {t.scan_to_order}
      </h1>
      <p className="text-gray-400 text-center text-sm mb-12 max-w-[280px] leading-relaxed">
        {t.please_scan_msg}
      </p>

      {/* Instructional Scan Graphic */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="w-full max-w-sm bg-[#FAFAFA] border-2 border-dashed border-[#00B761]/20 rounded-[40px] p-8 flex flex-col items-center mb-12"
      >
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6">
          <ShoppingCart size={24} className="text-[#00B761]" />
        </div>
        <div className="w-44 h-44 bg-white p-4 rounded-3xl shadow-inner mb-4 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00B761]/5 to-transparent animate-pulse" />
            <div className="w-full h-full border-2 border-[#00B761]/10 rounded-2xl flex items-center justify-center bg-gray-50/50">
               <span className="text-3xl font-black text-[#00B761]/20 tracking-widest">QR</span>
            </div>
        </div>
        <p className="text-[10px] font-black text-[#00B761] uppercase tracking-[0.2em]">{t.ready_to_serve}</p>
      </motion.div>

      {/* Branch Selector */}
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2">{t.select_branch_to_browse}</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="space-y-3 w-full">
          {loading ? (
             <div className="py-10 flex justify-center"><Spin /></div>
          ) : (
            branches.map((b) => (
              <motion.button
                key={b.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectBranch({ id: b.id, business_id: b.business_id, name: b.name, business_name: b.business_name || "Atelier Coffee", image: b.image })}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-3xl hover:border-[#00B761]/30 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-50">
                    {b.image ? (
                      <img src={Config.getFullImagePath(b.image)} className="w-full h-full object-cover" />
                    ) : (
                      <Globe size={18} className="text-gray-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-800">{b.name}</h4>
                    <p className="text-[9px] font-bold text-gray-400 truncate max-w-[150px]">{b.address || "Main Street Branch"}</p>
                  </div>
                </div>
                <ChevronLeft size={16} className="rotate-180 text-gray-300" />
              </motion.button>
            ))
          )}
        </div>
      </div>
      
      {/* Footer / Staff Portal */}
      <div className="mt-auto pt-16 flex flex-col items-center gap-6">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Powered by Nit POS</p>
          <button 
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-[#00B761] transition-colors border-t border-gray-50 pt-6 px-10"
          >
            <User size={12} strokeWidth={3} />
            {t.staff_portal}
          </button>
      </div>
    </motion.div>
  );
};
const BrowsingModeBanner = ({ t }) => (
  <motion.div 
    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
    className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center gap-3 sticky top-[72px] z-40 backdrop-blur-md"
  >
    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
       <Star size={14} className="text-amber-600" />
    </div>
    <div className="flex-1">
       <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-tight">{t.browse_mode}</h5>
       <p className="text-[9px] font-bold text-amber-600/70">{t.browse_mode_msg}</p>
    </div>
  </motion.div>
);

const CoffeeMenuApp = () => {
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;
  const navigate = useNavigate();
  const profile = getGuestProfile();

  const [orderId, setOrderId] = useState(() => localStorage.getItem('last_order_id'));
  const [orderStatus, setOrderStatus] = useState(null);
  const [lastOrderTime, setLastOrderTime] = useState(0); // For Rate Limiting

  // Poll for order status
  useEffect(() => {
    let interval;
    if (orderId) {
      interval = setInterval(async () => {
        try {
          const res = await request(`order-web/${orderId}`, "get");
          if (res && res.order) {
            const kStatus = res.order.kitchen_status?.toLowerCase();
            const pStatus = res.order.status?.toLowerCase();

            // Prioritize kitchen progress: If kitchen is cooking or ready, show that!
            if (kStatus === 'preparing' || kStatus === 'cooking') {
              setOrderStatus('cooking');
            } else if (kStatus === 'served' || kStatus === 'ready') {
              setOrderStatus('served');
            } else if (kStatus === 'received') {
              setOrderStatus('received');
            } else if (pStatus === 'unpaid') {
              setOrderStatus('unpaid');
            } else {
              setOrderStatus('pending');
            }

            if (kStatus === 'received') {
              clearInterval(interval);
            }
          }
        } catch (e) { console.error("Status check failed"); }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [orderId]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const safeParse = (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  };
  const [selectedShop, setSelectedShop] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const br = params.get('br') || params.get('branch');
    const biz = params.get('biz');
    if (br && biz) return { id: parseInt(br), business_id: parseInt(biz) };
    return safeParse('coffee_pos_shop');
  });
  const [selectedTable, setSelectedTable] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tbl') || params.get('table') || localStorage.getItem('coffee_pos_table');
  });
  const [cart, setCart] = useState(() => safeParse('coffee_pos_cart', []));
  const [starredItems, setStarredItems] = useState(() => safeParse('coffee_pos_starred', []));

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSizes, setProductSizes] = useState({});
  const [businessConfig, setBusinessConfig] = useState({
    promo_title: "",
    promo_subtitle: "",
    promo_image: "",
    promo_discount: "",
    promo_is_active: 0,
    global_discount: 0
  });
  const [splash, setSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [optionsModalItem, setOptionsModalItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileSubView, setProfileSubView] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [selectedTemp, setSelectedTemp] = useState("");
  const [selectedSugar, setSelectedSugar] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [optionQty, setOptionQty] = useState(1);

  const parseJson = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  const modalMoods = useMemo(() => parseJson(optionsModalItem?.moods), [optionsModalItem]);
  const modalSizes = useMemo(() => parseJson(optionsModalItem?.sizes), [optionsModalItem]);
  const modalAddons = useMemo(() => parseJson(optionsModalItem?.addons), [optionsModalItem]);

  // Split moods into Temperature and Sugar based on common keywords
  const moodsConfig = useMemo(() => {
    const temp = [];
    const sugar = [];
    const other = [];
    modalMoods.forEach(m => {
      const label = (typeof m === 'object' ? m.label : m) || "";
      const lower = label.toLowerCase();
      if (lower.includes('hot') || lower.includes('iced') || lower.includes('frappe') || lower.includes('warm') || lower.includes('cold')) {
        temp.push(m);
      } else if (lower.includes('sugar') || lower.includes('%')) {
        sugar.push(m);
      } else {
        other.push(m);
      }
    });
    return { temp, sugar, other };
  }, [modalMoods]);

  // When opening the modal, set default selections from product data
  useEffect(() => {
    if (optionsModalItem) {
      const firstTemp = moodsConfig.temp[0];
      setSelectedTemp(firstTemp ? (typeof firstTemp === 'object' ? firstTemp.label : firstTemp) : "");

      const firstSugar = moodsConfig.sugar[0];
      setSelectedSugar(firstSugar ? (typeof firstSugar === 'object' ? firstSugar.label : firstSugar) : "");

      const firstSize = modalSizes[0];
      setSelectedSize(firstSize ? firstSize.label : "");

      setSelectedAddons([]);
      setOptionQty(1);
    }
  }, [optionsModalItem, moodsConfig, modalSizes]);

  // Dynamic price calculation based on size and selected addons
  const currentPrice = useMemo(() => {
    if (!optionsModalItem) return 0;
    let price = parseFloat(optionsModalItem.price || 0);

    if (selectedSize) {
      const sizeObj = modalSizes.find(s => s.label === selectedSize);
      if (sizeObj && sizeObj.price) price = parseFloat(sizeObj.price);
    }

    selectedAddons.forEach(label => {
      const addon = modalAddons.find(a => a.label === label);
      if (addon && addon.price) price += parseFloat(addon.price);
    });

    return price;
  }, [optionsModalItem, selectedSize, selectedAddons, modalSizes, modalAddons]);

  // NEW: Detect Table/Branch from URL and force sync
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const biz = params.get('biz');
      const br = params.get('br') || params.get('branch');
      const tbl = params.get('tbl') || params.get('table');

      if (biz && br) {
        const newShop = { id: parseInt(br), business_id: parseInt(biz) };
        setSelectedShop(newShop);
        localStorage.setItem('coffee_pos_shop', JSON.stringify(newShop));
        
        if (tbl) {
          setSelectedTable(tbl);
          localStorage.setItem('coffee_pos_table', tbl);
        }
      }
    };

    syncFromUrl();
    // Also listen for popstate if user navigates back/forward
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [window.location.search]);


  const isDrink = useMemo(() => {
    if (!optionsModalItem) return false;
    const cat = categories.find(c => c.id === optionsModalItem.category_id);
    if (!cat) return false;
    const name = cat.name.toLowerCase();
    return name.includes('coffee') || name.includes('juice') || name.includes('milk') || name.includes('drink') || name.includes('tea');
  }, [optionsModalItem, categories]);


  useEffect(() => {
    localStorage.setItem('coffee_pos_table', selectedTable || "");
    localStorage.setItem('coffee_pos_shop', JSON.stringify(selectedShop || {}));
    localStorage.setItem('coffee_pos_cart', JSON.stringify(cart || []));
    localStorage.setItem('coffee_pos_starred', JSON.stringify(starredItems || []));
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

  useEffect(() => {
    if (selectedShop?.id) {
      fetchShopProducts();
    }
  }, [selectedShop?.id, currentCategory?.id]);

  const fetchShopProducts = async () => {
    try {
      setLoading(true);
      if (categories.length === 0) {
        const catRes = await request("category", "get");
        if (catRes?.list) setCategories(catRes.list);
      }
      const productRes = await request("product", "get", { branch_id: selectedShop?.id });
      if (productRes?.list) {
        setMenuItems(productRes.list);
        let sizesMap = {};
        productRes.list.forEach(p => { if (p.sizes) { try { sizesMap[p.id] = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes; } catch (e) { } } });
        setProductSizes(sizesMap);
      }
    } catch { } finally { setLoading(false); }
  };

  const fetchBusinessConfig = async () => {
    try {
      const bizId = selectedShop?.business_id || getProfile()?.business_id;
      if (!bizId) return;
      const res = await request("business/public-config", "get", { business_id: bizId });
      if (res?.config) setBusinessConfig(res.config);
    } catch (e) { console.error("Failed to fetch business config"); }
  };

  useEffect(() => {
    if (selectedShop?.business_id) fetchBusinessConfig();
  }, [selectedShop?.business_id]);

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

  const addToCart = (item, customization, qty) => {
    const cartId = `${item.id}-${customization}-${Date.now()}`;
    setCart(prevCart => [...prevCart, {
      ...item,
      cartId,
      quantity: qty,
      totalPrice: item.price * qty,
      basePrice: item.price,
      customization: customization
    }]);
    message.success("Added to cart!");
    setOptionsModalItem(null);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      message.warning("Your basket is empty!");
      return;
    }

    // 1. Rate Limiting Check (2 minutes cooldown to prevent spam)
    const now = Date.now();
    if (now - lastOrderTime < 120000) {
      const remaining = Math.ceil((120000 - (now - lastOrderTime)) / 1000);
      message.warning(`Please wait ${remaining} seconds before placing another order.`);
      return;
    }

    // 2. GPS Verification (Verify user is physically present)
    let coords = { lat: null, lng: null };
    setLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          message.error("Location services are not supported by your browser.");
          return reject();
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => {
            message.error("Please enable Location Services to verify your presence at the shop.");
            reject(err);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });
      coords = { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (e) {
      setLoading(false);
      return;
    }

    const sub_total = cart.reduce((s, i) => s + (i.totalPrice || 0), 0);
    const orderData = {
      business_id: selectedShop?.business_id,
      branch_id: selectedShop?.id,
      customer_name: getGuestProfile()?.firstname || "Web Guest",
      table_no: selectedTable || "Web",
      sub_total: sub_total,
      total_amount: sub_total,
      payment_method: "Unpaid (Web QR)",
      order_type: "dine_in",
      lat: coords.lat, // Send Lat
      lng: coords.lng, // Send Lng
      cart_items: cart.map(item => ({
        product_id: item.id,
        qty: item.quantity,
        price: item.basePrice,
        note: item.customization || item.note || ""
      })),
      status: "unpaid" // Default status, staff must approve/bill
    };

    try {
      const res = await request("order-web", "post", orderData);
      if (res && res.success) {
        const orderId = res.order_id;
        setOrderId(orderId);
        setLastOrderTime(Date.now()); // Update rate limit timer
        localStorage.setItem('last_order_id', orderId);
        message.success(t.order_success_msg);
        setCart([]);
        localStorage.setItem('coffee_pos_cart', JSON.stringify([]));
        setIsCartOpen(false);
      } else {
        message.error(res?.message || t.order_failed_msg);
      }
    } catch (error) {
      console.error("Order Error:", error);
      message.error(`${t.order_status_update_failed || "Order failed"}. Please try again or contact our staff.`);
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

  const params = new URLSearchParams(window.location.search);
  const brInUrl = params.get('br') || params.get('branch');
  const isMenuPath = window.location.pathname.includes("/menu");

  if (splash) return <SplashView businessName={selectedShop?.business_name} />;

  // Case 1: On landing page (/customer) or missing session on menu page
  if (!isMenuPath || (!brInUrl && !selectedShop?.id)) {
    return (
      <NoBranchView 
        onSelectBranch={(shop) => {
          setSelectedShop(shop);
          // Only default to "Web" if no table was already detected from URL
          const params = new URLSearchParams(window.location.search);
          const tbl = params.get('tbl') || params.get('table');
          if (!tbl && !selectedTable) {
            setSelectedTable("Web");
          }
          navigate("/customer/menu"); 
        }}
      />
    );
  }

  return (
    <MainWrapper isMobile={isMobile}>
      <div className={cn("flex flex-col h-full", !isMobile && "flex-row")}>
        <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar relative min-h-screen bg-[#FDFBF7]">
          
          {/* Premium Sticky Header */}
          {activeTab !== 'status' && (
            <div className="sticky top-0 z-40 px-6 pt-8 pb-4 bg-[#FDFBF7]/80 backdrop-blur-xl">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-[#00B761] rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Table {selectedTable || "Web"}</span>
                   </div>
                   <h1 className="text-2xl font-black text-gray-800 font-outfit tracking-tighter leading-tight">
                      Welcome to <span className="text-[#00B761]">Coffee</span>
                   </h1>
                </div>
                <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 border border-gray-50 shadow-sm">
                   <Bell size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 px-6 pb-32">
            {loading ? (
              <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-[#00B761]/10 border-t-[#00B761] rounded-full animate-spin"></div>
              </div>
            ) : activeTab === 'profile' ? (
              <div key="profile" className="flex-1 flex flex-col pt-4">
                {profileSubView === 'history' ? (
                  <HistoryView history={orderHistory} onBack={() => setProfileSubView(null)} />
                ) : profileSubView === 'settings' ? (
                  <SettingsView onBack={() => setProfileSubView(null)} />
                ) : (
                  <ProfileView selectedShop={selectedShop} selectedTable={selectedTable} setActiveTab={setActiveTab} setSubView={setProfileSubView} onFetchHistory={fetchOrderHistory} />
                )}
              </div>
            ) : activeTab === 'status' ? (
              <div key="status" className="flex-1 flex flex-col -mx-6 -mt-8">
                <OrderTracker status={orderStatus} onBack={() => setActiveTab('home')} />
              </div>
            ) : activeTab === 'starred' ? (
              <div key="starred" className="flex-1 flex flex-col pt-4">
                <StarredView starredItems={starredItems} onToggleStar={onToggleStar} setOptionsModalItem={setOptionsModalItem} businessConfig={businessConfig} />
              </div>
            ) : currentCategory ? (
              <div key={`cat-${currentCategory.id}`} className="flex-1 flex flex-col pt-4">
                <CategoryView
                  currentCategory={currentCategory} setCurrentCategory={setCurrentCategory}
                  menuItems={menuItems} starredItems={starredItems} onToggleStar={onToggleStar}
                  searchText={searchText} setSearchText={setSearchText} setOptionsModalItem={setOptionsModalItem}
                  businessConfig={businessConfig}
                />
              </div>
            ) : (
              <div key="home" className="flex-1 flex flex-col pt-4">
                <HomeView
                  selectedShop={selectedShop} categories={categories} currentCategory={currentCategory} setCurrentCategory={setCurrentCategory}
                  menuItems={menuItems} starredItems={starredItems} onToggleStar={onToggleStar}
                  cart={cart} setIsCartOpen={setIsCartOpen} searchText={searchText} setSearchText={setSearchText}
                  setOptionsModalItem={setOptionsModalItem} isMobile={isMobile} businessConfig={businessConfig}
                />
              </div>
            )}
          </div>

          {/* Floating Premium Bottom Navigation */}
          {activeTab !== 'status' && (
            <div className="fixed bottom-8 left-6 right-6 z-50">
              <div className="bg-[#1A1A1A] text-white rounded-[32px] h-20 px-8 flex items-center justify-between shadow-2xl shadow-black/40 border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-10" />
                
                <button 
                  onClick={() => setActiveTab('home')}
                  className={cn("relative flex flex-col items-center gap-1 transition-all", activeTab === 'home' ? "text-[#00B761]" : "text-gray-500 hover:text-white")}
                >
                   {activeTab === 'home' && <div className="w-1.5 h-1.5 bg-[#00B761] rounded-full absolute -top-4" />}
                   <Menu size={22} strokeWidth={activeTab === 'home' ? 3 : 2} />
                </button>

                <button 
                  onClick={() => setActiveTab('starred')}
                  className={cn("relative flex flex-col items-center gap-1 transition-all", activeTab === 'starred' ? "text-[#00B761]" : "text-gray-500 hover:text-white")}
                >
                   {activeTab === 'starred' && <div className="w-1.5 h-1.5 bg-[#00B761] rounded-full absolute -top-4" />}
                   <Star size={22} strokeWidth={activeTab === 'starred' ? 3 : 2} />
                </button>

                <button 
                  className="relative w-14 h-14 bg-[#00B761] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#00B761]/30 active:scale-90 transition-all gold-glow -mt-4 border-4 border-[#1A1A1A]"
                  onClick={() => setIsCartOpen(true)}
                >
                   <ShoppingCart size={22} strokeWidth={3} />
                   {cart.length > 0 && (
                     <span className="absolute -top-1 -right-1 w-6 h-6 bg-white text-[#00B761] rounded-full text-[10px] font-black flex items-center justify-center shadow-md">
                       {cart.length}
                     </span>
                   )}
                </button>

                <button 
                  onClick={() => setActiveTab('status')}
                  className={cn("relative flex flex-col items-center gap-1 transition-all", activeTab === 'status' ? "text-[#00B761]" : "text-gray-500 hover:text-white")}
                >
                   {activeTab === 'status' && <div className="w-1.5 h-1.5 bg-[#00B761] rounded-full absolute -top-4" />}
                   <Clock size={22} strokeWidth={activeTab === 'status' ? 3 : 2} />
                </button>

                <button 
                  onClick={() => setActiveTab('profile')}
                  className={cn("relative flex flex-col items-center gap-1 transition-all", activeTab === 'profile' ? "text-[#00B761]" : "text-gray-500 hover:text-white")}
                >
                   {activeTab === 'profile' && <div className="w-1.5 h-1.5 bg-[#00B761] rounded-full absolute -top-4" />}
                   <User size={22} strokeWidth={activeTab === 'profile' ? 3 : 2} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar Cart */}
        {!isMobile && activeTab === 'home' && (
          <div className="w-[420px] border-l border-[#F1F2F6] bg-[#FDFBF7]/50 p-8 flex flex-col h-full sticky top-0 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-black text-[#00B761]">Your Basket</h2>
              <div className="bg-[#00B761] text-white text-[10px] font-black px-3 py-1.5 rounded-xl">{cart.length} ITEMS</div>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
                <ShoppingCart size={48} strokeWidth={1} />
                <p className="mt-4 font-black text-[10px] uppercase tracking-[0.2em]">Basket is currently empty</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="space-y-4 mb-8">
                  {cart.map((item) => (
                    <div key={item.cartId} className="group bg-white p-5 rounded-[32px] border border-[#F1F2F6] flex gap-4 items-center hover:border-[#00B761]/30 transition-all shadow-sm">
                      <img src={Config.optimizeCloudinary(Config.getFullImagePath(item.image), "w_150,c_fill,f_auto,q_auto")} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-[#00B761] line-clamp-1">{item.name}</h4>
                        <p className="text-[9px] font-black text-amber-600 uppercase mb-3 tracking-tighter">{item.customization || "Standard Creation"}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-[#00B761]">${item.totalPrice.toFixed(2)}</span>
                          <div className="flex items-center gap-3 bg-[#FAF9F6] px-2.5 py-1.5 rounded-xl border border-[#F1F2F6]">
                            <button onClick={() => updateCartQty(item.cartId, -1)} className="text-gray-400 hover:text-red-500 transition-colors"><Minus size={12} strokeWidth={3} /></button>
                            <span className="text-xs font-black min-w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.cartId, 1)} className="text-gray-400 hover:text-[#00B761] transition-colors"><Plus size={12} strokeWidth={3} /></button>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.cartId)} className="p-2 text-gray-200 hover:text-red-500 transition-colors"><X size={14} strokeWidth={3} /></button>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8 border-t border-dashed border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                    <span className="text-sm font-black text-gray-800">${(cart.reduce((s, i) => s + (i.totalPrice || 0), 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Service Fee</span>
                    <span className="text-sm font-black text-green-600 uppercase">Complimentary</span>
                  </div>
                  <div className="flex justify-between items-end mb-8">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-[#00B761] uppercase tracking-widest">Grand Total</span>
                      <span className="text-4xl font-black text-[#00B761] tracking-tighter">${(cart.reduce((s, i) => s + (i.totalPrice || 0), 0)).toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full h-16 bg-[#00B761] text-white rounded-2xl font-black shadow-xl shadow-[#00B761]/20 hover:gold-gradient hover:shadow-[#00B761]/30 transition-all duration-500 active:scale-[0.98] gold-glow"
                  >
                    {loading ? 'PROCESSING...' : 'PLACE ORDER NOW'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
          <div className="relative h-72 bg-gray-50 overflow-hidden">
            {optionsModalItem?.image ? (
              <img src={Config.optimizeCloudinary(Config.getFullImagePath(optionsModalItem.image), "w_800,c_fill,f_auto,q_auto")} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl bg-gray-100">☕</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <button
              onClick={() => setOptionsModalItem(null)}
              className="absolute top-6 right-6 w-11 h-11 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30 hover:bg-white/40 transition-all duration-300"
            >
              <X size={22} strokeWidth={3} />
            </button>
          </div>

          <div className="p-10 relative">
            {/* Top Info Float */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-gray-800 font-outfit tracking-tighter mb-2">{optionsModalItem?.name}</h2>
                <div className="flex items-center gap-2">
                   <span className="bg-[#00B761]/5 text-[#00B761] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00B761]/10">Signature Drink</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest block mb-1">Base Price</span>
                <span className="text-2xl font-black text-[#00B761] font-outfit">${parseFloat(optionsModalItem?.price || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-8 mb-10 overflow-y-auto max-h-[45vh] pr-2 no-scrollbar">
              {/* Temperature Selector */}
              {moodsConfig.temp.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Temperature</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {moodsConfig.temp.map(m => {
                      const label = typeof m === 'object' ? m.label : m;
                      const isActive = selectedTemp === label;
                      return (
                        <button
                          key={label}
                          onClick={() => setSelectedTemp(label)}
                          className={cn(
                            "py-4 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all duration-500 border",
                            isActive ? "bg-[#00B761] text-white border-[#00B761] shadow-lg shadow-[#00B761]/20" : "bg-[#F9FAFB] text-gray-400 border-transparent hover:border-gray-200"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sugar Level */}
              {moodsConfig.sugar.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Sugar Level</h4>
                  <div className="flex flex-wrap gap-3">
                    {moodsConfig.sugar.map(m => {
                      const label = typeof m === 'object' ? m.label : m;
                      const isActive = selectedSugar === label;
                      return (
                        <button
                          key={label}
                          onClick={() => setSelectedSugar(label)}
                          className={cn(
                            "px-6 py-3 rounded-2xl text-[11px] font-black transition-all duration-500 border",
                            isActive ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md" : "bg-white text-gray-400 border-gray-100"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {modalSizes.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Select Size</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {modalSizes.map(s => {
                      const isActive = selectedSize === s.label;
                      return (
                        <button
                          key={s.label}
                          onClick={() => setSelectedSize(s.label)}
                          className={cn(
                            "p-5 rounded-[24px] text-left transition-all duration-500 border flex justify-between items-center group",
                            isActive ? "bg-white border-[#00B761] shadow-xl shadow-[#00B761]/5" : "bg-[#F9FAFB] border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-4">
                             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", isActive ? "bg-[#00B761] text-white" : "bg-white text-gray-400")}>
                                <Coffee size={18} strokeWidth={isActive ? 3 : 2} />
                             </div>
                             <div>
                               <p className={cn("text-xs font-black uppercase tracking-widest", isActive ? "text-[#00B761]" : "text-gray-400")}>{s.label}</p>
                               <p className="text-[10px] font-bold text-gray-300">Standard Portion</p>
                             </div>
                          </div>
                          <span className={cn("text-sm font-black font-outfit", isActive ? "text-[#00B761]" : "text-gray-400")}>${parseFloat(s.price).toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Section */}
            <div className="pt-8 border-t border-gray-50 flex items-center gap-6">
              <div className="flex items-center gap-4 bg-[#F9FAFB] p-2 rounded-[24px] border border-gray-50">
                <button
                  onClick={() => setOptionQty(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 active:scale-90 transition-all"
                >
                  <Minus size={18} strokeWidth={3} />
                </button>
                <span className="text-base font-black w-6 text-center text-gray-800">{optionQty}</span>
                <button
                  onClick={() => setOptionQty(prev => prev + 1)}
                  className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-gray-400 hover:text-[#00B761] active:scale-90 transition-all"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>

              <button
                className="flex-1 h-16 bg-[#00B761] text-white rounded-[24px] font-black shadow-xl shadow-[#00B761]/20 hover:shadow-[#00B761]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 gold-glow"
                onClick={() => {
                  const customization = [selectedTemp, selectedSugar, selectedSize, ...selectedAddons].filter(Boolean).join(", ");
                  addToCart({ ...optionsModalItem, price: currentPrice }, customization, optionQty);
                }}
              >
                <span className="text-[13px] uppercase tracking-widest">Add to Basket</span>
                <div className="w-px h-6 bg-white/20 mx-2" />
                <span className="text-lg font-outfit tracking-tighter">${(currentPrice * optionQty).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={isCartOpen}
        onCancel={() => setIsCartOpen(false)}
        afterClose={() => {
          // If we just placed an order (cart is empty and we have a last_order_id), go to status
          if (cart.length === 0 && localStorage.getItem('last_order_id')) {
            setActiveTab('status');
          }
        }}
        footer={null}
        centered
        width={500}
        className="premium-modal"
        destroyOnHidden={true}
        title={
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#00B761] rounded-full"></span>
            <span className="text-base font-black text-gray-800 uppercase tracking-tight">{t.order_checkout}</span>
          </div>
        }
      >
        <div className="p-6 font-sans">
          {cart.length === 0 ? (
            <div className="py-12 flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart size={32} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-400">{t.basket_empty}</h3>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar mb-8">
                {cart.map((item, idx) => (
                  <div key={item.cartId} className="group flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 hover:border-gray-200 transition-all">
                    <div className="flex gap-4 items-center">
                      <div className="relative">
                        <img src={Config.optimizeCloudinary(Config.getFullImagePath(item.image), "w_150,c_fill,f_auto,q_auto")} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                        <span className="absolute -top-1 -right-1 bg-[#00B761] text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">{item.name}</h4>
                        {item.customization && <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">{item.customization}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-black text-[#00B761]">${(item.basePrice || 0).toFixed(2)}</span>
                          <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg">
                            <button onClick={() => updateCartQty(item.cartId, -1)} className="text-gray-400 hover:text-red-500 transition-colors"><Minus size={12} strokeWidth={3} /></button>
                            <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.cartId, 1)} className="text-gray-400 hover:text-[#00B761] transition-colors"><Plus size={12} strokeWidth={3} /></button>
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

              <div className="bg-[#00B761]/[0.02] p-6 rounded-3xl border border-dashed border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.subtotal}</span>
                  <span className="text-sm font-bold text-gray-600">${(cart.reduce((s, i) => s + (i.totalPrice || 0), 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.service_fee}</span>
                  <span className="text-sm font-bold text-green-600 uppercase">{t.free}</span>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                  <span className="text-sm font-black text-[#00B761]">{t.grand_total}</span>
                  <span className="text-3xl font-black text-[#00B761]">${(cart.reduce((s, i) => s + (i.totalPrice || 0), 0)).toFixed(2)}</span>
                </div>
              </div>

              <button
                className={cn(
                  "w-full mt-8 h-14 bg-[#00B761] text-white rounded-2xl font-black shadow-xl shadow-[#00B761]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3",
                  loading && "opacity-70 cursor-not-allowed"
                )}
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? t.placing_order : `${t.place_order_now} ☕`}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </MainWrapper>
  );
};

export default CoffeeMenuApp;
