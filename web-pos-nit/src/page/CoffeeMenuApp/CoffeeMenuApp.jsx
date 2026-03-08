import React, { useState, useEffect } from 'react';
import {
  Bell, Menu, Search, ShoppingCart, Plus, Minus, X,
  MapPin, Clock, Home, FileText, Star, User, ChevronLeft,
  Tag
} from 'lucide-react';
import { request } from '../../util/helper';
import { Config } from '../../util/config';
import { getProfile } from '../../store/profile.store';
import { message, Modal, Badge } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

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
    <div className="space-y-6 pt-2 pb-4">
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-[20px] bg-[#f4f2ea] overflow-hidden flex-shrink-0">
          {item.image ? (
            <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" />
          ) : (<div className="w-full h-full flex items-center justify-center text-3xl">☕</div>)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1a3c28]">{item.name}</h2>
          <p className="text-[#1a3c28] font-black text-2xl mt-2">
            ${calculateItemPrice(item, selectedSize, []).toFixed(2)}
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
            onClick={() => onAdd(item, selectedSize, [], '', '', itemQty)}
            className="flex-1 bg-[#1a3c28] text-white py-4 rounded-[20px] font-bold text-lg shadow-[0_8px_20px_rgba(26,60,40,0.3)] hover:bg-[#12281a] transition-all transform active:scale-95"
          > Add to Cart </button>
        </div>
      </div>
    </div>
  );
};

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

  useEffect(() => {
    localStorage.setItem('coffee_pos_table', selectedTable);
    localStorage.setItem('coffee_pos_shop', JSON.stringify(selectedShop));
    localStorage.setItem('coffee_pos_cart', JSON.stringify(cart));
  }, [selectedTable, selectedShop, cart]);

  useEffect(() => {
    const isGuest = localStorage.getItem("is_guest") === "true";
    const profile = getProfile();
    if (isGuest && profile?.branch_id) {
      setSelectedShop({
        id: profile.branch_id,
        business_id: profile.business_id,
        name: profile.branch_name || "Branch",
        business_name: profile.business_name || "Green Grounds Coffee",
      });
      setSelectedTable(profile.table_no || null);
      localStorage.removeItem("is_guest");
    }

    // Splash timeout
    setTimeout(() => setSplash(false), 2000);
  }, []);

  useEffect(() => {
    if (selectedShop?.id) {
      fetchShopProducts();
    }
  }, [selectedShop, currentCategory?.id]);

  const fetchShopProducts = async () => {
    try {
      // 1. Fetch Categories
      const catRes = await request("category", "get");
      if (catRes && catRes.list) {
        setCategories(catRes.list);
        if (catRes.list.length > 0 && !currentCategory) {
          setCurrentCategory(catRes.list[0]);
        }
      }

      // 2. Fetch Products for current category
      const productRes = await request("product", "get", {
        branch_id: selectedShop?.id,
        category_id: currentCategory?.id
      });

      if (productRes && productRes.list) {
        setMenuItems(productRes.list);

        let sizesMap = {};
        productRes.list.forEach(p => {
          if (p.sizes) {
            try {
              const parsed = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
              sizesMap[p.id] = parsed.map(s => ({ ...s, price: parseFloat(s.price || 0) }));
            } catch (e) {
              console.error("Size parse error for product", p.id);
            }
          }
        });
        setProductSizes(sizesMap);
      }
    } catch (error) {
      console.error('Error fetching shop products:', error);
    }
  };

  const calculateItemPrice = (item, size, addons) => {
    let basePrice = size && size.price ? parseFloat(size.price) : parseFloat(item.price || 0);
    return basePrice - (basePrice * (parseFloat(item.discount || 0) / 100));
  };

  const addToCart = (item, selectedSize, selectedAddons, temperature, sugarLevel, quantity = 1) => {
    const unitPrice = calculateItemPrice(item, selectedSize, selectedAddons);
    const cartItem = {
      cart_id: Date.now(),
      product_id: item.id,
      name: item.name,
      size: selectedSize,
      quantity: Number(quantity),
      discountedPrice: unitPrice,
      totalPrice: unitPrice * Number(quantity),
      image: item.image,
    };
    setCart(prev => [...prev, cartItem]);
    message.success(`${item.name} added!`);
  };

  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Layout Wrapper - Responsive for all devices
  const MainWrapper = ({ children, bgClass = "bg-[#faf9f5]" }) => (
    <div className={cn("min-h-screen font-sans tracking-tight", bgClass)}>
      <div className="max-w-[1200px] mx-auto min-h-screen relative flex flex-col shadow-sm bg-white sm:bg-transparent">
        <div className="w-full h-full relative flex flex-col no-scrollbar">
          {children}
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );

  if (splash) {
    return (
      <MainWrapper bgClass="bg-[#f2f1e9]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full grow flex flex-col items-center justify-center text-[#1a3c28]"
        >
          <div className="flex flex-col items-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mb-4 text-[#1a3c28]">
              <path d="M4.5 9h15M4.5 13.5h15M6 4.5v15a3 3 0 003 3h6a3 3 0 003-3v-15a3 3 0 00-3-3H9a3 3 0 00-3 3z" />
              <path d="M15 4.5V2m-6 2.5V2" />
            </svg>
            <h1 className="text-[28px] font-black uppercase text-center leading-[0.9] tracking-tight">
              {selectedShop?.business_name?.toUpperCase() || "GREEN GROUND"}<br />
              COFFEE
            </h1>
          </div>
        </motion.div>
      </MainWrapper>
    );
  }

  // --- COMPONENT VIEWS ---
  const HomeViewComponent = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col px-5 pb-[100px]">

      <div className="flex justify-between items-center mt-4">
        <h1 className="text-[20px] font-black uppercase leading-[0.95] tracking-tight text-[#1a3c28]">
          {selectedShop?.business_name?.toUpperCase() || "GREEN GROUND"}<br />
          COFFEE
        </h1>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center relative bg-white">
            <Bell size={18} className="text-[#1a3c28]" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white">
            <Menu size={18} className="text-[#1a3c28]" />
          </button>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="mt-6 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search your favorite coffee..."
          className="w-full bg-white border border-gray-100 rounded-[20px] py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1a3c28]/5 transition-all shadow-sm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Refer Banner */}
      <div className="mt-8 bg-[#fffcf5] border border-[#f0ead2] rounded-[24px] overflow-hidden flex shadow-sm relative">
        <div className="p-5 flex-1 pr-24 relative z-10">
          <h3 className="font-extrabold text-[#1a3c28] text-base mb-1 tracking-tight">REFER & EARN</h3>
          <p className="text-xs text-[#1a3c28] opacity-70 mb-4 leading-snug font-medium">Win Cashback of up to 10% on your next visit to {selectedShop?.name || 'us'}.</p>
          <button className="bg-[#1a3c28] text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-wide shadow-lg shadow-[#1a3c28]/20 active:scale-95 transition-transform">Invite Friends</button>
        </div>
        <div className="absolute right-0 bottom-0 w-[140px] h-[140px] translate-x-8 translate-y-4">
          <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 blur-2xl"></div>
          <div className="w-32 h-32 rounded-full overflow-hidden absolute bottom-2 left-0 border-4 border-white shadow-lg bg-[#1a3c28]">
            <img src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" />
          </div>
        </div>
      </div>

      {/* Active Order Tracker - Only show if there's an active process or cart */}
      {
        cart.length > 0 && (
          <div className="mt-5 bg-[#1a3c28] rounded-[28px] p-5 text-white shadow-lg shadow-[#1a3c28]/20 cursor-pointer group" onClick={() => setIsCartOpen(true)}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">In Your Cart</span>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{cart.length}</span>
              </div>
              <span className="font-black text-[10px] tracking-widest opacity-60">READY</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white/70">Estimated Total</span>
              <span className="font-black text-lg">${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="w-full py-3 bg-white/10 group-hover:bg-white/20 rounded-xl text-xs font-bold transition-all text-center">Place Your Order Now</div>
          </div>
        )
      }

      {/* Categories Horizontal */}
      <div className="mt-8">
        <div className="flex justify-between items-end mb-4 pr-1">
          <h3 className="text-lg font-bold text-[#1a3c28]">Categories</h3>
          <span className="text-sm font-bold text-[#1a3c28] opacity-50 cursor-pointer hover:opacity-100" onClick={() => setCurrentCategory({ name: 'All' })}>See all</span>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
          <button
            onClick={() => setCurrentCategory({ name: 'All' })}
            className={cn(
              "px-5 py-2.5 rounded-full border border-gray-100 font-bold text-sm whitespace-nowrap shadow-sm active:scale-95 transition-all",
              currentCategory?.name === 'All' ? "bg-[#1a3c28] text-white" : "bg-white text-[#1a3c28]"
            )}
          > All Items </button>
          {categories.map((cat, i) => (
            <button
              key={cat.id || i}
              onClick={() => setCurrentCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-full border border-gray-100 font-bold text-sm whitespace-nowrap shadow-sm active:scale-95 transition-all text-[#1a3c28]",
                currentCategory?.id === cat.id ? "bg-[#1a3c28] text-white" : "bg-white"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Featured/Search Results */}
      <div className="mt-6">
        <div className="flex justify-between items-end mb-5">
          <h3 className="text-lg font-bold text-[#1a3c28]">
            {searchText ? `Results (${menuItems.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase())).length})` : 'Popular Items'}
          </h3>
          <span onClick={() => setCurrentCategory({ name: 'All' })} className="text-sm font-bold text-[#1a3c28] opacity-50 hover:opacity-100 cursor-pointer transition-opacity">See all</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems
            .filter(i => !searchText || i.name.toLowerCase().includes(searchText.toLowerCase()))
            .slice(0, searchText ? 20 : 12)
            .map((item, index) => (
              <div key={item.id || index} className="bg-white p-3 pr-4 rounded-[28px] border border-gray-100 flex gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.02)] items-center cursor-pointer hover:border-[#1a3c28]/20 hover:shadow-md transition-all group" onClick={() => setOptionsModalItem(item)}>
                <div className="flex-1 pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[#1a3c28] text-base truncate">{item.name}</h4>
                    <span className="bg-yellow-100 flex items-center gap-1 text-[10px] text-yellow-700 px-1.5 py-0.5 rounded-md font-bold">
                      <Star size={10} className="fill-yellow-500 text-yellow-500" /> 4.9
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium leading-tight mb-3 line-clamp-2">
                    {item.description || "Freshly brewed using our premium signature house blend."}
                  </p>
                  <span className="font-black text-[#1a3c28] text-lg">${parseFloat(item.price).toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-center gap-2 relative">
                  <div className="w-20 h-20 rounded-[20px] bg-[#f8f7f2] overflow-hidden -mr-1 shadow-inner border border-gray-50 group-hover:scale-105 transition-transform">
                    {item.image ? (
                      <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl bg-gray-50">☕</div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-[#1a3c28] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#1a3c28]/20 group-hover:scale-110 active:scale-90 transition-all z-10">
                    <Plus size={18} strokeWidth={3} />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );

  const CategoryViewComponent = () => {
    // Filter items by category
    const catItems = currentCategory.name === 'All' ? menuItems : menuItems.filter(i => i.category_name === currentCategory.name);

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col bg-[#faf9f5] pb-[120px]">
        {/* Wavy Header */}
        <div className="relative bg-[#1a3c28] pt-12 pb-20 px-5" style={{ borderBottomLeftRadius: '40px', borderBottomRightRadius: '40px' }}>
          <div className="absolute inset-0 opacity-10 overflow-hidden">
            <svg viewBox="0 0 400 300" className="w-full h-full object-cover mix-blend-overlay">
              <path fill="#ffffff" d="M0,100 C150,200 250,0 400,100 L400,0 L0,0 Z"></path>
            </svg>
          </div>

          <div className="relative z-10 max-w-[800px] mx-auto w-full">
            <div className="flex justify-between items-center text-white mb-8">
              <button onClick={() => setCurrentCategory(null)} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors active:scale-95">
                <ChevronLeft size={28} />
              </button>
              <h1 className="text-2xl font-black uppercase tracking-wider">{currentCategory.name}</h1>
              <button onClick={() => setIsCartOpen(true)} className="w-12 h-12 flex items-center justify-center relative bg-white/10 rounded-full">
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-[#1a3c28] flex items-center justify-center text-[10px] font-bold">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder={`Search in ${currentCategory.name}...`}
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 font-medium focus:outline-none focus:bg-white/20 transition-all backdrop-blur-md"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 px-5 -mt-8 overflow-y-auto no-scrollbar max-w-[1200px] mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catItems.filter(i => !searchText || i.name.toLowerCase().includes(searchText.toLowerCase())).map((item, index) => (
              <div key={item.id || index} className="bg-white p-4 rounded-[32px] border border-gray-100 flex flex-col shadow-sm hover:shadow-md hover:border-[#1a3c28]/10 transition-all group relative overflow-hidden">
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-[#f4f2ea] overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                      {item.image ? (
                        <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">☕</div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#1a3c28] text-lg truncate">{item.name}</h4>
                        <Tag color="gold" className="text-[10px] border-none font-bold rounded-md">NEW</Tag>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description || "Our signature premium offering."}
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-black text-[#1a3c28] text-xl">${parseFloat(item.price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOptionsModalItem(item)}
                  className="mt-4 w-full bg-[#1a3c28] text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#12281a] active:scale-[0.98] transition-all"
                >
                  <Plus size={18} /> Add to Order
                </button>
              </div>
            ))}

            {catItems.length === 0 && (
              <div className="col-span-full text-center py-20 text-[#1a3c28]/30 font-bold flex flex-col items-center gap-4">
                <ShoppingCart size={48} className="opacity-20" />
                No products found in this category.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <MainWrapper bgClass="bg-[#faf9f5]">

      {currentCategory ? CategoryViewComponent() : HomeViewComponent()}

      {/* Bottom Navigation - Center aligned and floating for large screens */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[500px] h-[75px] bg-[#0c2b18] rounded-[35px] flex justify-between items-center px-8 shadow-[0_15px_40px_rgba(12,43,24,0.4)] z-50">
        <button onClick={() => { setActiveTab('home'); setCurrentCategory(null); }} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'home' ? "text-white" : "text-white/40 hover:text-white/70")}>
          <Home size={22} className={activeTab === 'home' ? "fill-white" : ""} />
          <span className="text-[10px] font-bold">Home</span>
          {activeTab === 'home' && <div className="w-1 h-1 bg-white rounded-full mt-0.5"></div>}
        </button>
        <button onClick={() => { setActiveTab('order'); setIsCartOpen(true); }} className={cn("flex flex-col items-center gap-1 transition-colors relative", activeTab === 'order' ? "text-white" : "text-white/40 hover:text-white/70")}>
          <FileText size={22} className={activeTab === 'order' ? "fill-white" : ""} />
          <span className="text-[10px] font-bold">Order</span>
          {cart.length > 0 && <span className="absolute -top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0c2b18]"></span>}
          {activeTab === 'order' && <div className="w-1 h-1 bg-white rounded-full mt-0.5"></div>}
        </button>
        <button onClick={() => setActiveTab('starred')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'starred' ? "text-white" : "text-white/40 hover:text-white/70")}>
          <Star size={22} className={activeTab === 'starred' ? "fill-white" : ""} />
          <span className="text-[10px] font-bold">Starred</span>
          {activeTab === 'starred' && <div className="w-1 h-1 bg-white rounded-full mt-0.5"></div>}
        </button>
        <button onClick={() => setActiveTab('profile')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'profile' ? "text-white" : "text-white/40 hover:text-white/70")}>
          <User size={22} className={activeTab === 'profile' ? "fill-white" : ""} />
          <span className="text-[10px] font-bold">Profile</span>
          {activeTab === 'profile' && <div className="w-1 h-1 bg-white rounded-full mt-0.5"></div>}
        </button>
      </div>

      {/* Cart/Options Modal Styles wrapper, antd is difficult to fully inline within MobileWrapper without polluting globals */}
      <Modal
        open={!!optionsModalItem}
        onCancel={() => setOptionsModalItem(null)}
        footer={null}
        closeIcon={<div className="bg-gray-100 p-2 rounded-full hover:bg-red-50 hover:text-red-500"><X size={16} /></div>}
        className="mobile-modal"
        centered
        width={350}
        destroyOnClose
      >
        <div style={{ fontFamily: 'Outfit, sans-serif' }}>
          <ProductOptionsModal
            item={optionsModalItem}
            onAdd={(item, size, addons, temp, sugar, qty) => {
              addToCart(item, size, addons, temp, sugar, qty);
              setOptionsModalItem(null);
            }}
            onClose={() => setOptionsModalItem(null)}
            productSizes={productSizes}
            calculateItemPrice={calculateItemPrice}
          />
        </div>
      </Modal>

      <Modal
        open={isCartOpen && activeTab !== 'order'}
        onCancel={() => setIsCartOpen(false)}
        footer={null}
        title="Your Cart"
        className="mobile-modal"
        centered
        width={350}
      >
        <div className="font-sans">
          {cart.length === 0 ? (
            <div className="py-10 text-center text-[#1a3c28]/40 font-bold">Your cart is empty.</div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-[#1a3c28] text-sm">{item.name}</h4>
                    <span className="text-xs font-bold text-[#1a3c28]/50">x{item.quantity} {item.size?.name ? `(${item.size.name})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-[#1a3c28]">${item.totalPrice.toFixed(2)}</span>
                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-400 p-1"><X size={16} /></button>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center mt-2">
                <span className="font-bold text-[#1a3c28]">Total:</span>
                <span className="font-black text-xl text-[#1a3c28]">${getTotalPrice().toFixed(2)}</span>
              </div>
              <button
                onClick={() => {
                  message.success("Order Placed!");
                  setCart([]);
                  setIsCartOpen(false);
                }}
                className="w-full bg-[#1a3c28] text-white py-4 rounded-[20px] font-bold text-lg mt-4 shadow-lg active:scale-95"
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      </Modal>

      <style>{`
        .mobile-modal .ant-modal-content {
          border-radius: 32px !important;
          padding: 24px !important;
        }
      `}</style>

    </MainWrapper>
  );
};

export default CoffeeMenuApp;
