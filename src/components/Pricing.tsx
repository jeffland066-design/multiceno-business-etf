import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Download, Send, X, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../store';
import { ProductPricing } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendEmailWithAttachment } from '../lib/gmail';

export default function Pricing() {
  const { pricings, setPricings, currentUser, syncAction } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const [formData, setFormData] = useState<Partial<ProductPricing>>({
    productName: '', description: '', price: 0, currency: 'USD', lastUpdated: ''
  });

  const [emailReceiver, setEmailReceiver] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleEdit = (p: ProductPricing) => {
    setFormData(p);
    setEditingId(p.id);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    setPricings(prev => prev.filter(p => p.id !== deleteConfirmId));
    setTimeout(() => syncAction(), 500);
    setDeleteConfirmId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    if(editingId) {
      setPricings(prev => prev.map(p => p.id === editingId ? { ...p, ...formData, lastUpdated: today } as ProductPricing : p));
    } else {
      setPricings(prev => [...prev, { ...formData, id: 'price-' + Math.floor(Math.random() * 90000), lastUpdated: today } as ProductPricing]);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ productName: '', description: '', price: 0, currency: 'USD', lastUpdated: '' });
    setTimeout(() => syncAction(), 500);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("MULTICENO Product Pricing Report", 14, 20);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    
    autoTable(doc, {
      startY: 35,
      head: [['Product Name', 'Description', 'Price', 'Currency', 'Last Updated']],
      body: pricings.map(p => [
        p.productName,
        p.description,
        p.price.toString(),
        p.currency,
        p.lastUpdated
      ])
    });
    
    return doc;
  };

  const exportPDF = () => {
    const doc = generatePDF();
    doc.save(`Pricing_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailReceiver) return;
    
    setIsSending(true);
    try {
      const doc = generatePDF();
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      const bodyText = `
        <h2>MULTICENO Pricing Report</h2>
        <p>Please find the requested product pricing report attached.</p>
        <p>Regards,<br/>MULTICENO System</p>
      `;

      await sendEmailWithAttachment(emailReceiver, 'MULTICENO Product Pricing Report', bodyText, 'Pricing_Report.pdf', pdfBase64);
      alert('Pricing report sent successfully to ' + emailReceiver);
      setShowEmailModal(false);
      setEmailReceiver('');
    } catch (err) {
      console.error(err);
      alert('Failed to send the email. Make sure you granted Gmail permissions.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Price Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage product catalog and pricing rules.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowEmailModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
            <Send size={16} />
            <span>Email Report</span>
          </button>
          <button onClick={exportPDF} className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
            <Download size={16} />
            <span>Download PDF</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200">
            <Plus size={16} />
            <span>New Product</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Currency</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pricings.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{p.productName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate">{p.description}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{p.price.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {p.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{p.lastUpdated}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(p)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(p.id)} className="text-slate-400 hover:text-rose-600 transition-colors p-1 ml-2 bg-transparent border-0 cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {pricings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No pricing records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Product Pricing' : 'New Product'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ productName: '', description: '', price: 0, currency: 'USD', lastUpdated: '' }); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Product Name" required value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <textarea placeholder="Description" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl min-h-[80px]" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Price" min="0" step="0.01" required value={formData.price === 0 ? '' : formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                <select required value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700">{editingId ? 'Save Changes' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Email Pricing Report</h2>
              <button onClick={() => { setShowEmailModal(false); setEmailReceiver(''); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <input type="email" placeholder="Recipient Email Address" required value={emailReceiver} onChange={e => setEmailReceiver(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setShowEmailModal(false); setEmailReceiver(''); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={isSending} className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700 flex items-center disabled:opacity-50 space-x-2">
                  {isSending && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  <span>{isSending ? 'Sending...' : 'Send PDF'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 animate-fade-in">
            <div className="flex items-center space-x-2 text-rose-600 font-bold mb-3">
              <AlertTriangle size={20} />
              <span>Confirm Deletion</span>
            </div>
            <p className="text-sm text-slate-600 mb-6 font-medium">Are you sure you want to permanently delete this product pricing record? This action cannot be undone.</p>
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
