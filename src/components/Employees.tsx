import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Plus, Edit2, Download, Trash2, AlertTriangle } from 'lucide-react';
import { User } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { v4 as uuidv4 } from 'uuid';

export default function Employees() {
  const { employees, setEmployees, syncAction } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '', role: '', email: '', department: '', status: 'Active'
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("MULTICENO Employee Directory", 14, 15);
    const tableData = employees.map(e => [e.name, e.role, e.department, e.email, e.status]);
    autoTable(doc, {
      startY: 20,
      head: [['Name', 'Role', 'Department', 'Email', 'Status']],
      body: tableData as any
    });
    doc.save("employee_directory.pdf");
  };

  const handleOpenEdit = (emp: User) => {
    setEditingId(emp.id);
    setFormData(emp);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    setEmployees(prev => prev.filter(emp => emp.id !== deleteConfirmId));
    setTimeout(() => syncAction(), 500);
    setDeleteConfirmId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setEmployees(prev => prev.map(emp => emp.id === editingId ? { ...emp, ...formData } as User : emp));
    } else {
      setEmployees(prev => [...prev, { ...formData, id: uuidv4() } as User]);
    }
    setIsModalOpen(false);
    setFormData({name: '', role: '', email: '', department: '', status: 'Active'});
    setEditingId(null);
    setTimeout(() => syncAction(), 500);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage organizational structure and personnel.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={exportPDF} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={16} />
            <span>Export Directory</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Employee</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Department</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{emp.name}</div>
                  <div className="text-xs text-slate-500">{emp.role} • {emp.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{emp.department}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${emp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleOpenEdit(emp)} className="text-slate-400 hover:text-indigo-600 p-1">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteConfirmId(emp.id)} className="text-slate-400 hover:text-rose-600 p-1 ml-2 bg-transparent border-0 cursor-pointer">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{editingId ? 'Edit Employee' : 'Add Employee'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <input type="text" placeholder="Job Role" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <input type="text" placeholder="Department" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm">Save Employee</button>
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
            <p className="text-sm text-slate-600 mb-6 font-medium">Are you sure you want to permanently remove this executive employee? This action cannot be undone.</p>
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
