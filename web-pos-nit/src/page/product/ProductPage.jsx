// import React, { useState } from 'react';
// import { Plus, Coffee, Droplets, Milk, Cookie, Cake, Upload, X, Copy, FileText, Wheat } from 'lucide-react';
// import { useEffect } from 'react';
// import { request } from '../../util/helper';

// const SmartProductEntry = () => {
//   const [selectedCategory, setSelectedCategory] = useState('');
//   const [showModal, setShowModal] = useState(false);
//   const [currentForm, setCurrentForm] = useState({});
//   const [showBulkImport, setShowBulkImport] = useState(false);
//   const [showTemplates, setShowTemplates] = useState(false);
//   // const [categories, setCategories] = useState([]);
// const [category, setcategory] = useState([]);



//   useEffect(() => {
//   const fetchCategories = async () => {
//     const res = await request('category', 'get'); // 📌 Adjust endpoint if needed
//     if (res && !res.error) {
//       setcategory(res.list); // ⬅️ you’ll need a new state: const [categories, setCategories] = useState([])
//     }
//   };
//   fetchCategories();
// }, []);


//   const categories = [
//     { id: 'coffee', name: 'Coffee', icon: Coffee, color: 'bg-amber-500' },
//     { id: 'juice', name: 'Juice', icon: Droplets, color: 'bg-orange-500' },
//     { id: 'milk', name: 'Milk Based', icon: Milk, color: 'bg-blue-500' },
//     { id: 'snack', name: 'Snack', icon: Cookie, color: 'bg-yellow-500' },
//     { id: 'rice', name: 'Rice', icon: Wheat, color: 'bg-green-500' },
//     { id: 'dessert', name: 'Dessert', icon: Cake, color: 'bg-pink-500' }
//   ];

//   const categoryTemplates = {
//     coffee: {
//       sizes: [
//         { label: 'Small (8oz)', price: 2.5 },
//         { label: 'Medium (12oz)', price: 3.0 },
//         { label: 'Large (16oz)', price: 3.5 }
//       ],
//       addons: [
//         { label: 'Extra Shot', price: 0.5 },
//         { label: 'Decaf', price: 0 },
//         { label: 'Oat Milk', price: 0.3 },
//         { label: 'Vanilla Syrup', price: 0.3 }
//       ],
//       commonNames: ['Americano', 'Latte', 'Cappuccino', 'Espresso', 'Mocha']
//     },
//     juice: {
//       sizes: [
//         { label: 'Small (250ml)', price: 2.0 },
//         { label: 'Medium (350ml)', price: 2.5 },
//         { label: 'Large (500ml)', price: 3.0 }
//       ],
//       addons: [
//         { label: 'Extra Ice', price: 0 },
//         { label: 'Less Sugar', price: 0 },
//         { label: 'Add Mint', price: 0.2 }
//       ],
//       commonNames: ['Orange Juice', 'Apple Juice', 'Mango Juice', 'Mixed Fruit']
//     },
//     milk: {
//       sizes: [
//         { label: 'Regular', price: 3.0 },
//         { label: 'Large', price: 4.0 }
//       ],
//       addons: [
//         { label: 'Extra Cream', price: 0.5 },
//         { label: 'Chocolate Powder', price: 0.3 },
//         { label: 'Honey', price: 0.2 }
//       ],
//       commonNames: ['Milk Tea', 'Chocolate Milk', 'Strawberry Milk', 'Taro Milk']
//     },
//     snack: {
//       sizes: [
//         { label: 'Regular', price: 1.5 }
//       ],
//       addons: [
//         { label: 'Extra Sauce', price: 0.2 }
//       ],
//       commonNames: ['Cookies', 'Chips', 'Nuts', 'Crackers']
//     },
//     rice: {
//       sizes: [
//         { label: 'Small Bowl', price: 3.0 },
//         { label: 'Regular Bowl', price: 4.0 },
//         { label: 'Large Bowl', price: 5.0 }
//       ],
//       addons: [
//         { label: 'Extra Meat', price: 1.0 },
//         { label: 'Extra Vegetables', price: 0.5 },
//         { label: 'Fried Egg', price: 0.5 }
//       ],
//       commonNames: ['Fried Rice', 'Steamed Rice', 'Curry Rice', 'Mixed Rice']
//     },
//     dessert: {
//       sizes: [
//         { label: 'Small', price: 2.0 },
//         { label: 'Regular', price: 3.0 }
//       ],
//       addons: [
//         { label: 'Extra Cream', price: 0.5 },
//         { label: 'Extra Fruit', price: 0.3 }
//       ],
//       commonNames: ['Ice Cream', 'Cake', 'Pudding', 'Fruit Salad']
//     }
//   };

//   const handleCategorySelect = (categoryId) => {
//     setSelectedCategory(categoryId);
//     const template = categoryTemplates[categoryId];
//     setCurrentForm({
//       category: categoryId,
//       sizes: template.sizes,
//       addons: template.addons,
//       name: '',
//       basePrice: template.sizes[0]?.price || 0,
//       brand: '',
//       quantity: 1,
//       status: 'active'
//     });
//     setShowModal(true);
//   };

//   const handleInputChange = (field, value) => {
//     setCurrentForm(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const handleSizeChange = (index, field, value) => {
//     const newSizes = [...currentForm.sizes];
//     newSizes[index] = { ...newSizes[index], [field]: value };
//     setCurrentForm(prev => ({ ...prev, sizes: newSizes }));
//   };

//   const handleAddonChange = (index, field, value) => {
//     const newAddons = [...currentForm.addons];
//     newAddons[index] = { ...newAddons[index], [field]: value };
//     setCurrentForm(prev => ({ ...prev, addons: newAddons }));
//   };

//   const addSize = () => {
//     setCurrentForm(prev => ({
//       ...prev,
//       sizes: [...prev.sizes, { label: '', price: 0 }]
//     }));
//   };

//   const addAddon = () => {
//     setCurrentForm(prev => ({
//       ...prev,
//       addons: [...prev.addons, { label: '', price: 0 }]
//     }));
//   };

//   const removeSize = (index) => {
//     setCurrentForm(prev => ({
//       ...prev,
//       sizes: prev.sizes.filter((_, i) => i !== index)
//     }));
//   };

//   const removeAddon = (index) => {
//     setCurrentForm(prev => ({
//       ...prev,
//       addons: prev.addons.filter((_, i) => i !== index)
//     }));
//   };

// const handleSave = async () => {
//   const formData = new FormData();
//   formData.append('name', currentForm.name);
//   formData.append('category_id', selectedCategory);
//   formData.append('brand', currentForm.brand);
//   formData.append('qty', currentForm.quantity);
//   formData.append('status', currentForm.status === 'active' ? 1 : 0);
//   formData.append('description', currentForm.description);
//   formData.append('sizes', JSON.stringify(currentForm.sizes));
//   formData.append('addons', JSON.stringify(currentForm.addons));
//   formData.append('upload_image', selectedFile); // 🖼️ image file you choose

//   const res = await request('product', 'post', formData, { isFormData: true });
// };



//   const duplicateProduct = (productName) => {
//     // Logic to duplicate existing product
//     alert(`Duplicating ${productName}...`);
//   };

//   const BulkImportModal = () => (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold">Bulk Import Products</h3>
//           <button onClick={() => setShowBulkImport(false)} className="text-gray-500 hover:text-gray-700">
//             <X className="w-5 h-5" />
//           </button>
//         </div>
        
//         <div className="space-y-4">
//           <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//             <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
//             <p className="text-sm text-gray-600">Drop your Excel/CSV file here or click to browse</p>
//             <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//               Choose File
//             </button>
//           </div>
          
//           <div className="text-sm text-gray-600">
//             <p className="font-medium mb-2">File format requirements:</p>
//             <ul className="list-disc list-inside space-y-1">
//               <li>Column headers: Name, Category, Brand, Price, Quantity</li>
//               <li>Supported formats: .xlsx, .csv</li>
//               <li>Maximum 100 products per import</li>
//             </ul>
//           </div>
          
//           <button 
//             onClick={() => alert('Sample template downloaded!')}
//             className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//           >
//             <FileText className="w-4 h-4 inline mr-2" />
//             Download Sample Template
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="mb-8">
//         <h1 className="text-2xl font-bold text-gray-800 mb-2">Product Management</h1>
//         <p className="text-gray-600">Choose a category to quickly add products</p>
//       </div>

//       {/* Quick Actions */}
//       <div className="flex flex-wrap gap-4 mb-8">
//         <button 
//           onClick={() => setShowBulkImport(true)}
//           className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
//         >
//           <Upload className="w-4 h-4 mr-2" />
//           Bulk Import
//         </button>
//         <button 
//           onClick={() => setShowTemplates(true)}
//           className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
//         >
//           <Copy className="w-4 h-4 mr-2" />
//           Use Templates
//         </button>
//       </div>

//       {/* Category Grid */}
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
//         {categories.map((category) => {
//           const IconComponent = category.icon;
//           return (
//             <button
//               key={category.id}
//               onClick={() => handleCategorySelect(category.id)}
//               className={`${category.color} text-white p-6 rounded-lg hover:opacity-90 transition-opacity shadow-lg`}
//             >
//               <IconComponent className="w-8 h-8 mx-auto mb-2" />
//               <p className="text-sm font-medium">{category.name}</p>
//             </button>
//           );
//         })}
//       </div>

//       {/* Recent Products Preview */}
//       <div className="bg-white rounded-lg shadow p-6">
//         <h2 className="text-lg font-semibold mb-4">Recent Products</h2>
//         <div className="space-y-3">
//           {['Americano', 'Orange Juice', 'Chocolate Milk', 'Fried Rice'].map((product, index) => (
//             <div key={index} className="flex items-center justify-between p-3 border rounded">
//               <span className="font-medium">{product}</span>
//               <div className="flex gap-2">
//                 <button 
//                   onClick={() => duplicateProduct(product)}
//                   className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
//                 >
//                   <Copy className="w-3 h-3 inline mr-1" />
//                   Duplicate
//                 </button>
//                 <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
//                   Edit
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Smart Product Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-xl font-semibold">
//                 Add {categories.find(c => c.id === selectedCategory)?.name} Product
//               </h2>
//               <button 
//                 onClick={() => setShowModal(false)}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Left Column */}
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-2">Product Name *</label>
//                   <select 
//                     value={currentForm.name}
//                     onChange={(e) => handleInputChange('name', e.target.value)}
//                     className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select or type custom name</option>
//                     {categoryTemplates[selectedCategory]?.commonNames.map(name => (
//                       <option key={name} value={name}>{name}</option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Sizes Section */}
//                 <div>
//                   <h3 className="font-medium mb-2">Sizes & Pricing</h3>
//                   {currentForm.sizes?.map((size, index) => (
//                     <div key={index} className="flex gap-2 mb-2">
//                       <input
//                         type="text"
//                         placeholder="Size name"
//                         value={size.label}
//                         onChange={(e) => handleSizeChange(index, 'label', e.target.value)}
//                         className="flex-1 p-2 border rounded"
//                       />
//                       <input
//                         type="number"
//                         placeholder="Price"
//                         value={size.price}
//                         onChange={(e) => handleSizeChange(index, 'price', parseFloat(e.target.value))}
//                         className="w-20 p-2 border rounded"
//                       />
//                       {currentForm.sizes.length > 1 && (
//                         <button 
//                           onClick={() => removeSize(index)}
//                           className="px-2 py-1 text-red-600 hover:bg-red-100 rounded"
//                         >
//                           <X className="w-4 h-4" />
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                   <button 
//                     onClick={addSize} 
//                     className="text-blue-600 hover:text-blue-800 text-sm"
//                   >
//                     + Add Size
//                   </button>
//                 </div>

//                 {/* Addons Section */}
//                 <div>
//                   <h3 className="font-medium mb-2">Add-ons</h3>
//                   {currentForm.addons?.map((addon, index) => (
//                     <div key={index} className="flex gap-2 mb-2">
//                       <input
//                         type="text"
//                         placeholder="Add-on name"
//                         value={addon.label}
//                         onChange={(e) => handleAddonChange(index, 'label', e.target.value)}
//                         className="flex-1 p-2 border rounded"
//                       />
//                       <input
//                         type="number"
//                         placeholder="Price"
//                         value={addon.price}
//                         onChange={(e) => handleAddonChange(index, 'price', parseFloat(e.target.value))}
//                         className="w-20 p-2 border rounded"
//                       />
//                       <button 
//                         onClick={() => removeAddon(index)}
//                         className="px-2 py-1 text-red-600 hover:bg-red-100 rounded"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     </div>
//                   ))}
//                   <button 
//                     onClick={addAddon} 
//                     className="text-blue-600 hover:text-blue-800 text-sm"
//                   >
//                     + Add Add-on
//                   </button>
//                 </div>
//               </div>

//               {/* Right Column */}
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-2">Brand *</label>
//                   <select 
//                     value={currentForm.brand}
//                     onChange={(e) => handleInputChange('brand', e.target.value)}
//                     className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select brand</option>
//                     <option value="local">Local Brand</option>
//                     <option value="imported">Imported Brand</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-2">Quantity</label>
//                   <input
//                     type="number"
//                     value={currentForm.quantity}
//                     onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
//                     className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-2">Status</label>
//                   <select 
//                     value={currentForm.status}
//                     onChange={(e) => handleInputChange('status', e.target.value)}
//                     className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="active">Active</option>
//                     <option value="inactive">Inactive</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-2">Description</label>
//                   <textarea
//                     value={currentForm.description || ''}
//                     onChange={(e) => handleInputChange('description', e.target.value)}
//                     rows={3}
//                     className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                     placeholder="Enter product description..."
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-2">Product Image</label>
//                   <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
//                     <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
//                     <p className="text-sm text-gray-600">Click to upload image</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Modal Footer */}
//             <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
//               <button 
//                 onClick={() => setShowModal(false)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button 
//                 onClick={handleSave}
//                 className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//               >
//                 Save Product
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Bulk Import Modal */}
//       {showBulkImport && <BulkImportModal />}
//     </div>
//   );
// };

// export default SmartProductEntry;