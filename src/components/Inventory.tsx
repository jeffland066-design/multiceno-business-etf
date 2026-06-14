import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../store';
import { Plus, Package, Download, Trash2, AlertTriangle, Camera, Activity, Search, Filter } from 'lucide-react';
import { InventoryItem } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { v4 as uuidv4 } from 'uuid';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { sendEmail } from '../lib/gmail';

const consumptionData = [
  { day: 'Day 1', usages: 15 },
  { day: 'Day 5', usages: 25 },
  { day: 'Day 10', usages: 18 },
  { day: 'Day 15', usages: 42 },
  { day: 'Day 20', usages: 30 },
  { day: 'Day 25', usages: 48 },
  { day: 'Day 30', usages: 55 },
];

export default function Inventory() {
  const { inventory, setInventory, syncAction, addToast } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '', sku: '', category: 'Food', quantity: 0, price: 0, status: 'In Stock'
  });
  const [boxes, setBoxes] = useState<number | ''>('');
  const [unitsPerBox, setUnitsPerBox] = useState<number | ''>('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSupplier, setFilterSupplier] = useState('All');
  const [filterShelf, setFilterShelf] = useState('All');

  useEffect(() => {
    const lowStockItems = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock');
    const todayStr = new Date().toISOString().split('T')[0];
    const emailSentDate = localStorage.getItem('lastLowStockEmailDate');
    
    if (lowStockItems.length >= 2 && emailSentDate !== todayStr) {
      localStorage.setItem('lastLowStockEmailDate', todayStr);
      sendEmail(
        'ceo@multiceno.com', // Typically this would come from User's email, but mock it as ceo
        'MULTICENO: Multiple Items Low Stock Alert',
        `Attention CEO, multiple inventory items are low on stock today:<br/><ul>` + 
        lowStockItems.map(i => `<li>${i.name} (${i.sku}) - Qty: ${i.quantity}</li>`).join('') +
        `</ul>`
      ).catch(err => console.error('Failed to send low stock alert:', err));
    }
  }, [inventory]);

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(
        (decodedText) => {
          const existingItem = inventory.find(i => i.sku === decodedText);
          if (existingItem) {
            setFormData(existingItem);
            setIsModalOpen(true);
            addToast(`Found existing item: ${existingItem.name}`, 'info');
          } else {
            setFormData({ ...formData, sku: decodedText });
            setIsModalOpen(true);
            addToast(`New SKU scanned: ${decodedText}`, 'info');
          }
          setIsScannerOpen(false);
          scanner.clear();
        },
        (error) => {
          // ignore errors
        }
      );

      return () => {
        scanner.clear().catch(e => console.error('Failed to clear scanner', e));
      };
    }
  }, [isScannerOpen, inventory, formData]);

  const isDevice = formData.category?.toLowerCase() === 'device' || formData.category?.toLowerCase() === 'hardware';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalQuantity = formData.quantity || 0;
    if (!isDevice) {
      const b = typeof boxes === 'number' ? boxes : 0;
      const u = typeof unitsPerBox === 'number' ? unitsPerBox : 0;
      finalQuantity = b * u;
    }

    const threshold = formData.minThreshold !== undefined ? formData.minThreshold : 5;

    setInventory(prev => [...prev, { ...formData, quantity: finalQuantity, status: finalQuantity === 0 ? 'Out of Stock' : (finalQuantity <= threshold ? 'Low Stock' : 'In Stock'), id: uuidv4() } as InventoryItem]);
    setIsModalOpen(false);
    setFormData({ name: '', sku: '', category: 'Food', quantity: 0, price: 0, status: 'In Stock', minThreshold: 5, supplier: '', shelfLocation: '' });
    setBoxes('');
    setUnitsPerBox('');
    setTimeout(() => syncAction(), 500);
  };

  const adjustQty = (id: string, delta: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        const threshold = item.minThreshold !== undefined ? item.minThreshold : 5;
        return { ...item, quantity: newQty, status: newQty === 0 ? 'Out of Stock' : (newQty <= threshold ? 'Low Stock' : 'In Stock') };
      }
      return item;
    }));
    setTimeout(() => syncAction(), 500);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    setInventory(prev => prev.filter(item => item.id !== deleteConfirmId));
    setTimeout(() => syncAction(), 500);
    setDeleteConfirmId(null);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("MULTICENO Supply Inventory", 14, 15);
    const tableData = inventory.map(i => [i.sku, i.name, i.category, i.quantity.toString(), `$${i.price}`, i.status]);
    autoTable(doc, {
      startY: 20,
      head: [['SKU', 'Item Name', 'Category', 'Quantity', 'Price', 'Status']],
      body: tableData as any
    });
    doc.save("inventory_report.pdf");
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = filterCategory === 'All' || item.category === filterCategory;
      const matchSupplier = filterSupplier === 'All' || (item.supplier || 'Unknown') === filterSupplier;
      const matchShelf = filterShelf === 'All' || (item.shelfLocation || 'Unassigned') === filterShelf;
      return matchSearch && matchCat && matchSupplier && matchShelf;
    });
  }, [inventory, searchQuery, filterCategory, filterSupplier, filterShelf]);

  const uniqueCategories = ['All', ...Array.from(new Set(inventory.map(i => i.category)))];
  const uniqueSuppliers = ['All', ...Array.from(new Set(inventory.map(i => i.supplier || 'Unknown')))];
  const uniqueShelves = ['All', ...Array.from(new Set(inventory.map(i => i.shelfLocation || 'Unassigned')))];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supply & Inventory Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Control stock levels, hardware, and assets.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setIsScannerOpen(true)} className="flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm">
            <Camera size={18} />
          </button>
          <button onClick={exportPDF} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={16} />
            <span>Report</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus size={16} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Consumption Trends</h2>
              <p className="text-sm text-slate-500">Stock usage history (Last 30 Days)</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consumptionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="usages" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl shadow-sm p-6 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Inventory Health</h3>
            <p className="text-slate-400 text-sm mb-6">High-level asset metrics</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                <span className="text-slate-300">Total Unique Items</span>
                <span className="font-bold text-xl">{inventory.length}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                <span className="text-slate-300">Low Stock Alerts</span>
                <span className="font-bold text-xl text-amber-400">{inventory.filter(i => i.status === 'Low Stock').length}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                <span className="text-slate-300">Out of Stock</span>
                <span className="font-bold text-xl text-rose-400">{inventory.filter(i => i.status === 'Out of Stock').length}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-400">Total Asset Value</p>
            <p className="font-mono text-2xl font-bold tracking-tight text-white mt-1">
              ${inventory.reduce((acc, item) => acc + (item.quantity * item.price), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by product name or SKU..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:font-normal"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
              <Filter className="text-slate-400" size={14} />
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 py-1.5 focus:outline-none border-none">
                {uniqueCategories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
              <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 py-1.5 focus:outline-none border-none">
                {uniqueSuppliers.map(s => <option key={s} value={s}>{s === 'All' ? 'All Suppliers' : s}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
              <select value={filterShelf} onChange={e => setFilterShelf(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 py-1.5 focus:outline-none border-none">
                {uniqueShelves.map(s => <option key={s} value={s}>{s === 'All' ? 'All Shelf Locations' : s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Item Details</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Supplier & Loc</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Stock Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInventory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Package size={18} /></div>
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500 font-mono tracking-wider">SKU: {item.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div className="font-medium text-slate-800">{item.supplier || 'Unknown'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Loc: {item.shelfLocation || 'Unassigned'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                    item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' : 
                    item.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center space-x-3">
                      <button onClick={() => adjustQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-medium">-</button>
                      <span className="font-mono font-bold text-slate-900 w-8 text-center">{item.quantity}</span>
                      <button onClick={() => adjustQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-medium">+</button>
                      <button onClick={() => setDeleteConfirmId(item.id)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center ml-2 bg-transparent border-0 cursor-pointer">
                         <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase mt-1 tracking-wider">
                      Min Alert: {item.minThreshold !== undefined ? item.minThreshold : 5}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Supply Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Product Code</label>
                <input type="text" placeholder="e.g. SKU-123" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl font-mono text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Describe the Product</label>
                <input type="text" placeholder="Product Name / Description" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white">
                  <option value="Food">Food</option>
                  <option value="Supply">Supply</option>
                  <option value="Device">Device (Hardware)</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Supplier</label>
                  <input type="text" placeholder="e.g. Acme Corp" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Shelf Location</label>
                  <input type="text" placeholder="e.g. A1-Bin4" value={formData.shelfLocation || ''} onChange={e => setFormData({...formData, shelfLocation: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl font-mono text-sm" />
                </div>
              </div>

              {!isDevice ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Units in a Box</label>
                      <input type="number" min="0" placeholder="e.g. 12" required value={unitsPerBox} onChange={e => setUnitsPerBox(e.target.value ? parseInt(e.target.value) : '')} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Number of Boxes</label>
                      <input type="number" min="0" placeholder="e.g. 5" required value={boxes} onChange={e => setBoxes(e.target.value ? parseInt(e.target.value) : '')} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price for One Unit ($)</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00" required value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Min Threshold</label>
                      <input type="number" min="0" placeholder="e.g. 5" required value={formData.minThreshold === undefined ? 5 : formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                    </div>
                  </div>
                  
                  {typeof boxes === 'number' && typeof unitsPerBox === 'number' && typeof formData.price === 'number' && !isNaN(formData.price) && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-slate-500 font-semibold uppercase">Total Quantity</div>
                        <div className="font-mono text-slate-700 font-bold">{boxes * unitsPerBox} units</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500 font-semibold uppercase">Total Value</div>
                        <div className="font-mono text-indigo-700 font-bold text-lg">${((boxes * unitsPerBox) * formData.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Total Quantity</label>
                    <input type="number" min="0" placeholder="Initial Quantity" required value={formData.quantity === 0 ? '' : formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Unit Price ($)</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00" required value={formData.price === 0 ? '' : formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Min Threshold</label>
                    <input type="number" min="0" placeholder="e.g. 5" required value={formData.minThreshold === undefined ? 5 : formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium border-0 cursor-pointer bg-transparent">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700 border-0 cursor-pointer">Add to Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Scan Barcode / QR</h2>
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div id="reader" className="w-full h-auto min-h-[300px] overflow-hidden rounded-xl border-2 border-dashed border-slate-200"></div>
            <p className="text-center text-sm text-slate-500 mt-4">Point your camera at a product barcode to parse details.</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 animate-fade-in font-sans">
            <div className="flex items-center space-x-2 text-rose-600 font-bold mb-3">
              <AlertTriangle size={20} />
              <span>Confirm Deletion</span>
            </div>
            <p className="text-sm text-slate-600 mb-6 font-medium">Are you sure you want to permanently delete this inventory asset? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setDeleteConfirmId(null)} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm border-0 bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={confirmDelete} 
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm font-medium text-sm border-0 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
