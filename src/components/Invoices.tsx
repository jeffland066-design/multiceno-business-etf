import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Plus, Download, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Invoice } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { v4 as uuidv4 } from 'uuid';

export default function Invoices() {
  const { invoices, setInvoices, syncAction, addToast } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Invoice>>({
    client: '', date: '', amount: 0, status: 'Pending'
  });

  const exportPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("MULTICENO Invoice", 14, 20);
    doc.setFontSize(12);
    doc.text(`Invoice ID: ${invoice.id}`, 14, 30);
    doc.text(`Billed To: ${invoice.client}`, 14, 40);
    doc.text(`Date Issued: ${invoice.date}`, 14, 50);
    doc.text(`Amount Due: $${invoice.amount.toLocaleString()}`, 14, 60);
    doc.text(`Status: ${invoice.status}`, 14, 70);
    doc.save(`invoice_${invoice.id}.pdf`);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingId(inv.id);
    setFormData(inv);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    setInvoices(prev => prev.filter(inv => inv.id !== deleteConfirmId));
    setTimeout(() => syncAction(), 500);
    setDeleteConfirmId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setInvoices(prev => prev.map(inv => inv.id === editingId ? { ...inv, ...formData } as Invoice : inv));
      addToast(`Updated Invoice for ${formData.client}`, 'info');
    } else {
      const newInvoice = { ...formData, id: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}` } as Invoice;
      setInvoices(prev => [...prev, newInvoice]);
      addToast(`Workflow Complete: New Invoice Generated for ${newInvoice.client}`, 'success');
    }
    setIsModalOpen(false);
    setFormData({ client: '', date: '', amount: 0, status: 'Pending' });
    setEditingId(null);
    setTimeout(() => syncAction(), 500);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Accounts Receivable</h1>
          <p className="text-slate-500 mt-1 text-sm">Issue and track client invoices automatically.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus size={16} />
          <span>Create Invoice</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Invoice ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Client</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono font-semibold text-slate-900">{inv.id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{inv.client}</td>
                <td className="px-6 py-4 font-mono font-semibold text-slate-900">${inv.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleOpenEdit(inv)} className="text-slate-400 hover:text-indigo-600 p-1">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteConfirmId(inv.id)} className="text-slate-400 hover:text-rose-600 p-1 ml-2 bg-transparent border-0 cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => exportPDF(inv)} className="text-slate-400 hover:text-indigo-600 p-1 ml-2" title="Download PDF">
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Client Name" required value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                <input type="number" placeholder="Amount ($)" required value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              </div>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700">{editingId ? 'Save Changes' : 'Generate Invoice'}</button>
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
            <p className="text-sm text-slate-600 mb-6 font-medium">Are you sure you want to permanently delete this invoice? This action cannot be undone.</p>
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
