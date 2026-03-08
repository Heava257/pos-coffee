import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Menu, Search, ShoppingCart, Plus, Minus, X,
  Home, FileText, Star, User, ChevronLeft,
  Tag as TagIcon
} from 'lucide-react';
import { request } from '../../util/helper';
import { Config } from '../../util/config';
import { getProfile } from '../../store/profile.store';
import { message, Modal } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- SHARED COMPONENTS ---

const MainWrapper = ({ children, bgClass = "bg-[#faf9f5]" }) => (
  <div className={cn("min-h-screen font-sans tracking-tight", bgClass)}>
    <div className="max-w-[1600px] mx-auto min-h-screen relative flex flex-col md:px-10">
      <div className="w-full h-full relative flex flex-col no-scrollbar bg-white md:bg-transparent shadow-none min-h-screen">
        {children}
      </div>
    </div>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
      .font-sans { font-family: 'Outfit', sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .mobile-modal .ant-modal-content { border-radius: 40px !important; padding: 32px !important; }
    `}</style>
  </div>
);

const SplashView = ({ businessName }) => (
  <div className="min-h-screen bg-[#f2f1e9] flex flex-col items-center justify-center text-[#1a3c28]">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center"
    >
      <div className="w-20 h-20 bg-[#1a3c28] rounded-[30px] flex items-center justify-center mb-6 shadow-2xl">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M4.5 9h15M4.5 13.5h15M6 4.5v15a3 3 0 003 3h6a3 3 0 003-3v-15a3 3 0 00-3-3H9a3 3 0 00-3 3z" />
        </svg>
      </div>
      <h1 className="text-[32px] font-black uppercase text-center leading-[0.9] tracking-tighter">
        {businessName?.toUpperCase() || "MINGLY"}<br />
        <span className="text-[#1a3c28]/40">COFFEE</span>
      </h1>
    </motion.div>
  </div>
);

const ProductOptionsModal = ({ item, onAdd, onClose, productSizes, calculateItemPrice }) => {
  const [selectedSize, setSelSize] = useState(null);
  const [itemQty, setItemQty] = useState(1);

  useEffect(() => {
    if (item) {
      setSelSize(productSizes[item.id]?.[0] || null);
      setItemQty(1);
    }
  }, [item, productSizes]);

  if (!item) return null;

  return (
    <div className="space-y-8 pt-2 pb-2 font-sans">
      <div className="flex gap-6">
        <div className="w-32 h-32 rounded-[35px] bg-[#f4f2ea] overflow-hidden flex-shrink-0 shadow-inner">
          {item.image ? (
            <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" />
          ) : (<div className="w-full h-full flex items-center justify-center text-4xl">☕</div>)}
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-black tracking-widest text-[#1a3c28]/30 uppercase mb-1">{item.category_name || 'Category'}</span>
          <h2 className="text-2xl font-black text-[#1a3c28] leading-tight mb-2">{item.name}</h2>
          <p className="text-[#1a3c28] font-black text-3xl">
            ${calculateItemPrice(item, selectedSize).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {productSizes[item.id]?.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-black text-[#1a3c28] uppercase tracking-wider opacity-40">Choose Size</p>
            <div className="flex flex-wrap gap-3">
              {productSizes[item.id].map(size => (
                <button
                  key={size.id}
                  onClick={() => setSelSize(size)}
                  className={cn(
                    "px-6 py-3 rounded-2xl border-2 font-black text-sm transition-all",
                    selectedSize?.id === size.id ? "bg-[#1a3c28] border-[#1a3c28] text-white shadow-xl shadow-[#1a3c28]/20" : "bg-white border-gray-50 text-[#1a3c28] hover:bg-gray-50"
                  )}
                > {size.name} </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 flex items-center justify-between gap-5">
          <div className="flex items-center bg-[#faf9f5] rounded-[28px] p-2 border border-gray-100 shadow-inner">
            <button onClick={() => setItemQty(q => Math.max(1, q - 1))} className="w-14 h-14 flex items-center justify-center text-[#1a3c28] hover:bg-white hover:shadow-sm rounded-[20px] transition-all"> <Minus size={24} strokeWidth={3} /> </button>
            <span className="w-12 text-center font-black text-[#1a3c28] text-xl">{itemQty}</span>
            <button onClick={() => setItemQty(q => q + 1)} className="w-14 h-14 flex items-center justify-center text-[#1a3c28] hover:bg-white hover:shadow-sm rounded-[20px] transition-all"> <Plus size={24} strokeWidth={3} /> </button>
          </div>
          <button
            onClick={() => onAdd(item, selectedSize, itemQty)}
            className="flex-1 bg-[#1a3c28] text-white py-6 rounded-[30px] font-black text-lg shadow-2xl shadow-[#1a3c28]/30 hover:scale-[1.02] active:scale-95 transition-all"
          > Add to Basket </button>
        </div>
      </div>
    </div>
  );
};

// --- VIEW COMPONENTS ---

const HomeView = ({
  selectedShop, categories, currentCategory, setCurrentCategory,
  menuItems, cart, setIsCartOpen, searchText, setSearchText,
  getTotalPrice, setOptionsModalItem, setActiveTab
}) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="flex-1 flex flex-col px-6 md:px-10 pb-[150px] pt-8"
  >
    {/* Header */}
    <div className="flex justify-between items-center mb-10">
      <div>
        <h1 className="text-[28px] md:text-[36px] font-black uppercase leading-[0.8] tracking-tighter text-[#1a3c28]">
          {selectedShop?.business_name?.toUpperCase() || "MINGLY"}<br />
          <span className="text-[#1a3c28]/20">COFFEE</span>
        </h1>
        <div className="flex items-center gap-2 mt-2 opacity-40">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest">{selectedShop?.name || 'Main Branch'} is open</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-14 h-14 rounded-2xl border border-gray-100 flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-all">
          <Bell size={24} className="text-[#1a3c28]" />
        </button>
        <button className="w-14 h-14 rounded-2xl border border-gray-100 flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-all">
          <Menu size={24} className="text-[#1a3c28]" />
        </button>
      </div>
    </div>

    {/* Search & Banner */}
    <div className="w-full mx-auto">
      <div className="relative mb-10 max-w-[800px] group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#1a3c28] transition-colors">
          <Search size={24} />
        </div>
        <input
          type="text" placeholder="What would you like to drink today?"
          className="w-full bg-white border border-gray-100 rounded-[30px] py-6 pl-16 pr-8 text-lg font-bold focus:outline-none focus:ring-8 focus:ring-[#1a3c28]/5 shadow-sm hover:shadow-md transition-all placeholder:text-gray-200"
          value={searchText} onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-[#fffcf5] border border-[#f0ead2] rounded-[50px] overflow-hidden flex shadow-sm relative min-h-[220px] group cursor-pointer hover:shadow-xl transition-all">
          <div className="p-10 flex-1 pr-48 relative z-10">
            <span className="text-[10px] font-black tracking-[0.3em] text-[#1a3c28]/40 uppercase block mb-2">Exclusive Offer</span>
            <h3 className="font-black text-[#1a3c28] text-2xl mb-3 tracking-tighter leading-tight">INVITE FRIENDS & GET 20% OFF</h3>
            <p className="text-sm text-[#1a3c28]/60 mb-8 font-bold">Share the love for coffee and earn rewards on every successful referral.</p>
            <button className="bg-[#1a3c28] text-white px-8 py-4 rounded-3xl text-xs font-black shadow-2xl shadow-[#1a3c28]/30 group-hover:scale-110 transition-transform tracking-widest uppercase">Invite Now</button>
          </div>
          <div className="absolute right-0 bottom-0 w-[240px] h-[240px] translate-x-8 translate-y-8">
            <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-10 blur-[80px]"></div>
            <div className="w-48 h-48 rounded-full overflow-hidden absolute bottom-10 right-10 border-8 border-white shadow-2xl bg-[#1a3c28]">
              <img src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>
        </div>

        {cart.length > 0 && (
          <div className="bg-[#1a3c28] rounded-[50px] p-10 text-white shadow-2xl shadow-[#1a3c28]/40 cursor-pointer group flex flex-col justify-between hover:scale-[1.02] transition-transform" onClick={() => setIsCartOpen(true)}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <ShoppingCart size={28} />
                </div>
                <div>
                  <span className="font-black text-2xl block">Your Basket</span>
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{cart.length} items ready</span>
                </div>
              </div>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            </div>
            <div className="flex justify-between items-end border-t border-white/5 pt-8">
              <div>
                <span className="text-xs font-black text-white/30 block mb-2 tracking-widest">ESTIMATED TOTAL</span>
                <span className="font-black text-4xl tracking-tighter">${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="px-8 py-4 bg-white text-[#1a3c28] rounded-[24px] text-sm font-black transition-all shadow-xl shadow-black/20 group-hover:bg-amber-400">Order Now</div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Categories */}
    <div className="mt-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-black text-[#1a3c28] tracking-tighter">EXPLORE CATEGORIES</h3>
          <p className="text-xs font-bold text-[#1a3c28]/30 uppercase tracking-widest mt-1">Found {categories.length} segments</p>
        </div>
        <span className="text-sm font-black text-[#1a3c28] border-b-4 border-[#1a3c28]/5 cursor-pointer hover:border-[#1a3c28] transition-all pb-1" onClick={() => setCurrentCategory(null)}>VIEW ALL</span>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 md:-mx-10 px-6 md:px-10 pb-6">
        <button
          onClick={() => setCurrentCategory(null)}
          className={cn(
            "px-10 py-5 rounded-[24px] border-2 font-black text-sm shadow-sm transition-all whitespace-nowrap uppercase tracking-widest",
            currentCategory === null ? "bg-[#1a3c28] border-[#1a3c28] text-white shadow-2xl shadow-[#1a3c28]/20 scale-105" : "bg-white border-gray-50 text-[#1a3c28] hover:bg-gray-50"
          )}
        > All Items </button>
        {categories.map((cat, i) => (
          <button
            key={cat.id || i} onClick={() => setCurrentCategory(cat)}
            className={cn(
              "px-10 py-5 rounded-[24px] border-2 font-black text-sm shadow-sm transition-all whitespace-nowrap uppercase tracking-widest",
              currentCategory?.id === cat.id ? "bg-[#1a3c28] border-[#1a3c28] text-white shadow-2xl shadow-[#1a3c28]/20 scale-105" : "bg-white border-gray-50 text-[#1a3c28] hover:bg-gray-50"
            )}
          > {cat.name} </button>
        ))}
      </div>
    </div>

    {/* Product Grid */}
    <div className="mt-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-[2px] w-12 bg-[#1a3c28]"></div>
        <h3 className="text-2xl font-black text-[#1a3c28] tracking-tighter uppercase">
          {searchText ? `SEARCH RESULTS (${menuItems.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase())).length})` : 'POPULAR SELECTIONS'}
        </h3>
      </div>

      {menuItems.filter(i => !searchText || i.name.toLowerCase().includes(searchText.toLowerCase())).length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
          {menuItems
            .filter(i => !searchText || i.name.toLowerCase().includes(searchText.toLowerCase()))
            .slice(0, searchText ? 40 : 20)
            .map((item, index) => (
              <div key={item.id || index} className="bg-white p-6 rounded-[55px] border border-gray-50 flex flex-col gap-6 shadow-sm hover:shadow-2xl hover:border-[#1a3c28]/10 transition-all group cursor-pointer" onClick={() => setOptionsModalItem(item)}>
                <div className="relative aspect-[4/5] w-full rounded-[45px] bg-[#f8f7f2] overflow-hidden shadow-inner flex-shrink-0">
                  {item.image ? (
                    <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (<div className="w-full h-full flex items-center justify-center text-6xl">☕</div>)}
                  <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm border border-gray-100">
                    <Star size={16} className="fill-amber-500 text-amber-500" />
                    <span className="text-sm font-black text-[#1a3c28]">4.9</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between px-2">
                  <div>
                    <h4 className="font-black text-[#1a3c28] text-xl mb-3 group-hover:text-[#1a3c28]/70 transition-colors uppercase tracking-tight leading-tight">{item.name}</h4>
                    <p className="text-[13px] text-gray-400 font-bold line-clamp-2 leading-relaxed h-[40px] mb-6">
                      {item.description || "Expertly crafted signature coffee blend."}
                    </p>
                  </div>
                  <div className="flex justify-between items-center group-hover:bg-[#1a3c28] p-4 rounded-[35px] transition-all duration-500 bg-[#faf9f5]">
                    <span className="font-black text-[#1a3c28] group-hover:text-white text-2xl transition-colors ml-2">${parseFloat(item.price).toFixed(2)}</span>
                    <div className="w-14 h-14 bg-[#1a3c28] group-hover:bg-white text-white group-hover:text-[#1a3c28] rounded-2xl flex items-center justify-center shadow-lg transition-all">
                      <Plus size={28} strokeWidth={4} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="py-24 text-center border-4 border-dashed border-gray-100 rounded-[50px] flex flex-col items-center gap-6">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
            <Search size={40} className="text-gray-200" />
          </div>
          <p className="text-xl font-black text-gray-300 uppercase tracking-widest">No products found for this search</p>
          <button onClick={() => setSearchText("")} className="bg-[#1a3c28] text-white px-10 py-4 rounded-full font-black text-sm shadow-xl active:scale-95 transition-all">TAKE ME BACK</button>
        </div>
      )}
    </div>
  </motion.div>
);

const CategoryView = ({
  currentCategory, setCurrentCategory, menuItems, cart, setIsCartOpen,
  searchText, setSearchText, setOptionsModalItem
}) => {
  const filtered = menuItems.filter(i => {
    const matchCat = currentCategory.name === 'All' || i.category_name === currentCategory.name;
    const matchSearch = !searchText || i.name.toLowerCase().includes(searchText.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col bg-[#faf9f5] pb-[150px]"
    >
      <div className="relative bg-[#1a3c28] pt-20 pb-32 px-10" style={{ borderBottomLeftRadius: '80px', borderBottomRightRadius: '80px' }}>
        <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover mix-blend-overlay">
            <path fill="#ffffff" d="M0,100 C150,200 250,0 400,100 L400,0 L0,0 Z"></path>
          </svg>
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto w-full">
          <div className="flex justify-between items-center text-white mb-14">
            <button
              onClick={() => { setCurrentCategory(null); setSearchText(""); }}
              className="w-16 h-16 flex items-center justify-center hover:bg-white/10 rounded-3xl transition-all active:scale-90 bg-white/5 border border-white/10 backdrop-blur-md group"
            >
              <ChevronLeft size={36} strokeWidth={4} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="text-center">
              <span className="text-xs font-black tracking-[0.4em] opacity-40 block mb-2 uppercase">Menu Gallery</span>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest">{currentCategory.name}</h1>
            </div>
            <button onClick={() => setIsCartOpen(true)} className="w-16 h-16 flex items-center justify-center relative bg-white/10 rounded-3xl border border-white/10 hover:bg-white/20 transition-all">
              <ShoppingCart size={32} />
              {cart.length > 0 && <span className="absolute -top-3 -right-3 w-9 h-9 bg-red-500 rounded-full border-4 border-[#1a3c28] flex items-center justify-center text-sm font-black shadow-xl">{cart.length}</span>}
            </button>
          </div>

          <div className="relative max-w-[800px] mx-auto group">
            <div className="absolute left-7 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors">
              <Search size={26} />
            </div>
            <input
              type="text" placeholder={`Deep search in ${currentCategory.name}...`}
              className="w-full bg-white/10 border border-white/10 rounded-[35px] py-7 pl-18 pr-10 text-xl text-white placeholder:text-white/20 font-bold focus:outline-none focus:bg-white/15 focus:ring-8 focus:ring-white/5 transition-all backdrop-blur-2xl px-10 shadow-2xl"
              value={searchText} onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 px-10 -mt-16 overflow-y-auto no-scrollbar max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
          {filtered.map((item, index) => (
            <div key={item.id || index} className="bg-white p-7 rounded-[60px] border border-gray-50 flex flex-col shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-[#1a3c28]/10 transition-all group overflow-hidden cursor-pointer" onClick={() => setOptionsModalItem(item)}>
              <div className="relative aspect-[3/4] w-full rounded-[45px] bg-[#f4f2ea] overflow-hidden shadow-inner group-hover:scale-[1.03] transition-transform duration-700 border border-gray-100 mb-8">
                {item.image ? (
                  <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                ) : (<div className="w-full h-full flex items-center justify-center text-6xl">☕</div>)}
                <div className="absolute top-6 left-6">
                  <div className="bg-amber-400 text-[#1a3c28] text-[11px] font-black rounded-2xl px-4 py-1.5 shadow-lg backdrop-blur-md uppercase tracking-widest border border-amber-500/20">Chef Select</div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between px-3">
                <div>
                  <h4 className="font-black text-[#1a3c28] text-2xl mb-3 uppercase tracking-tighter leading-none">{item.name}</h4>
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed font-bold h-[40px] mb-8">{item.description || "The ultimate choice for coffee enthusiasts."}</p>
                </div>
                <div className="flex justify-between items-center bg-[#faf9f5] p-4 rounded-[35px] group-hover:bg-[#1a3c28] transition-all duration-500 shadow-inner">
                  <span className="font-black text-[#1a3c28] group-hover:text-white text-3xl transition-colors ml-3 tracking-tighter">${parseFloat(item.price).toFixed(2)}</span>
                  <div className="w-16 h-16 bg-[#1a3c28] group-hover:bg-white text-white group-hover:text-[#1a3c28] rounded-[24px] flex items-center justify-center shadow-xl transition-all">
                    <Plus size={32} strokeWidth={5} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-40 text-[#1a3c28]/10 font-black flex flex-col items-center gap-8">
              <ShoppingCart size={120} className="opacity-10" />
              <p className="text-3xl tracking-tighter uppercase opacity-30">Selection Empty</p>
              <button
                onClick={() => { setCurrentCategory(null); setSearchText(""); }}
                className="px-12 py-5 bg-[#1a3c28] text-white rounded-full text-sm font-black shadow-2xl shadow-[#1a3c28]/40 active:scale-95 transition-all tracking-widest uppercase"
              >Clear Filters</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN APPLICATION ---

const CoffeeMenuApp = () => {
  const [selectedShop, setSelectedShop] = useState(() => {
    const saved = localStorage.getItem('coffee_pos_shop');
    return saved ? JSON.parse(saved) : { business_name: 'Mingly Coffee' };
  });
  const [selectedTable, setSelectedTable] = useState(() => localStorage.getItem('coffee_pos_table') || null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('coffee_pos_cart');
    return saved ? JSON.parse(saved) : [];
  });

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

  useEffect(() => {
    localStorage.setItem('coffee_pos_table', selectedTable);
    localStorage.setItem('coffee_pos_shop', JSON.stringify(selectedShop));
    localStorage.setItem('coffee_pos_cart', JSON.stringify(cart));
  }, [selectedTable, selectedShop, cart]);

  useEffect(() => {
    const profile = getProfile();
    const isGuest = localStorage.getItem("is_guest") === "true";

    if (isGuest && profile?.branch_id) {
      setSelectedShop({
        id: profile.branch_id,
        business_id: profile.business_id,
        name: profile.branch_name || "Main Branch",
        business_name: profile.business_name || "Mingly Coffee",
      });
      setSelectedTable(profile.table_no || null);
      localStorage.removeItem("is_guest");
    }
    const timeout = setTimeout(() => setSplash(false), 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (selectedShop?.id || categories.length === 0) fetchShopProducts();
  }, [selectedShop, currentCategory?.id]);

  const fetchShopProducts = async () => {
    try {
      setLoading(true);
      // Fetch categories once
      if (categories.length === 0) {
        const catRes = await request("category", "get");
        if (catRes?.list) {
          setCategories(catRes.list);
          // Fixed: NEVER auto-select category here
        }
      }

      const productRes = await request("product", "get", {
        branch_id: selectedShop?.id,
        category_id: currentCategory?.id
      });

      if (productRes?.list) {
        setMenuItems(productRes.list);
        let sizesMap = {};
        productRes.list.forEach(p => {
          if (p.sizes) {
            try {
              const parsed = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
              sizesMap[p.id] = parsed.map(s => ({ ...s, price: parseFloat(s.price || 0) }));
            } catch (e) { }
          }
        });
        setProductSizes(sizesMap);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateItemPrice = (item, size) => {
    let base = parseFloat(item.price || 0);
    if (size) base = parseFloat(size.price || 0);
    return base;
  };

  const addToCart = (item, size, qty) => {
    const price = calculateItemPrice(item, size);
    const cartItem = {
      ...item,
      size,
      quantity: qty,
      totalPrice: price * qty
    };
    setCart([...cart, cartItem]);
    message.success(`${item.name} added to bag!`);
    setIsCartOpen(true);
  };

  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.totalPrice, 0);

  if (splash) return <SplashView businessName={selectedShop?.business_name} />;

  return (
    <MainWrapper>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex items-center justify-center">
            <div className="w-16 h-16 border-8 border-[#1a3c28]/5 border-t-[#1a3c28] rounded-full animate-spin"></div>
          </motion.div>
        ) : (currentCategory) ? (
          <CategoryView
            key="category"
            currentCategory={currentCategory} setCurrentCategory={setCurrentCategory}
            menuItems={menuItems} cart={cart} setIsCartOpen={setIsCartOpen}
            searchText={searchText} setSearchText={setSearchText} setOptionsModalItem={setOptionsModalItem}
          />
        ) : (
          <HomeView
            key="home"
            selectedShop={selectedShop} categories={categories}
            currentCategory={currentCategory} setCurrentCategory={setCurrentCategory}
            menuItems={menuItems} cart={cart} setIsCartOpen={setIsCartOpen}
            searchText={searchText} setSearchText={setSearchText}
            getTotalPrice={getTotalPrice} setOptionsModalItem={setOptionsModalItem}
            setActiveTab={setActiveTab}
          />
        )}
      </AnimatePresence>

      {/* Optimized Floating Bottom Navigation */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-80px)] max-w-[700px] h-[95px] bg-[#0c2b18] rounded-[48px] flex justify-between items-center px-14 shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-50 border border-white/10 backdrop-blur-2xl">
        <button
          onClick={() => { setActiveTab('home'); setCurrentCategory(null); setSearchText(""); }}
          className={cn("flex flex-col items-center gap-1.5 transition-all active:scale-75", activeTab === 'home' && !isCartOpen ? "text-white scale-110" : "text-white/20 hover:text-white/40")}
        >
          <Home size={28} className={activeTab === 'home' && !isCartOpen ? "fill-white" : ""} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Home</span>
        </button>
        <button
          onClick={() => { setActiveTab('order'); setIsCartOpen(true); }}
          className={cn("flex flex-col items-center gap-1.5 relative transition-all active:scale-75", isCartOpen ? "text-white scale-110" : "text-white/20 hover:text-white/40")}
        >
          <FileText size={28} className={isCartOpen ? "fill-white" : ""} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Order</span>
          {cart.length > 0 && <div className="absolute top-0 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0c2b18] shadow-lg"></div>}
        </button>
        <button
          onClick={() => setActiveTab('starred')}
          className={cn("flex flex-col items-center gap-1.5 transition-all active:scale-75", activeTab === 'starred' ? "text-white scale-110" : "text-white/20 hover:text-white/40")}
        >
          <Star size={28} className={activeTab === 'starred' ? "fill-white" : ""} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Starred</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={cn("flex flex-col items-center gap-1.5 transition-all active:scale-75", activeTab === 'profile' ? "text-white scale-110" : "text-white/20 hover:text-white/40")}
        >
          <User size={28} className={activeTab === 'profile' ? "fill-white" : ""} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Profile</span>
        </button>
      </div>

      {/* Premium Modals */}
      <Modal
        open={!!optionsModalItem} onCancel={() => setOptionsModalItem(null)}
        footer={null} centered width={480} destroyOnClose className="mobile-modal"
        closeIcon={<div className="bg-[#faf9f5] p-3 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"><X size={20} /></div>}
      >
        <ProductOptionsModal
          item={optionsModalItem} productSizes={productSizes} calculateItemPrice={calculateItemPrice}
          onAdd={(item, size, qty) => { addToCart(item, size, qty); setOptionsModalItem(null); }}
        />
      </Modal>

      <Modal
        open={isCartOpen}
        onCancel={() => { setIsCartOpen(false); setActiveTab('home'); }}
        footer={null} title={<div className="flex flex-col items-center py-4"><span className="text-[10px] font-black tracking-[0.5em] text-[#1a3c28]/20 uppercase mb-1">Items in your</span><span className="font-black text-3xl text-[#1a3c28] uppercase tracking-tighter">Shopping Bag</span></div>}
        centered width={550} className="mobile-modal font-sans"
        closeIcon={<div className="bg-[#faf9f5] p-3 rounded-full transition-all shadow-sm mt-4"><X size={20} /></div>}
      >
        {cart.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-[#faf9f5] rounded-full flex items-center justify-center mb-4">
              <ShoppingCart size={40} className="text-[#1a3c28]/10" />
            </div>
            <p className="text-[#1a3c28]/30 font-black uppercase tracking-widest text-sm">Your basket is quite lonely</p>
            <button onClick={() => { setIsCartOpen(false); setActiveTab('home'); }} className="mt-4 px-12 py-5 bg-[#1a3c28] text-white rounded-full text-xs font-black shadow-2xl active:scale-95 transition-all tracking-widest uppercase">Start Adding Items</button>
          </div>
        ) : (
          <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2 no-scrollbar px-2 mt-4">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#faf9f5] p-6 rounded-[40px] border border-gray-100 group hover:shadow-lg transition-all">
                <div className="flex gap-6 items-center">
                  <div className="w-20 h-20 rounded-[28px] bg-white overflow-hidden shadow-sm flex-shrink-0 border border-gray-50">
                    {item.image ? <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-50 text-2xl">☕</div>}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-black text-[#1a3c28] text-xl leading-tight mb-2 uppercase tracking-tighter">{item.name}</h4>
                    <div className="flex gap-3">
                      <span className="text-[10px] bg-white px-3 py-1 rounded-xl font-black text-[#1a3c28]/40 border border-gray-100 uppercase tracking-widest">Qty: {item.quantity}</span>
                      {item.size?.name && <span className="text-[10px] bg-[#1a3c28]/5 px-3 py-1 rounded-xl font-black text-[#1a3c28]/60 border border-[#1a3c28]/10 uppercase tracking-widest">{item.size.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-black text-[#1a3c28] text-2xl tracking-tighter">${item.totalPrice.toFixed(2)}</span>
                  <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="w-12 h-12 bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-sm hover:bg-red-50 hover:scale-110 transition-all border border-gray-50"><X size={20} strokeWidth={3} /></button>
                </div>
              </div>
            ))}
            <div className="pt-10 border-t-4 border-[#1a3c28]/5 flex justify-between items-baseline px-4 mt-4">
              <span className="font-black text-[#1a3c28]/20 text-sm tracking-[0.4em] uppercase">Total Balance</span>
              <span className="font-black text-5xl text-[#1a3c28] tracking-tighter">${getTotalPrice().toFixed(2)}</span>
            </div>
            <button
              onClick={() => { message.success("Order Placed Successfully!"); setCart([]); setIsCartOpen(false); setActiveTab('home'); }}
              className="w-full bg-[#1a3c28] text-white py-7 rounded-[35px] font-black text-2xl mt-10 shadow-[0_25px_50px_-12px_rgba(26,60,40,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-5 uppercase tracking-[0.2em]"
            >
              Confirm Order
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <ChevronLeft size={24} className="rotate-180" strokeWidth={4} />
              </div>
            </button>
          </div>
        )}
      </Modal>
    </MainWrapper>
  );
};

export default CoffeeMenuApp;
