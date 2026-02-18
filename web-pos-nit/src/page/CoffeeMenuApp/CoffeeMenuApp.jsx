// import React, { useState, useEffect } from 'react';
// import { ShoppingCart, Plus, Minus, QrCode, Coffee, MapPin, Bell, Eye, Check, Thermometer, Zap } from 'lucide-react';
// import QRCode from 'qrcode';

// const CoffeeMenuApp = () => {
//   const [selectedTable, setSelectedTable] = useState(null);
//   const [cart, setCart] = useState([]);
//   const [currentView, setCurrentView] = useState('tables'); // 'tables', 'menu', 'checkout', 'seller', 'qr-generator'
//   const [orders, setOrders] = useState([]);
//   const [newOrderAlert, setNewOrderAlert] = useState(null);
//   const [menuItems, setMenuItems] = useState([
//     {
//       id: 1,
//       name: 'Americano',
//       price: 3.50,
//       discount: 10,
//       description: 'Rich and bold coffee',
//       image: null
//     },
//     {
//       id: 2,
//       name: 'Latte',
//       price: 4.50,
//       discount: 15,
//       description: 'Smooth coffee with milk',
//       image: null
//     },
//     {
//       id: 3,
//       name: 'Cappuccino',
//       price: 4.00,
//       discount: 20,
//       description: 'Classic Italian coffee',
//       image: null
//     }
//   ]);
//   const [productConfigs, setProductConfigs] = useState({});
//   const [qrCodes, setQrCodes] = useState({});

//   // Generate QR codes for all tables
//   useEffect(() => {
//     const generateQRCodes = async () => {
//       const codes = {};
//       for (let i = 1; i <= 20; i++) {
//         try {
//           // Create URL that will automatically select table and go to menu
//           const tableURL = `${window.location.origin}${window.location.pathname}?table=${i}&view=menu`;
//           const qrCodeDataURL = await QRCode.toDataURL(tableURL, {
//             width: 200,
//             margin: 2,
//             color: {
//               dark: '#D97706', // Amber color
//               light: '#FFFFFF'
//             }
//           });
//           codes[i] = qrCodeDataURL;
//         } catch (error) {
//           console.error(`Error generating QR code for table ${i}:`, error);
//         }
//       }
//       setQrCodes(codes);
//     };

//     generateQRCodes();
//   }, []);

//   // Check URL parameters on component mount
//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const tableFromURL = urlParams.get('table');
//     const viewFromURL = urlParams.get('view');
    
//     if (tableFromURL) {
//       setSelectedTable(parseInt(tableFromURL));
//     }
//     if (viewFromURL === 'menu' && tableFromURL) {
//       setCurrentView('menu');
//     }
//   }, []);

//   // Mock product configs for demo
//   useEffect(() => {
//     const mockConfigs = {
//       1: {
//         getSizes: [
//           { value: 'small', name: 'Small', price: 0 },
//           { value: 'medium', name: 'Medium', price: 0.5 },
//           { value: 'large', name: 'Large', price: 1.0 }
//         ],
//         getAddons: [
//           { value: 'extra_shot', name: 'Extra Shot', price: 0.75 },
//           { value: 'syrup', name: 'Vanilla Syrup', price: 0.5 }
//         ]
//       },
//       2: {
//         getSizes: [
//           { value: 'small', name: 'Small', price: 0 },
//           { value: 'medium', name: 'Medium', price: 0.5 },
//           { value: 'large', name: 'Large', price: 1.0 }
//         ],
//         getAddons: [
//           { value: 'extra_foam', name: 'Extra Foam', price: 0.25 },
//           { value: 'cinnamon', name: 'Cinnamon', price: 0.3 }
//         ]
//       },
//       3: {
//         getSizes: [
//           { value: 'small', name: 'Small', price: 0 },
//           { value: 'medium', name: 'Medium', price: 0.5 },
//           { value: 'large', name: 'Large', price: 1.0 }
//         ],
//         getAddons: [
//           { value: 'chocolate', name: 'Chocolate Powder', price: 0.4 },
//           { value: 'whip', name: 'Whipped Cream', price: 0.6 }
//         ]
//       }
//     };
//     setProductConfigs(mockConfigs);
//   }, []);

//   const temperatures = ['Hot', 'Cold'];
//   const sugarLevels = ['No Sugar', '25%', '50%', '75%', '100%'];
//   const tables = Array.from({ length: 20 }, (_, i) => i + 1);

//   const calculateDiscountedPrice = (price, discount) => {
//     return Number(price) - (Number(price) * Number(discount) / 100);
//   };

//   const addToCart = (item, selectedSize, selectedAddons, temperature, sugarLevel, quantity = 1) => {
//     const discountedPrice = calculateDiscountedPrice(item.price, item.discount);
//     const unitPrice = calculateItemPrice(discountedPrice, selectedSize, selectedAddons);
//     const customKey = `${item.id}-${selectedSize?.value}-${selectedAddons.map(a => a.value).join(',')}-${temperature}-${sugarLevel}`;

//     const cartItem = {
//       cart_id: Date.now() + Math.random(),
//       product_id: item.id,
//       name: item.name,
//       size: selectedSize,
//       addons: selectedAddons,
//       temperature,
//       sugarLevel,
//       quantity: Number(quantity),
//       originalPrice: Number(item.price),
//       discount: Number(item.discount),
//       discountedPrice,
//       totalPrice: unitPrice * Number(quantity),
//       customKey
//     };

//     setCart(prev => [...prev, cartItem]);
//   };

//   const calculateItemPrice = (basePrice, size, addons) => {
//     let total = Number(basePrice);
//     if (size && size.price) total += Number(size.price);
//     if (addons && addons.length > 0) {
//       total += addons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
//     }
//     return total;
//   };

//   const getTotalPrice = () => {
//     return cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
//   };

//   const removeFromCart = (index) => {
//     setCart(cart.filter((_, i) => i !== index));
//   };

//   const submitOrder = async () => {
//     if (cart.length === 0) return;

//     const orderItems = cart.map(item => ({
//       product_id: item.product_id,
//       name: item.name,
//       size: item.size,
//       addons: item.addons,
//       temperature: item.temperature,
//       sugarLevel: item.sugarLevel,
//       quantity: item.quantity,
//       originalPrice: item.originalPrice,
//       discount: item.discount,
//       discountedPrice: item.discountedPrice,
//       totalPrice: item.totalPrice,
//     }));

//     const order = {
//       table_number: selectedTable,
//       items: orderItems,
//       total: getTotalPrice(),
//       user_id: 1,
//       id: Date.now(),
//       status: 'pending',
//       tableNumber: selectedTable,
//       timestamp: new Date().toLocaleString()
//     };

//     setOrders(prev => [...prev, order]);
//     setCart([]);
//     setCurrentView('tables');
//     setNewOrderAlert(`New order from Table ${selectedTable}!`);
//     setTimeout(() => setNewOrderAlert(null), 5000);
//   };

//   const acceptOrder = (orderId) => {
//     setOrders(prev => prev.map(order =>
//       order.id === orderId ? { ...order, status: 'completed' } : order
//     ));
//   };

//   // QR Generator View
//   const QRGeneratorView = () => (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
//       <div className="max-w-6xl mx-auto">
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-2xl font-bold text-purple-900">QR Code Generator</h1>
//               <p className="text-purple-700">Generate QR codes for all tables</p>
//             </div>
//             <button
//               onClick={() => setCurrentView('tables')}
//               className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
//             >
//               Back to Tables
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//           {tables.map((tableNum) => (
//             <div key={tableNum} className="bg-white rounded-xl shadow-lg p-6 text-center">
//               <h3 className="text-lg font-bold text-purple-900 mb-4">Table {tableNum}</h3>
//               <div className="mb-4">
//                 {qrCodes[tableNum] ? (
//                   <img
//                     src={qrCodes[tableNum]}
//                     alt={`QR Code for Table ${tableNum}`}
//                     className="mx-auto"
//                     style={{ maxWidth: '150px' }}
//                   />
//                 ) : (
//                   <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
//                     Loading...
//                   </div>
//                 )}
//               </div>
//               <p className="text-sm text-gray-600 mb-4">
//                 Scan to order for Table {tableNum}
//               </p>
//               <button
//                 onClick={() => {
//                   if (qrCodes[tableNum]) {
//                     const link = document.createElement('a');
//                     link.download = `table-${tableNum}-qr.png`;
//                     link.href = qrCodes[tableNum];
//                     link.click();
//                   }
//                 }}
//                 className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
//                 disabled={!qrCodes[tableNum]}
//               >
//                 Download QR
//               </button>
//             </div>
//           ))}
//         </div>

//         <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
//           <h2 className="text-xl font-bold text-purple-900 mb-4">Instructions:</h2>
//           <div className="space-y-2 text-gray-700">
//             <p>• Each table has its own unique QR code</p>
//             <p>• When customers scan the QR code, they will be automatically directed to the menu for that specific table</p>
//             <p>• Download and print the QR codes to place on each table</p>
//             <p>• QR codes contain the direct link: {window.location.origin}?table=X&view=menu</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   // Table Selection View with QR Generator Button
//   const TableSelectionView = () => (
//     <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
//       <div className="max-w-6xl mx-auto">
//         <div className="text-center mb-8">
//           <Coffee className="mx-auto mb-4 text-6xl text-amber-700" />
//           <h1 className="text-4xl font-bold text-amber-900 mb-2">Coffee House</h1>
//           <p className="text-amber-700">Scan QR code or select your table to start ordering</p>
//         </div>

//         {/* Control Buttons */}
//         <div className="text-center mb-6 space-x-4">
//           <button
//             onClick={() => setCurrentView('seller')}
//             className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
//           >
//             <Eye size={20} />
//             Seller Dashboard
//             {orders.filter(o => o.status === 'pending').length > 0 && (
//               <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
//                 {orders.filter(o => o.status === 'pending').length}
//               </span>
//             )}
//           </button>
          
//           <button
//             onClick={() => setCurrentView('qr-generator')}
//             className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
//           >
//             <QrCode size={20} />
//             Generate QR Codes
//           </button>
//         </div>

//         <div className="grid grid-cols-4 md:grid-cols-5 gap-4 mb-8">
//           {tables.map((tableNum) => (
//             <div
//               key={tableNum}
//               onClick={() => {
//                 setSelectedTable(tableNum);
//                 setCurrentView('menu');
//               }}
//               className="bg-white rounded-xl shadow-lg p-6 text-center cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-amber-200 hover:border-amber-400"
//             >
//               <div className="text-3xl mb-2">🪑</div>
//               <div className="font-bold text-xl text-amber-900 mb-2">Table {tableNum}</div>
//               <div className="mb-2">
//                 {qrCodes[tableNum] ? (
//                   <img
//                     src={qrCodes[tableNum]}
//                     alt={`QR for Table ${tableNum}`}
//                     className="mx-auto"
//                     style={{ width: '60px', height: '60px' }}
//                   />
//                 ) : (
//                   <div className="w-15 h-15 bg-gray-200 rounded flex items-center justify-center mx-auto">
//                     <QrCode size={24} className="text-amber-600" />
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="text-center text-amber-700">
//           <MapPin className="inline mr-2" size={20} />
//           Scan QR code or tap table number to order
//         </div>
//       </div>
//     </div>
//   );

//   // Menu View (rest of your existing code...)
//   const MenuView = () => {
//     const [quantities, setQuantities] = useState({});
//     const [itemSizes, setItemSizes] = useState({});
//     const [itemAddons, setItemAddons] = useState({});
//     const [itemTemperatures, setItemTemperatures] = useState({});
//     const [itemSugarLevels, setItemSugarLevels] = useState({});

//     const updateQuantity = (itemId, change) => {
//       setQuantities(prev => ({
//         ...prev,
//         [itemId]: Math.max(0, (prev[itemId] || 1) + change)
//       }));
//     };

//     const updateSize = (itemId, sizeValue, availableSizes) => {
//       const selectedSize = availableSizes?.find(s => s.value === sizeValue);
//       setItemSizes(prev => ({
//         ...prev,
//         [itemId]: selectedSize
//       }));
//     };

//     const updateAddons = (itemId, addonValue, checked, availableAddons) => {
//       const addon = availableAddons?.find(a => a.value === addonValue);
//       setItemAddons(prev => ({
//         ...prev,
//         [itemId]: checked
//           ? [...(prev[itemId] || []), addon]
//           : (prev[itemId] || []).filter(a => a.value !== addonValue)
//       }));
//     };

//     const updateTemperature = (itemId, temperature) => {
//       setItemTemperatures(prev => ({
//         ...prev,
//         [itemId]: temperature
//       }));
//     };

//     const updateSugarLevel = (itemId, sugarLevel) => {
//       setItemSugarLevels(prev => ({
//         ...prev,
//         [itemId]: sugarLevel
//       }));
//     };

//     return (
//       <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
//         <div className="max-w-4xl mx-auto">
//           {/* Header */}
//           <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
//             <div className="flex justify-between items-center">
//               <div>
//                 <h1 className="text-2xl font-bold text-amber-900">Table {selectedTable}</h1>
//                 <p className="text-amber-700">Select your beverages</p>
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => setCurrentView('tables')}
//                   className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
//                 >
//                   Change Table
//                 </button>
//                 <button
//                   onClick={() => setCurrentView('checkout')}
//                   className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
//                 >
//                   <ShoppingCart size={20} />
//                   Cart ({cart.length})
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Menu Items */}
//           <div className="grid gap-6">
//             {menuItems.map((item) => {
//               const discountedPrice = calculateDiscountedPrice(item.price, item.discount);
//               const itemConfig = productConfigs[item.id];
              
//               return (
//                 <div key={item.id} className="bg-white rounded-xl shadow-lg p-6">
//                   <div className="flex gap-6">
//                     {/* Item Image */}
//                     <div className="w-24 h-24 bg-amber-100 rounded-lg flex items-center justify-center">
//                       <span className="text-4xl">☕</span>
//                     </div>

//                     {/* Item Details */}
//                     <div className="flex-1">
//                       <div className="flex items-center gap-2 mb-2">
//                         <h3 className="text-xl font-bold text-amber-900">{item.name}</h3>
//                         <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
//                           -{item.discount}%
//                         </span>
//                       </div>
//                       <p className="text-amber-700 mb-4">{item.description}</p>
//                       <div className="flex items-center gap-2">
//                         <span className="text-lg text-gray-500 line-through">
//                           ${Number(item.price).toFixed(2)}
//                         </span>
//                         <span className="text-2xl font-bold text-green-600">${discountedPrice.toFixed(2)}</span>
//                       </div>
//                     </div>

//                     {/* Controls */}
//                     <div className="w-80 space-y-4">
//                       {/* Size Selection */}
//                       {itemConfig?.getSizes && (
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">Size:</label>
//                           <select
//                             className="w-full border border-gray-300 rounded-lg px-3 py-2"
//                             onChange={(e) => updateSize(item.id, e.target.value, itemConfig.getSizes)}
//                           >
//                             <option value="">Select size</option>
//                             {itemConfig.getSizes.map(size => (
//                               <option key={size.value} value={size.value}>
//                                 {size.name} (+${Number(size.price).toFixed(2)})
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                       )}

//                       {/* Temperature Selection */}
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           <Thermometer className="inline mr-1" size={16} />
//                           Temperature:
//                         </label>
//                         <div className="flex gap-2">
//                           {temperatures.map((temp) => (
//                             <button
//                               key={temp}
//                               onClick={() => updateTemperature(item.id, temp)}
//                               className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
//                                 itemTemperatures[item.id] === temp
//                                   ? 'bg-amber-600 text-white border-amber-600'
//                                   : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'
//                               }`}
//                             >
//                               {temp === 'Hot' ? '🔥' : '🧊'} {temp}
//                             </button>
//                           ))}
//                         </div>
//                       </div>

//                       {/* Sugar Level */}
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           <Zap className="inline mr-1" size={16} />
//                           Sugar Level:
//                         </label>
//                         <select
//                           className="w-full border border-gray-300 rounded-lg px-3 py-2"
//                           onChange={(e) => updateSugarLevel(item.id, e.target.value)}
//                         >
//                           <option value="">Select sugar level</option>
//                           {sugarLevels.map(level => (
//                             <option key={level} value={level}>{level}</option>
//                           ))}
//                         </select>
//                       </div>

//                       {/* Add-ons */}
//                       {itemConfig?.getAddons && (
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons:</label>
//                           <div className="space-y-2 max-h-24 overflow-y-auto">
//                             {itemConfig.getAddons.map((addon) => (
//                               <label key={addon.value} className="flex items-center gap-2">
//                                 <input
//                                   type="checkbox"
//                                   className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
//                                   onChange={(e) => updateAddons(item.id, addon.value, e.target.checked, itemConfig.getAddons)}
//                                 />
//                                 <span className="text-sm">{addon.name} +${Number(addon.price).toFixed(2)}</span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Quantity */}
//                       <div className="flex items-center gap-3">
//                         <button
//                           onClick={() => updateQuantity(item.id, -1)}
//                           className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
//                         >
//                           <Minus size={16} />
//                         </button>
//                         <span className="font-medium">{quantities[item.id] || 1}</span>
//                         <button
//                           onClick={() => updateQuantity(item.id, 1)}
//                           className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
//                         >
//                           <Plus size={16} />
//                         </button>
//                       </div>

//                       {/* Add to Cart */}
//                       <button
//                         onClick={() => {
//                           if (!itemSizes[item.id]) {
//                             alert('Please select a size');
//                             return;
//                           }
//                           if (!itemTemperatures[item.id]) {
//                             alert('Please select temperature');
//                             return;
//                           }
//                           if (!itemSugarLevels[item.id]) {
//                             alert('Please select sugar level');
//                             return;
//                           }
//                           addToCart(
//                             item,
//                             itemSizes[item.id],
//                             itemAddons[item.id] || [],
//                             itemTemperatures[item.id],
//                             itemSugarLevels[item.id],
//                             quantities[item.id] || 1
//                           );
//                         }}
//                         className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
//                       >
//                         Add to Cart
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Checkout View (your existing checkout code)
//   const CheckoutView = () => (
//     <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
//       <div className="max-w-2xl mx-auto">
//         <div className="bg-white rounded-xl shadow-lg p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-2xl font-bold text-amber-900">Order Summary - Table {selectedTable}</h2>
//             <button
//               onClick={() => setCurrentView('menu')}
//               className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
//             >
//               Back to Menu
//             </button>
//           </div>

//           <div className="mb-6">
//             <h3 className="font-medium text-gray-700 mb-3">Items:</h3>
//             {cart.length === 0 ? (
//               <p className="text-gray-500 text-center py-8">Your cart is empty</p>
//             ) : (
//               <div className="space-y-3">
//                 {cart.map((item, index) => (
//                   <div key={index} className="p-4 bg-gray-50 rounded-lg">
//                     <div className="flex justify-between items-start">
//                       <div className="flex-1">
//                         <div className="font-medium flex items-center gap-2">
//                           {item.name}
//                           <span className="bg-red-500 text-white px-1 py-0.5 rounded text-xs">
//                             -{item.discount}%
//                           </span>
//                         </div>
//                         <div className="text-sm text-gray-600 space-y-1">
//                           <div>Size: {item.size?.name}</div>
//                           <div>Temperature: {item.temperature === 'Hot' ? '🔥' : '🧊'} {item.temperature}</div>
//                           <div>Sugar: {item.sugarLevel}</div>
//                           {item.addons?.length > 0 && (
//                             <div>Add-ons: {item.addons.map(a => a.name).join(', ')}</div>
//                           )}
//                           <div>Quantity: {item.quantity}</div>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="flex items-center gap-2">
//                           <span className="text-sm text-gray-500 line-through">
//                             ${(item.originalPrice * item.quantity).toFixed(2)}
//                           </span>
//                           <span className="font-medium text-green-600">
//                             ${item.totalPrice.toFixed(2)}
//                           </span>
//                           <button
//                             onClick={() => removeFromCart(index)}
//                             className="text-red-500 hover:text-red-700 ml-2"
//                           >
//                             ×
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           <div className="border-t pt-4 mb-6">
//             <div className="flex justify-between items-center text-xl font-bold">
//               <span>Total:</span>
//               <span className="text-green-600">${getTotalPrice().toFixed(2)}</span>
//             </div>
//           </div>

//           {cart.length > 0 && (
//             <button
//               onClick={submitOrder}
//               className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium text-lg"
//             >
//               Submit Order
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );

//   // Seller Dashboard (your existing seller code)
//   const SellerDashboardView = () => (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
//       <div className="max-w-6xl mx-auto">
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-2xl font-bold text-green-900">Seller Dashboard</h1>
//               <p className="text-green-700">Monitor and manage orders</p>
//             </div>
//             <button
//               onClick={() => setCurrentView('tables')}
//               className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
//             >
//               Back to Tables
//             </button>
//           </div>
//         </div>

//         {newOrderAlert && (
//           <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
//             <div className="flex items-center">
//               <Bell className="mr-2" size={20} />
//               <span className="font-medium">{newOrderAlert}</span>
//             </div>
//           </div>
//         )}

//         <div className="space-y-4">
//           {orders.length === 0 ? (
//             <div className="text-center py-12 text-gray-500">
//               <Coffee size={48} className="mx-auto mb-4 text-gray-400" />
//               <p>No orders yet</p>
//             </div>
//           ) : (
//             orders.map((order) => (
//               <div
//                 key={order.id}
//                 className={`bg-white rounded-xl shadow-lg p-6 ${
//                   order.status === 'pending' ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'
//                 }`}
//               >
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <h3 className="text-lg font-bold">Table {order.tableNumber}</h3>
//                     <p className="text-gray-600">{order.timestamp}</p>
//                     <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
//                       order.status === 'pending'
//                         ? 'bg-yellow-100 text-yellow-800'
//                         : 'bg-green-100 text-green-800'
//                     }`}>
//                       {order.status === 'pending' ? 'Pending' : 'Completed'}
//                     </span>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-xl font-bold text-green-600">
//                       ${order.total.toFixed(2)}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2 mb-4">
//                   {order.items.map((item, index) => (
//                     <div key={index} className="bg-gray-50 p-3 rounded">
//                       <div className="flex justify-between">
//                         <div>
//                           <span className="font-medium">{item.name}</span>
//                           <span className="ml-2 bg-red-500 text-white px-1 py-0.5 rounded text-xs">
//                             -{item.discount}%
//                           </span>
//                         </div>
//                         <span>${item.totalPrice.toFixed(2)}</span>
//                       </div>
//                       <div className="text-sm text-gray-600">
//                         {item.size?.name} • {item.temperature} • {item.sugarLevel} • Qty: {item.quantity}
//                         {item.addons?.length > 0 && ` • ${item.addons.map(a => a.name).join(', ')}`}
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {order.status === 'pending' && (
//                   <button
//                     onClick={() => acceptOrder(order.id)}
//                     className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
//                   >
//                     <Check size={16} />
//                     Accept Order
//                   </button>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );

//   // Render current view
//   switch (currentView) {
//     case 'menu':
//       return <MenuView />;
//     case 'checkout':
//       return <CheckoutView />;
//     case 'seller':
//       return <SellerDashboardView />;
//     case 'qr-generator':
//       return <QRGeneratorView />;
//     default:
//       return <TableSelectionView />;
//   }
// };

// export default CoffeeMenuApp;



import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, QrCode, Coffee, MapPin, Bell, Eye, Check, Thermometer, Zap, Store, Settings, Edit3, Trash2, Save, X } from 'lucide-react';
import { request } from '../../util/helper';
import { getProfile } from '../../store/profile.store';
import { Config } from '../../util/config';
import { message, Select, Modal, Input, Button, InputNumber } from 'antd';
import { configStore } from "../../store/configStore";

const CoffeeMenuApp = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [cart, setCart] = useState([]);
  const [currentView, setCurrentView] = useState('shops');
  const [orders, setOrders] = useState([]);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [productSizes, setProductSizes] = useState({});
  const [productAddons, setProductAddons] = useState({});
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedParentCategory, setSelectedParentCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [isShopModalVisible, setIsShopModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [newShop, setNewShop] = useState({
    name: '',
    location: '',
    table_count: 10,
    user_id: null
  });
  const { config } = configStore();

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (selectedShop?.id) {
      fetchShopProducts();
    }
  }, [selectedShop, selectedCategory, selectedParentCategory, searchText]);

  const fetchShops = async () => {
    try {
      const profile = getProfile();
      const res = await request(`shops?user_id=${profile?.id}`, "get");
      if (res && !res.error) {
        setShops(res.list || []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      // Mock data for demo
      setShops([
        {
          id: 1,
          name: 'Coffee House Central',
          location: 'Phnom Penh Center',
          table_count: 20,
          user_id: 1,
          owner_name: 'Admin User',
          product_count: 15,
          total_orders: 50
        },
        {
          id: 2,
          name: 'Coffee House Riverside', 
          location: 'Riverside Area',
          table_count: 15,
          user_id: 2,
          owner_name: 'Shop Manager',
          product_count: 12,
          total_orders: 30
        }
      ]);
    }
  };

  const createShop = async () => {
    if (!newShop.name || !newShop.location || !newShop.user_id) {
      message.error('Please fill in all required fields');
      return;
    }

    try {
      const res = await request('shops', 'post', newShop);
      if (res && !res.error) {
        message.success('Shop created successfully!');
        setNewShop({ name: '', location: '', table_count: 10, user_id: null });
        setIsShopModalVisible(false);
        await fetchShops();
      } else {
        message.error(res?.error || 'Failed to create shop');
      }
    } catch (error) {
      console.error('Error creating shop:', error);
      message.error('Failed to create shop');
    }
  };

  const updateShop = async (shopId, updates) => {
    try {
      const res = await request(`shops/${shopId}`, 'put', updates);
      if (res && !res.error) {
        message.success('Shop updated successfully!');
        setEditingShop(null);
        await fetchShops();
      } else {
        message.error(res?.error || 'Failed to update shop');
      }
    } catch (error) {
      console.error('Error updating shop:', error);
      message.error('Failed to update shop');
    }
  };

  const deleteShop = async (shopId, shopName) => {
    Modal.confirm({
      title: 'Are you sure?',
      content: `This will permanently delete "${shopName}" and all its data.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const profile = getProfile();
          const res = await request(`shops/${shopId}`, 'delete', { user_id: profile?.id });
          if (res && !res.error) {
            message.success('Shop deleted successfully!');
            await fetchShops();
          } else {
            message.error(res?.error || 'Failed to delete shop');
          }
        } catch (error) {
          console.error('Error deleting shop:', error);
          message.error('Failed to delete shop');
        }
      }
    });
  };

  const fetchShopProducts = async () => {
    try {
      const profile = getProfile();
      const params = new URLSearchParams({
        user_id: profile?.id || '',
        shop_id: selectedShop?.id || ''
      });

      if (searchText) params.append('txt_search', searchText);
      if (selectedCategory !== 'all') params.append('category_id', selectedCategory);
      if (selectedParentCategory !== 'all') params.append('parent_id', selectedParentCategory);

      const res = await request(`product/getList?${params.toString()}`, "get");
      
      if (res && !res.error) {
        setMenuItems(res.list || []);
        setParentCategories(res.all_parent_categories || []);
        
        // Fetch sizes and addons for each product
        await fetchProductConfigurations(res.list || []);
      } else {
        console.warn('No products found or error:', res);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching shop products:', error);
      // Mock data for demo
      setMenuItems([
        {
          id: 146,
          category_id: 53,
          barcode: 'P953642',
          name: 'Milk Based Coffee',
          brand: '',
          description: 'Rich milk coffee blend',
          qty: 5,
          price: 3.50,
          discount: 0.00,
          status: 1,
          image: 'upload_image-1730834360056-317262.jpg',
          create_by: 'AdminSystem',
          user_id: 3,
          category_name: 'Hot Drinks',
          unit: '',
          unit_price: '',
          company_name: '',
          user_id: 3,
          stock: 5
        }
      ]);
    }
  };

  const fetchProductConfigurations = async (products) => {
    const sizes = {};
    const addons = {};

    for (const product of products) {
      try {
        // Fetch sizes
        const sizesRes = await request(`product/getSizes?product_id=${product.id}`, "get");
        if (sizesRes && !sizesRes.error && sizesRes.list) {
          sizes[product.id] = sizesRes.list.map(size => ({
            id: size.id,
            name: size.label,
            value: size.id.toString(),
            price: parseFloat(size.price || 0)
          }));
        }

        // Fetch addons
        const addonsRes = await request(`product/getAddons?product_id=${product.id}`, "get");
        if (addonsRes && !addonsRes.error && addonsRes.list) {
          addons[product.id] = addonsRes.list.map(addon => ({
            id: addon.id,
            name: addon.label,
            value: addon.id.toString(),
            price: parseFloat(addon.price || 0)
          }));
        }
      } catch (error) {
        console.error(`Error fetching config for product ${product.id}:`, error);
      }
    }

    setProductSizes(sizes);
    setProductAddons(addons);
  };

  const temperatures = ['Hot', 'Cold'];
  const sugarLevels = ['No Sugar', '25%', '50%', '75%', '100%'];

  const generateQRCodeData = (shopId, tableNumber) => {
    return `${window.location.origin}/scan?shop_id=${shopId}&table_number=${tableNumber}`;
  };

  const calculateDiscountedPrice = (price, discount) => {
    return Number(price) - (Number(price) * Number(discount) / 100);
  };

  const calculateItemPrice = (basePrice, size, addons) => {
    let total = Number(basePrice);
    if (size && size.price) total += Number(size.price);
    if (addons && addons.length > 0) {
      total += addons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
    }
    return total;
  };

  const addToCart = (item, selectedSize, selectedAddons, temperature, sugarLevel, quantity = 1) => {
    // Check stock availability
    const availableStock = item.qty || item.stock || 0;
    if (availableStock < quantity) {
      message.error(`Sorry, only ${availableStock} items available in stock!`);
      return;
    }

    const discountedPrice = calculateDiscountedPrice(item.price, item.discount);
    const unitPrice = calculateItemPrice(discountedPrice, selectedSize, selectedAddons);

    const cartItem = {
      cart_id: Date.now() + Math.random(),
      product_id: item.id,
      name: item.name,
      barcode: item.barcode,
      size: selectedSize,
      addons: selectedAddons,
      temperature,
      sugarLevel,
      quantity: Number(quantity),
      originalPrice: Number(item.price),
      discount: Number(item.discount),
      discountedPrice,
      totalPrice: unitPrice * Number(quantity),
      image: item.image,
      brand: item.brand || '',
      category_name: item.category_name || ''
    };

    setCart(prev => [...prev, cartItem]);
    message.success(`${item.name} added to cart successfully!`);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  };

  const getTotalDiscount = () => {
    return cart.reduce((sum, item) => {
      const originalTotal = Number(item.originalPrice) * Number(item.quantity);
      const discountedTotal = Number(item.totalPrice);
      return sum + (originalTotal - discountedTotal);
    }, 0);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;

    const profile = getProfile();
    
    const orderItems = cart.map(item => ({
      product_id: item.product_id,
      name: item.name,
      barcode: item.barcode,
      size: item.size,
      addons: item.addons,
      temperature: item.temperature,
      sugarLevel: item.sugarLevel,
      quantity: item.quantity,
      originalPrice: item.originalPrice,
      discount: item.discount,
      discountedPrice: item.discountedPrice,
      totalPrice: item.totalPrice
    }));

    const order = {
      table_number: selectedTable,
      shop_id: selectedShop?.id,
      items: orderItems,
      total: getTotalPrice(),
      user_id: profile?.id || null,
      create_by: profile?.name || 'Guest'
    };

    try {
      const res = await request("orders", "post", order);
      if (res && !res.error) {
        message.success("Order submitted successfully!");
        setOrders(prev => [...prev, { 
          ...order, 
          id: res.order_id || Date.now(), 
          status: 'pending', 
          shop_name: selectedShop?.name,
          tableNumber: selectedTable, 
          timestamp: new Date().toLocaleString() 
        }]);
        setCart([]);
        setCurrentView('tables');
        setNewOrderAlert(`New order from ${selectedShop?.name} - Table ${selectedTable}!`);
        setTimeout(() => setNewOrderAlert(null), 5000);
      } else {
        message.error("Failed to submit order");
        console.error('Order submission error:', res);
      }
    } catch (error) {
      message.error("Failed to submit order - network error");
      console.error('Network error:', error);
    }
  };

  const acceptOrder = (orderId) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: 'completed' } : order
    ));
  };

  const handleQRClick = (shopId, tableNumber) => {
    const qrUrl = generateQRCodeData(shopId, tableNumber);
    setQrData({
      url: qrUrl,
      shopName: shops.find(s => s.id === shopId)?.name,
      tableNumber
    });
    setIsQRModalVisible(true);
  };

  // Shop Selection View
  const ShopSelectionView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Store className="mx-auto mb-4 text-6xl text-blue-700" />
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Coffee Shop Management</h1>
          <p className="text-blue-700">Select a shop to manage tables and orders</p>
        </div>

        {/* Action Buttons */}
        <div className="text-center mb-6 space-x-4">
          <button
            onClick={() => setCurrentView('seller')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
          >
            <Eye size={20} />
            Seller Dashboard
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setIsShopModalVisible(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Settings size={20} />
            Manage Shops
          </button>
        </div>

        {/* Shops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-200"
            >
              <div className="text-center mb-4">
                <Store className="mx-auto mb-4 text-4xl text-blue-600" />
                <h3 className="text-xl font-bold text-blue-900 mb-2">{shop.name}</h3>
                <p className="text-blue-700 mb-2">{shop.location}</p>
                <div className="bg-blue-100 rounded-lg p-3 mb-3">
                  <p className="text-sm text-blue-800">Tables: {shop.table_count}</p>
                  <p className="text-sm text-blue-800">Products: {shop.product_count || 0}</p>
                  <p className="text-sm text-blue-800">Orders: {shop.total_orders || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">Owner: {shop.owner_name}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedShop(shop);
                    setCurrentView('tables');
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Manage Tables
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingShop(shop)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteShop(shop.id, shop.name)}
                    className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {shops.length === 0 && (
          <div className="text-center text-blue-700">
            <Coffee className="mx-auto mb-4 text-6xl text-blue-400" />
            <p className="text-xl">No shops found. Create your first shop to get started!</p>
          </div>
        )}

        {/* Shop Management Modal */}
        <Modal
          title="Shop Management"
          open={isShopModalVisible}
          onCancel={() => {
            setIsShopModalVisible(false);
            setEditingShop(null);
            setNewShop({ name: '', location: '', table_count: 10, user_id: null });
          }}
          footer={null}
          width={800}
        >
          <div className="space-y-6">
            {/* Create New Shop */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-3">Create New Shop</h3>
              <div className="grid grid-cols-1 gap-4">
                <Input
                  placeholder="Shop Name *"
                  value={newShop.name}
                  onChange={(e) => setNewShop(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Location *"
                  value={newShop.location}
                  onChange={(e) => setNewShop(prev => ({ ...prev, location: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputNumber
                    placeholder="Number of Tables"
                    min={1}
                    max={100}
                    value={newShop.table_count}
                    onChange={(value) => setNewShop(prev => ({ ...prev, table_count: value || 10 }))}
                    className="w-full"
                  />
                  <Select
                    placeholder="Select Shop Owner *"
                    value={newShop.user_id}
                    onChange={(value) => setNewShop(prev => ({ ...prev, user_id: value }))}
                    options={config?.user || []}
                  />
                </div>
                <button
                  onClick={createShop}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Create Shop
                </button>
              </div>
            </div>

            {/* Existing Shops */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Existing Shops</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {shops.map((shop) => (
                  <div key={shop.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {editingShop?.id === shop.id ? (
                      <EditShopForm 
                        shop={shop} 
                        config={config}
                        onSave={(updates) => updateShop(shop.id, updates)}
                        onCancel={() => setEditingShop(null)}
                      />
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="font-medium">{shop.name}</div>
                          <div className="text-sm text-gray-600">
                            {shop.location} • {shop.table_count} tables • Owner: {shop.owner_name}
                          </div>
                          <div className="text-xs text-blue-600">
                            {shop.product_count || 0} products • {shop.total_orders || 0} orders
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingShop(shop)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-100"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => deleteShop(shop.id, shop.name)}
                            className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );

  // Edit Shop Form Component
  const EditShopForm = ({ shop, config, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: shop.name,
      location: shop.location,
      table_count: shop.table_count,
      user_id: shop.user_id
    });

    return (
      <div className="flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Shop Name"
          />
          <Input
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Location"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <InputNumber
            value={formData.table_count}
            onChange={(value) => setFormData(prev => ({ ...prev, table_count: value }))}
            min={1}
            max={100}
            className="w-full"
            placeholder="Tables"
          />
          <Select
            value={formData.user_id}
            onChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
            options={config?.user || []}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onSave(formData)}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
          >
            <Save size={14} />
            Save
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 flex items-center gap-1"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Table Selection View
  const TableSelectionView = () => {
    if (!selectedShop) return <ShopSelectionView />;

    const tables = Array.from({ length: selectedShop.table_count || 10 }, (_, i) => i + 1);

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Coffee className="mx-auto mb-4 text-6xl text-amber-700" />
            <h1 className="text-4xl font-bold text-amber-900 mb-2">{selectedShop.name}</h1>
            <p className="text-amber-700 mb-2">{selectedShop.location}</p>
            <p className="text-amber-600">Select a table or scan QR code to start ordering</p>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setCurrentView('shops')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Store size={20} />
              Change Shop
            </button>
            <button
              onClick={() => setCurrentView('seller')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Eye size={20} />
              Seller Dashboard
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-5 gap-4 mb-8">
            {tables.map((tableNum) => (
              <div
                key={tableNum}
                className="bg-white rounded-xl shadow-lg p-6 text-center border-2 border-amber-200 hover:border-amber-400 transition-all duration-200"
              >
                <div className="text-3xl mb-2">🪑</div>
                <div className="font-bold text-xl text-amber-900 mb-2">Table {tableNum}</div>
                
                <button
                  onClick={() => {
                    setSelectedTable(tableNum);
                    setCurrentView('menu');
                  }}
                  className="w-full bg-amber-600 text-white py-2 px-3 rounded-lg hover:bg-amber-700 transition-colors mb-2 text-sm"
                >
                  Order Now
                </button>
                
                <button
                  onClick={() => handleQRClick(selectedShop.id, tableNum)}
                  className="w-full bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-1 text-sm"
                >
                  <QrCode size={16} />
                  QR Code
                </button>
              </div>
            ))}
          </div>

          <div className="text-center text-amber-700">
            <MapPin className="inline mr-2" size={20} />
            Click "Order Now" or scan QR code to place orders
          </div>
        </div>
      </div>
    );
  };

  // QR Code Modal
  const QRCodeModal = () => (
    <Modal
      title={`QR Code - ${qrData?.shopName} Table ${qrData?.tableNumber}`}
      open={isQRModalVisible}
      onCancel={() => setIsQRModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setIsQRModalVisible(false)}>
          Close
        </Button>
      ]}
      centered
    >
      <div className="text-center p-4">
        <div className="bg-white border-2 border-gray-300 rounded-lg p-8 mb-4 inline-block">
          <QrCode size={200} className="text-gray-600" />
        </div>
        <p className="text-lg font-medium mb-2">Scan to Order</p>
        <p className="text-sm text-gray-600 mb-4">
          {qrData?.shopName} - Table {qrData?.tableNumber}
        </p>
        <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
          {qrData?.url}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          In a real app, this would show an actual QR code image
        </p>
      </div>
    </Modal>
  );

  // Menu View
  const MenuView = () => {
    const [quantities, setQuantities] = useState({});
    const [itemSizes, setItemSizes] = useState({});
    const [itemAddons, setItemAddons] = useState({});
    const [itemTemperatures, setItemTemperatures] = useState({});
    const [itemSugarLevels, setItemSugarLevels] = useState({});

    const updateQuantity = (itemId, change) => {
      setQuantities(prev => ({
        ...prev,
        [itemId]: Math.max(0, (prev[itemId] || 1) + change)
      }));
    };

    const updateSize = (itemId, sizeValue) => {
      const availableSizes = productSizes[itemId] || [];
      const selectedSize = availableSizes.find(s => s.value === sizeValue);
      setItemSizes(prev => ({
        ...prev,
        [itemId]: selectedSize
      }));
    };

    const updateAddons = (itemId, addonValue, checked) => {
      const availableAddons = productAddons[itemId] || [];
      const addon = availableAddons.find(a => a.value === addonValue);
      setItemAddons(prev => ({
        ...prev,
        [itemId]: checked
          ? [...(prev[itemId] || []), addon]
          : (prev[itemId] || []).filter(a => a.value !== addonValue)
      }));
    };

    const updateTemperature = (itemId, temperature) => {
      setItemTemperatures(prev => ({
        ...prev,
        [itemId]: temperature
      }));
    };

    const updateSugarLevel = (itemId, sugarLevel) => {
      setItemSugarLevels(prev => ({
        ...prev,
        [itemId]: sugarLevel
      }));
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-amber-900">{selectedShop?.name} - Table {selectedTable}</h1>
                <p className="text-amber-700">Select your beverages</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('tables')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Change Table
                </button>
                <button
                  onClick={() => setCurrentView('checkout')}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <ShoppingCart size={20} />
                  Cart ({cart.length})
                </button>
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by name or barcode..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full"
              />
              <Select
                placeholder="Parent Category"
                value={selectedParentCategory}
                onChange={setSelectedParentCategory}
                className="w-full"
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...parentCategories.map(cat => ({
                    value: cat.id.toString(),
                    label: cat.name
                  }))
                ]}
              />
              <button
                onClick={fetchShopProducts}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="grid gap-6">
            {menuItems.length === 0 ? (
              <div className="text-center py-12">
                <Coffee size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No products available</p>
                <button
                  onClick={fetchShopProducts}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh Products
                </button>
              </div>
            ) : (
              menuItems.map((item) => {
                const discountedPrice = calculateDiscountedPrice(item.price, item.discount);
                const availableStock = item.qty || item.stock || 0;
                const isOutOfStock = availableStock <= 0;
                const availableSizes = productSizes[item.id] || [];
                const availableAddons = productAddons[item.id] || [];

                return (
                  <div key={item.id} className={`bg-white rounded-xl shadow-lg p-6 ${isOutOfStock ? 'opacity-60' : ''}`}>
                    <div className="flex gap-6">
                      {/* Item Image */}
                      <div className="w-24 h-24 bg-amber-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img
                            src={Config.getFullImagePath(item.image)}
                            alt={item.name}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span className="text-4xl">☕</span>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-amber-900">{item.name}</h3>
                          {item.discount > 0 && (
                            <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                              -{item.discount}%
                            </span>
                          )}
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            {item.barcode}
                          </span>
                        </div>
                        <p className="text-amber-700 mb-2">{item.description}</p>
                        <p className="text-sm text-blue-600 mb-2">{item.category_name}</p>
                        {item.brand && <p className="text-sm text-gray-600 mb-2">Brand: {item.brand}</p>}
                        <div className="flex items-center gap-2">
                          {item.discount > 0 ? (
                            <>
                              <span className="text-lg text-gray-500 line-through">
                                ${Number(item.price).toFixed(2)}
                              </span>
                              <span className="text-2xl font-bold text-green-600">${discountedPrice.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-2xl font-bold text-amber-900">${Number(item.price).toFixed(2)}</span>
                          )}
                        </div>
                        <div className={`text-sm mt-2 ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                          Stock: {availableStock} available
                        </div>
                      </div>

                      {/* Controls */}
                      {!isOutOfStock && (
                        <div className="w-80 space-y-4">
                          {/* Size Selection */}
                          {availableSizes.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Size:</label>
                              <Select
                                allowClear
                                style={{ width: "100%" }}
                                placeholder="Please select size"
                                options={availableSizes.map(size => ({
                                  value: size.value,
                                  label: `${size.name} (+$${Number(size.price).toFixed(2)})`
                                }))}
                                onChange={(value) => updateSize(item.id, value)}
                              />
                            </div>
                          )}

                          {/* Temperature Selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Thermometer className="inline mr-1" size={16} />
                              Temperature:
                            </label>
                            <div className="flex gap-2">
                              {temperatures.map((temp) => (
                                <button
                                  key={temp}
                                  onClick={() => updateTemperature(item.id, temp)}
                                  className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${itemTemperatures[item.id] === temp
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'
                                    }`}
                                >
                                  {temp === 'Hot' ? '🔥' : '🧊'} {temp}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Sugar Level */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Zap className="inline mr-1" size={16} />
                              Sugar Level:
                            </label>
                            <Select
                              allowClear
                              style={{ width: "100%" }}
                              placeholder="Please select sugar level"
                              options={sugarLevels.map(level => ({
                                value: level,
                                label: level
                              }))}
                              onChange={(value) => updateSugarLevel(item.id, value)}
                            />
                          </div>

                          {/* Add-ons */}
                          {availableAddons.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons:</label>
                              <div className="space-y-2 max-h-24 overflow-y-auto">
                                {availableAddons.map((addon) => (
                                  <label key={addon.value} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                      checked={(itemAddons[item.id] || []).some(a => a.value === addon.value)}
                                      onChange={(e) => updateAddons(item.id, addon.value, e.target.checked)}
                                    />
                                    <span className="text-sm">{addon.name} +${Number(addon.price).toFixed(2)}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quantity */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="font-medium">{Math.min(quantities[item.id] || 1, availableStock)}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={(quantities[item.id] || 1) >= availableStock}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* Add to Cart */}
                          <button
                            onClick={() => {
                              if (availableSizes.length > 0 && !itemSizes[item.id]) {
                                message.error('Please select a size');
                                return;
                              }
                              if (!itemTemperatures[item.id]) {
                                message.error('Please select temperature');
                                return;
                              }
                              if (!itemSugarLevels[item.id]) {
                                message.error('Please select sugar level');
                                return;
                              }
                              
                              const requestedQty = quantities[item.id] || 1;
                              if (requestedQty > availableStock) {
                                message.error(`Sorry, only ${availableStock} items available in stock`);
                                return;
                              }
                              
                              addToCart(
                                item,
                                itemSizes[item.id],
                                itemAddons[item.id] || [],
                                itemTemperatures[item.id],
                                itemSugarLevels[item.id],
                                requestedQty
                              );
                            }}
                            className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
                          >
                            Add to Cart
                          </button>
                        </div>
                      )}

                      {isOutOfStock && (
                        <div className="w-80 flex items-center justify-center">
                          <div className="text-center text-red-600 font-medium">
                            Out of Stock
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // Checkout View
  const CheckoutView = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-amber-900">Order Summary</h2>
              <p className="text-amber-700">{selectedShop?.name} - Table {selectedTable}</p>
            </div>
            <button
              onClick={() => setCurrentView('menu')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Menu
            </button>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Items:</h3>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {item.name}
                          {item.discount > 0 && (
                            <span className="bg-red-500 text-white px-1 py-0.5 rounded text-xs">
                              -{item.discount}%
                            </span>
                          )}
                          <span className="text-xs bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                            {item.barcode}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {item.size && <div>Size: {item.size.name}</div>}
                          <div>Temperature: {item.temperature === 'Hot' ? '🔥' : '🧊'} {item.temperature}</div>
                          <div>Sugar: {item.sugarLevel}</div>
                          {item.addons?.length > 0 && (
                            <div>Add-ons: {item.addons.map(a => a.name).join(', ')}</div>
                          )}
                          <div>Quantity: {item.quantity}</div>
                          {item.brand && <div className="text-blue-600">Brand: {item.brand}</div>}
                          {item.category_name && <div className="text-purple-600">Category: {item.category_name}</div>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {item.discount > 0 && (
                            <span className="text-sm text-gray-500 line-through">
                              ${(item.originalPrice * item.quantity).toFixed(2)}
                            </span>
                          )}
                          <span className="font-medium text-green-600">
                            ${item.totalPrice.toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {cart.length > 0 && (
            <div className="border-t pt-4 mb-6 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${(getTotalPrice() + getTotalDiscount()).toFixed(2)}</span>
              </div>
              {getTotalDiscount() > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Total Savings:</span>
                  <span>-${getTotalDiscount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Submit Order Button */}
          {cart.length > 0 && (
            <button
              onClick={submitOrder}
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium text-lg"
            >
              Submit Order
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Seller Dashboard View
  const SellerDashboardView = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-green-900">Seller Dashboard</h1>
              <p className="text-green-700">Monitor and manage orders</p>
            </div>
            <button
              onClick={() => setCurrentView('shops')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Shops
            </button>
          </div>
        </div>

        {/* New Order Alert */}
        {newOrderAlert && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <Bell className="mr-2" size={20} />
              <span className="font-medium">{newOrderAlert}</span>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Coffee size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No orders yet</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-xl shadow-lg p-6 ${order.status === 'pending' ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{order.shop_name} - Table {order.tableNumber}</h3>
                    <p className="text-gray-600">{order.timestamp}</p>
                    <p className="text-sm text-gray-500">Created by: {order.create_by || 'Guest'}</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                      }`}>
                      {order.status === 'pending' ? 'Pending' : 'Completed'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      ${order.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.discount > 0 && (
                            <span className="ml-2 bg-red-500 text-white px-1 py-0.5 rounded text-xs">
                              -{item.discount}%
                            </span>
                          )}
                          {item.barcode && (
                            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                              {item.barcode}
                            </span>
                          )}
                        </div>
                        <span>${item.totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.size?.name && `${item.size.name} • `}
                        {item.temperature} • {item.sugarLevel} • Qty: {item.quantity}
                        {item.addons?.length > 0 && ` • ${item.addons.map(a => a.name).join(', ')}`}
                        {item.brand && ` • Brand: ${item.brand}`}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Accept Button for Pending Orders */}
                {order.status === 'pending' && (
                  <button
                    onClick={() => acceptOrder(order.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Check size={16} />
                    Accept Order
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Render current view
  switch (currentView) {
    case 'tables':
      return (
        <>
          <TableSelectionView />
          <QRCodeModal />
        </>
      );
    case 'menu':
      return <MenuView />;
    case 'checkout':
      return <CheckoutView />;
    case 'seller':
      return <SellerDashboardView />;
    default:
      return <ShopSelectionView />;
  }
};

export default CoffeeMenuApp;