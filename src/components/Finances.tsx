import React, { useState } from 'react';
import { useAppContext } from '../store';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { filterByDateRange } from '../lib/dateFilter';

export default function Finances() {
  const { finances, setFinances, syncAction, logAction, dateFilter } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'Income',
    category: 'General'
  });

  const filteredFinances = filterByDateRange<any>(finances, dateFilter);

  const totalIncome = filteredFinances.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredFinances.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const pieData = filteredFinances.filter(t => t.type === 'Expense').reduce((acc: any[], t) => {
    const existing = acc.find(x => x.name === t.category);
    if (existing) existing.value += t.amount;
    else acc.push({ name: t.category, value: t.amount });
    return acc;
  }, []);

  const monthlyDataMap = filteredFinances.reduce((acc: Record<string, { name: string; income: number; expense: number }>, t) => {
    const month = new Date(t.date).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!acc[month]) acc[month] = { name: month, income: 0, expense: 0 };
    if (t.type === 'Income') acc[month].income += t.amount;
    else acc[month].expense += t.amount;
    return acc;
  }, {});

  const barData = (Object.values(monthlyDataMap) as { name: string; income: number; expense: number }[]).map(d => ({
    ...d,
    profit: d.income - d.expense
  }));

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setFinances(prev => prev.map(t => t.id === editingId ? { ...t, ...formData } as Transaction : t));
      logAction('Ledger Updated', 'Finance', `Modified financial item: "${formData.description}" (${formData.type}) for $${formData.amount?.toLocaleString()}.`);
    } else {
      setFinances(prev => [...prev, { ...formData, id: uuidv4() } as Transaction]);
      logAction('Ledger Entry Added', 'Finance', `Recorded new ${formData.type}: "${formData.description}" under category "${formData.category}" for $${formData.amount?.toLocaleString()}.`);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ date: new Date().toISOString().split('T')[0], description: '', amount: 0, type: 'Income', category: 'General' });
    setTimeout(() => syncAction(), 500);
  };

  const handleEdit = (txn: Transaction) => {
    setFormData(txn);
    setEditingId(txn.id);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    const itemToDelete = finances.find(t => t.id === deleteConfirmId);
    if (itemToDelete) {
      logAction('Ledger entry voided', 'Finance', `Voided transaction "${itemToDelete.description}" of $${itemToDelete.amount.toLocaleString()}.`);
    }
    setFinances(prev => prev.filter(t => t.id !== deleteConfirmId));
    setTimeout(() => syncAction(), 500);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finances & Profitability</h1>
          <p className="text-slate-500 mt-1 text-sm">Track income, expenditures, and net cash flow.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm">
          <Plus size={16} />
          <span>Add Transaction</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Income</div>
          <div className="text-3xl font-bold text-slate-900 font-mono">${totalIncome.toLocaleString()}</div>
          <div className="flex items-center text-xs font-semibold text-emerald-600 mt-2">
            <ArrowUpRight size={14} className="mr-1" /> Trending up
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Expenditure</div>
          <div className="text-3xl font-bold text-slate-900 font-mono">${totalExpense.toLocaleString()}</div>
          <div className="flex items-center text-xs font-semibold text-rose-600 mt-2">
            <ArrowDownRight size={14} className="mr-1" /> Needs attention
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm bg-indigo-50 border-indigo-100">
          <div className="text-sm font-medium text-indigo-500 mb-1">Net Profit</div>
          <div className="text-3xl font-bold text-indigo-700 font-mono">${netProfit.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <h2 className="font-semibold text-slate-800 mb-6">Monthly Revenue & Expenditure</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `$${value/1000}k`} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-6">Expenditure by Category</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Recent Transactions</h2>
        </div>
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFinances.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-500">{txn.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{txn.description}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{txn.category}</td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${txn.type === 'Income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {txn.type === 'Income' ? '+' : '-'}${txn.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(txn)} className="text-slate-400 hover:text-indigo-600 p-1 mr-1 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(txn.id)} className="text-slate-400 hover:text-rose-600 p-1 transition-colors bg-transparent border-0 cursor-pointer">
                      <Trash2 size={16} />
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ date: new Date().toISOString().split('T')[0], description: '', amount: 0, type: 'Income', category: 'General' }) }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
              <input type="number" placeholder="Amount" required value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <input type="text" placeholder="Description" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <input type="text" placeholder="Category (e.g. Sales, Marketing, Payroll)" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700">{editingId ? 'Save Changes' : 'Record Transaction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 animate-fade-in">
            <div className="flex items-center space-x-2 text-rose-600 font-bold mb-3">
              <AlertTriangle size={20} />
              <span>Confirm Deletion</span>
            </div>
            <p className="text-sm text-slate-600 mb-6 font-medium">Are you sure you want to permanently delete this transaction? This action cannot be undone.</p>
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
