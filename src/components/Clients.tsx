import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Plus, Download, Edit2, Trash2 } from 'lucide-react';
import { Client } from '../types';

export default function Clients() {
  const { clients, setClients, syncAction, addToast } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({});

  const handleSave = async () => {
    if (editingId) {
      setClients(prev => prev.map(c => c.id === editingId ? { ...c, ...formData } as Client : c));
      addToast(`Updated ${formData.type?.toLowerCase()} ${formData.name}`, 'info');
    } else {
      const newClient = {
        ...formData,
        id: `c-${Date.now()}`,
        status: formData.status || 'Active',
        type: formData.type || 'Client'
      } as Client;
      setClients(prev => [...prev, newClient]);
      addToast(`Successfully added new ${newClient.type?.toLowerCase()} ${newClient.name}`, 'success');
    }
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
    await syncAction();
  };

  const handleDelete = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await syncAction();
  };

  const handleDownload = () => {
    const headers = ['ID', 'Name', 'Type', 'Email', 'Phone', 'Company', 'Status'];
    const rows = clients.map(c => [c.id, c.name, c.type, c.email, c.phone, c.company, c.status]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'clients_and_suppliers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clients & Suppliers</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your contacts, export data, and keep track of your relationships.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => { setFormData({ type: 'Client', status: 'Active' }); setIsAdding(true); }}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
          >
            <Plus size={18} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">{editingId ? 'Edit Contact' : 'New Contact'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Name *" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            <select value={formData.type || 'Client'} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="Client">Client</option>
              <option value="Supplier">Supplier</option>
            </select>
            <input type="email" placeholder="Email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            <input type="text" placeholder="Phone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            <input type="text" placeholder="Company *" value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            <select value={formData.status || 'Active'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button onClick={handleSave} disabled={!formData.name || !formData.company} className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">Save Contact</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Name</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{client.name}</td>
                <td className="p-4 text-slate-600">{client.company}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    client.type === 'Client' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {client.type}
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-500">
                  <div className="truncate w-40">{client.email}</div>
                  <div className="text-xs">{client.phone}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    client.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {client.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => { setFormData(client); setEditingId(client.id); setIsAdding(false); }} className="text-slate-400 hover:text-indigo-600 transition-colors p-2"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(client.id)} className="text-slate-400 hover:text-rose-600 transition-colors p-2"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">No contacts found. Add a client or supplier to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
