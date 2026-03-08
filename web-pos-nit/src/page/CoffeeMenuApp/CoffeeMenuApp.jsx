import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Menu, Search, ShoppingCart, Plus, Minus, X,
  Home, FileText, Star, User, ChevronLeft,
  Tag
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
    <div className="max-w-[1400px] mx-auto min-h-screen relative flex flex-col sm:px-6 lg:px-8">
      <div className="w-full h-full relative flex flex-col no-scrollbar bg-white sm:bg-transparent sm:shadow-none shadow-sm min-h-screen">
        {children}
      </div>
    </div>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
      .font-sans { font-family: 'Outfit', sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .mobile-modal .ant-modal-content { border-radius: 32px !important; padding: 24px !important; }
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
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mb-4 text-[#1a3c28]">
        <path d="M4.5 9h15M4.5 13.5h15M6 4.5v15a3 3 0 003 3h6a3 3 0 003-3v-15a3 3 0 00-3-3H9a3 3 0 00-3 3z" />
        <path d="M15 4.5V2m-6 2.5V2" />
      </svg>
      <h1 className="text-[28px] font-black uppercase text-center leading-[0.9] tracking-tight">
        {businessName?.toUpperCase() || "GREEN GROUND"}<br />
        COFFEE
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
    <div className="space-y-6 pt-2 pb-4 font-sans">
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-[20px] bg-[#f4f2ea] overflow-hidden flex-shrink-0">
          {item.image ? (
            <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" />
          ) : (<div className="w-full h-full flex items-center justify-center text-3xl">☕</div>)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1a3c28]">{item.name}</h2>
          <p className="text-[#1a3c28] font-black text-2xl mt-2">
            ${calculateItemPrice(item, selectedSize).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {productSizes[item.id]?.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#1a3c28]">Select Size</p>
            <div className="flex flex-wrap gap-2">
              {productSizes[item.id].map(size => (
                <button
                  key={size.id}
                  onClick={() => setSelSize(size)}
                  className={cn(
                    "px-4 py-2 rounded-xl border border-transparent text-sm font-bold transition-all",
                    selectedSize?.id === size.id ? "bg-[#1a3c28] text-white shadow-md shadow-[#1a3c28]/20" : "bg-white border-gray-100 text-[#1a3c28] hover:bg-gray-50"
                  )}
                > {size.name} </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 flex items-center justify-between gap-4">
          <div className="flex items-center bg-white rounded-[20px] p-1 border border-gray-100 shadow-sm">
            <button onClick={() => setItemQty(q => Math.max(1, q - 1))} className="w-12 h-12 flex items-center justify-center text-[#1a3c28] hover:bg-gray-50 rounded-[14px] transition-colors"> <Minus size={20} /> </button>
            <span className="w-8 text-center font-bold text-[#1a3c28] text-lg">{itemQty}</span>
            <button onClick={() => setItemQty(q => q + 1)} className="w-12 h-12 flex items-center justify-center text-[#1a3c28] hover:bg-gray-50 rounded-[14px] transition-colors"> <Plus size={20} /> </button>
          </div>
          <button
            onClick={() => onAdd(item, selectedSize, itemQty)}
            className="flex-1 bg-[#1a3c28] text-white py-4 rounded-[20px] font-bold text-lg shadow-lg hover:bg-[#12281a] active:scale-95 transition-all"
          > Add to Cart </button>
        </div>
      </div>
    </div>
  );
};

// --- VIEW COMPONENTS ---

const HomeView = ({
  selectedShop, categories, currentCategory, setCurrentCategory,
  menuItems, cart, setIsCartOpen, searchText, setSearchText,
  getTotalPrice, setOptionsModalItem
}) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="flex-1 flex flex-col px-5 pb-[130px] pt-4"
  >
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-[24px] font-black uppercase leading-[0.95] tracking-tight text-[#1a3c28]">
        {selectedShop?.business_name?.toUpperCase() || "GREEN GROUND"}<br />
        COFFEE
      </h1>
      <div className="flex items-center gap-3">
        <button className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm hover:bg-gray-50">
          <Bell size={20} className="text-[#1a3c28]" />
        </button>
        <button className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm hover:bg-gray-50">
          <Menu size={20} className="text-[#1a3c28]" />
        </button>
      </div>
    </div>

    <div className="max-w-[800px] w-full mx-auto">
      <div className="relative mb-8">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={22} />
        </div>
        <input
          type="text" placeholder="Search your favorite coffee..."
          className="w-full bg-white border border-gray-100 rounded-2xl py-5 pl-14 pr-6 text-base font-medium focus:outline-none focus:ring-4 focus:ring-[#1a3c28]/5 shadow-sm transition-all"
          value={searchText} onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-[#fffcf5] border border-[#f0ead2] rounded-[40px] overflow-hidden flex shadow-sm relative min-h-[160px] group cursor-pointer hover:shadow-md transition-all">
          <div className="p-8 flex-1 pr-32 relative z-10">
            <h3 className="font-black text-[#1a3c28] text-lg mb-2 tracking-tight">REFER & EARN</h3>
            <p className="text-sm text-[#1a3c28] opacity-70 mb-5 font-medium">Win Cashback of up to 10% on your next visit.</p>
            <button className="bg-[#1a3c28] text-white px-6 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#1a3c28]/20 group-hover:scale-105 transition-transform">Invite Friends</button>
          </div>
          <div className="absolute right-0 bottom-0 w-[160px] h-[160px] translate-x-4 translate-y-4">
            <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 blur-3xl"></div>
            <div className="w-36 h-36 rounded-full overflow-hidden absolute bottom-4 right-4 border-4 border-white shadow-xl bg-[#1a3c28]">
              <img src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" />
            </div>
          </div>
        </div>

        {cart.length > 0 && (
          <div className="bg-[#1a3c28] rounded-[40px] p-8 text-white shadow-xl shadow-[#1a3c28]/20 cursor-pointer group flex flex-col justify-between" onClick={() => setIsCartOpen(true)}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="font-black text-xl">In Your Cart</span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">{cart.length}</span>
              </div>
              <span className="font-black text-[10px] tracking-widest opacity-60">CHECKOUT</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-bold text-white/50 block mb-1">TOTAL</span>
                <span className="font-black text-3xl">${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="px-6 py-3 bg-white/10 group-hover:bg-white/20 rounded-2xl text-sm font-black transition-all">Place Order</div>
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-[#1a3c28]">Categories</h3>
        <span className="text-sm font-bold text-[#1a3c28] opacity-40 hover:opacity-100 cursor-pointer transition-opacity" onClick={() => setCurrentCategory({ name: 'All' })}>See all items</span>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 pb-4">
        <button
          onClick={() => setCurrentCategory(null)}
          className={cn(
            "px-8 py-4 rounded-full border border-gray-100 font-black text-sm shadow-sm transition-all whitespace-nowrap",
            currentCategory === null ? "bg-[#1a3c28] text-white scale-105" : "bg-white text-[#1a3c28] hover:bg-gray-50"
          )}
        > All Items </button>
        {categories.map((cat, i) => (
          <button
            key={cat.id || i} onClick={() => setCurrentCategory(cat)}
            className={cn(
              "px-8 py-4 rounded-full border border-gray-100 font-black text-sm shadow-sm transition-all whitespace-nowrap",
              currentCategory?.id === cat.id ? "bg-[#1a3c28] text-white scale-105" : "bg-white text-[#1a3c28] hover:bg-gray-50"
            )}
          > {cat.name} </button>
        ))}
      </div>
    </div>

    <div className="mt-10">
      <h3 className="text-xl font-black text-[#1a3c28] mb-8">
        {searchText ? `Results (${menuItems.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase())).length})` : 'Popular Items'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {menuItems
          .filter(i => !searchText || i.name.toLowerCase().includes(searchText.toLowerCase()))
          .slice(0, searchText ? 40 : 16)
          .map((item, index) => (
            <div key={item.id || index} className="bg-white p-5 rounded-[40px] border border-gray-50 flex flex-col gap-5 shadow-sm hover:shadow-xl hover:border-[#1a3c28]/10 transition-all group cursor-pointer" onClick={() => setOptionsModalItem(item)}>
              <div className="relative aspect-square w-full rounded-[30px] bg-[#f8f7f2] overflow-hidden shadow-inner flex-shrink-0">
                {item.image ? (
                  <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (<div className="w-full h-full flex items-center justify-center text-5xl">☕</div>)}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-sm">
                  <Star size={14} className="fill-amber-500 text-amber-500" />
                  <span className="text-xs font-black text-[#1a3c28]">4.9</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between px-1">
                <div>
                  <h4 className="font-black text-[#1a3c28] text-lg mb-2 group-hover:text-[#1a3c28]/80 transition-colors uppercase tracking-tight">{item.name}</h4>
                  <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed h-[36px] mb-4">
                    {item.description || "Freshly brewed using our signature house blend for a perfect start to your day."}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-[#1a3c28] text-2xl">${parseFloat(item.price).toFixed(2)}</span>
                  <div className="w-12 h-12 bg-[#1a3c28] text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-90 transition-all">
                    <Plus size={24} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
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
      className="flex-1 flex flex-col bg-[#faf9f5] pb-[130px]"
    >
      <div className="relative bg-[#1a3c28] pt-16 pb-24 px-8" style={{ borderBottomLeftRadius: '60px', borderBottomRightRadius: '60px' }}>
        <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover mix-blend-overlay">
            <path fill="#ffffff" d="M0,100 C150,200 250,0 400,100 L400,0 L0,0 Z"></path>
          </svg>
        </div>

        <div className="relative z-10 max-w-[1000px] mx-auto w-full">
          <div className="flex justify-between items-center text-white mb-10 px-1">
            <button onClick={() => setCurrentCategory(null)} className="w-14 h-14 flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all active:scale-95 bg-white/5 border border-white/10 backdrop-blur-sm">
              <ChevronLeft size={32} strokeWidth={3} />
            </button>
            <div className="text-center">
              <span className="text-[10px] font-black tracking-[0.3em] opacity-50 block mb-1 uppercase">Selection</span>
              <h1 className="text-3xl font-black uppercase tracking-widest">{currentCategory.name}</h1>
            </div>
            <button onClick={() => setIsCartOpen(true)} className="w-14 h-14 flex items-center justify-center relative bg-white/10 rounded-2xl border border-white/10">
              <ShoppingCart size={28} />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full border-4 border-[#1a3c28] flex items-center justify-center text-[11px] font-black">{cart.length}</span>}
            </button>
          </div>

          <div className="relative max-w-[700px] mx-auto">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40">
              <Search size={22} />
            </div>
            <input
              type="text" placeholder={`Search in ${currentCategory.name}...`}
              className="w-full bg-white/10 border border-white/10 rounded-[28px] py-6 pl-16 pr-8 text-white text-lg placeholder:text-white/30 font-bold focus:outline-none focus:bg-white/15 focus:ring-4 focus:ring-white/5 transition-all backdrop-blur-xl"
              value={searchText} onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 -mt-12 overflow-y-auto no-scrollbar max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtered.map((item, index) => (
            <div key={item.id || index} className="bg-white p-6 rounded-[50px] border border-gray-50 flex flex-col shadow-sm hover:shadow-2xl hover:border-[#1a3c28]/10 transition-all group overflow-hidden cursor-pointer" onClick={() => setOptionsModalItem(item)}>
              <div className="relative aspect-[4/5] w-full rounded-[40px] bg-[#f4f2ea] overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform duration-700 border border-gray-100 mb-6">
                {item.image ? (
                  <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                ) : (<div className="w-full h-full flex items-center justify-center text-5xl">☕</div>)}
                <div className="absolute top-5 left-5">
                  <Tag color="gold" className="text-[10px] border-none font-black rounded-xl px-3 py-1 shadow-sm backdrop-blur-md bg-amber-400 text-[#1a3c28]">PREMIUM</Tag>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between px-2">
                <div>
                  <h4 className="font-black text-[#1a3c28] text-xl mb-2 uppercase tracking-tight">{item.name}</h4>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-bold h-[32px] mb-6">{item.description || "Experience the richness of our expert crafted brew."}</p>
                </div>
                <div className="flex justify-between items-center bg-[#faf9f5] p-3 rounded-3xl group-hover:bg-[#1a3c28] transition-colors duration-500">
                  <span className="font-black text-[#1a3c28] group-hover:text-white text-2xl transition-colors ml-2">${parseFloat(item.price).toFixed(2)}</span>
                  <div className="w-12 h-12 bg-[#1a3c28] group-hover:bg-white text-white group-hover:text-[#1a3c28] rounded-2xl flex items-center justify-center shadow-md transition-all">
                    <Plus size={24} strokeWidth={4} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-32 text-[#1a3c28]/20 font-black flex flex-col items-center gap-6">
              <ShoppingCart size={80} className="opacity-10" />
              <p className="text-2xl tracking-tighter uppercase opacity-40">No products found</p>
              <button onClick={() => setSearchText("")} className="px-8 py-3 bg-[#1a3c28] text-white rounded-full text-sm font-black shadow-lg shadow-[#1a3c28]/20 active:scale-95 transition-all">Clear Search</button>
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
    return saved ? JSON.parse(saved) : null;
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
    if (localStorage.getItem("is_guest") === "true" && profile?.branch_id) {
      setSelectedShop({
        id: profile.branch_id,
        business_id: profile.business_id,
        name: profile.branch_name || "Branch",
        business_name: profile.branch_name || "Mingly Coffee",
      });
      setSelectedTable(profile.table_no || null);
      localStorage.removeItem("is_guest");
    }
    const timeout = setTimeout(() => setSplash(false), 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (selectedShop?.id) fetchShopProducts();
  }, [selectedShop, currentCategory?.id]);

  const fetchShopProducts = async () => {
    try {
      setLoading(true);
      if (categories.length === 0) {
        const catRes = await request("category", "get");
        if (catRes?.list) {
          setCategories(catRes.list);
          // Changed: Do NOT auto-set the first category as currentCategory anymore
          // This fixes the "Dessert category showing first" issue
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
    message.success(`${item.name} added to cart!`);
    setIsCartOpen(true);
  };

  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.totalPrice, 0);

  if (splash) return <SplashView businessName={selectedShop?.business_name} />;

  return (
    <MainWrapper>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#1a3c28]/10 border-t-[#1a3c28] rounded-full animate-spin"></div>
          </motion.div>
        ) : currentCategory && activeTab === 'home' ? (
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
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Improved for Laptop */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-64px)] max-w-[600px] h-[85px] bg-[#0c2b18] rounded-[42px] flex justify-between items-center px-12 shadow-[0_20px_50px_rgba(0,0,0,0.4)] z-50 border border-white/5 backdrop-blur-md">
        <button onClick={() => { setActiveTab('home'); setCurrentCategory(null); }} className={cn("flex flex-col items-center gap-1 transition-all active:scale-90", activeTab === 'home' ? "text-white" : "text-white/30 hover:text-white/50")}>
          <Home size={26} className={activeTab === 'home' ? "fill-white" : ""} />
          <span className="text-[11px] font-black uppercase tracking-wider">Home</span>
        </button>
        <button onClick={() => { setActiveTab('order'); setIsCartOpen(true); }} className={cn("flex flex-col items-center gap-1 relative transition-all active:scale-90", activeTab === 'order' ? "text-white" : "text-white/30 hover:text-white/50")}>
          <FileText size={26} className={activeTab === 'order' ? "fill-white" : ""} />
          <span className="text-[11px] font-black uppercase tracking-wider">Order</span>
          {cart.length > 0 && <span className="absolute -top-1 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0c2b18] shadow-sm"></span>}
        </button>
        <button onClick={() => setActiveTab('starred')} className={cn("flex flex-col items-center gap-1 transition-all active:scale-90", activeTab === 'starred' ? "text-white" : "text-white/30 hover:text-white/50")}>
          <Star size={26} className={activeTab === 'starred' ? "fill-white" : ""} />
          <span className="text-[11px] font-black uppercase tracking-wider">Starred</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={cn("flex flex-col items-center gap-1 transition-all active:scale-90", activeTab === 'profile' ? "text-white" : "text-white/30 hover:text-white/50")}>
          <User size={26} className={activeTab === 'profile' ? "fill-white" : ""} />
          <span className="text-[11px] font-black uppercase tracking-wider">Profile</span>
        </button>
      </div>

      {/* Modals */}
      <Modal
        open={!!optionsModalItem} onCancel={() => setOptionsModalItem(null)}
        footer={null} centered width={400} destroyOnClose className="mobile-modal"
        closeIcon={<div className="bg-gray-100 p-2.5 rounded-full hover:bg-gray-200 transition-colors"><X size={18} /></div>}
      >
        <ProductOptionsModal
          item={optionsModalItem} productSizes={productSizes} calculateItemPrice={calculateItemPrice}
          onAdd={(item, size, qty) => { addToCart(item, size, qty); setOptionsModalItem(null); }}
        />
      </Modal>

      <Modal
        open={isCartOpen}
        onCancel={() => { setIsCartOpen(false); if (activeTab === 'order') setActiveTab('home'); }}
        footer={null} title={<span className="font-black text-xl text-[#1a3c28] uppercase tracking-widest px-2">Your Basket</span>} centered width={450} className="mobile-modal font-sans"
      >
        {cart.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-2">
              <ShoppingCart size={32} className="text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold tracking-tight">Your basket is currently empty.</p>
            <button onClick={() => setIsCartOpen(false)} className="mt-4 px-8 py-3 bg-[#1a3c28] text-white rounded-full text-xs font-black shadow-lg active:scale-95 transition-all">Start Shopping</button>
          </div>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar px-2">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#faf9f5] p-5 rounded-[32px] border border-gray-100 group">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden shadow-sm flex-shrink-0">
                    {item.image ? <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-50">☕</div>}
                  </div>
                  <div>
                    <h4 className="font-black text-[#1a3c28] text-base leading-tight mb-1">{item.name}</h4>
                    <div className="flex gap-2">
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg font-black text-[#1a3c28]/40 border border-gray-100 uppercase tracking-tighter">Qty: {item.quantity}</span>
                      {item.size?.name && <span className="text-[10px] bg-[#1a3c28]/5 px-2 py-0.5 rounded-lg font-black text-[#1a3c28]/60 border border-[#1a3c28]/10 uppercase tracking-tighter">{item.size.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-[#1a3c28] text-lg">${item.totalPrice.toFixed(2)}</span>
                  <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="w-10 h-10 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"><X size={18} /></button>
                </div>
              </div>
            ))}
            <div className="pt-8 border-t border-dashed border-gray-200 flex justify-between items-baseline px-2">
              <span className="font-black text-gray-400 text-sm tracking-widest uppercase">Subtotal</span>
              <span className="font-black text-4xl text-[#1a3c28] tracking-tighter">${getTotalPrice().toFixed(2)}</span>
            </div>
            <button
              onClick={() => { message.success("Order Placed Successfully!"); setCart([]); setIsCartOpen(false); setActiveTab('home'); }}
              className="w-full bg-[#1a3c28] text-white py-6 rounded-[30px] font-black text-xl mt-6 shadow-2xl shadow-[#1a3c28]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              Confirm Order
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <ChevronLeft size={20} className="rotate-180" />
              </div>
            </button>
          </div>
        )}
      </Modal>
    </MainWrapper>
  );
};

export default CoffeeMenuApp;
