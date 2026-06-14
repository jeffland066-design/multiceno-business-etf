import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../store';
import { Project } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { filterByDateRange } from '../lib/dateFilter';

export default function Projects() {
  const { projects, setProjects, syncAction, dateFilter } = useAppContext();
  const [filter, setFilter] = useState('All');
  
  const filteredProjectsByDate = filterByDateRange<any>(projects, dateFilter);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '', status: 'Planning', progress: 0, team: 1, deadline: ''
  });

  const handleEdit = (p: Project) => {
    setFormData(p);
    setEditingId(p.id);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    setProjects(prev => prev.filter(p => p.id !== deleteConfirmId));
    setTimeout(() => syncAction(), 500);
    setDeleteConfirmId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingId) {
      setProjects(prev => prev.map(p => p.id === editingId ? { ...p, ...formData } as Project : p));
    } else {
      setProjects(prev => [...prev, { ...formData, id: Math.floor(Math.random() * 900) + 100 + '' } as Project]);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', status: 'Planning', progress: 0, team: 1, deadline: '' });
    setTimeout(() => syncAction(), 500);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Projects</h1>
          <p className="text-slate-500 mt-1 text-sm">Strategic initiatives and company-wide goals.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
          <Plus size={16} />
          <span>New Initiative</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex space-x-2">
            {['All', 'In Progress', 'Planning', 'At Risk', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
              />
            </div>
            <button className="p-2 text-slate-500 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Project Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Progress</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Team</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Target Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjectsByDate.filter(p => filter === 'All' || p.status === filter).map((project) => (
                <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{project.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">ID: PRJ-{project.id.padStart(3, '0')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      project.status === 'At Risk' ? 'bg-rose-100 text-rose-700' :
                      project.status === 'Planning' ? 'bg-amber-100 text-amber-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 w-48">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            project.status === 'At Risk' ? 'bg-rose-500' : 
                            project.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-medium text-slate-600">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">{project.team} members</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {project.deadline}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(project)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(project.id)} className="text-slate-400 hover:text-rose-600 transition-colors p-1 ml-2 bg-transparent border-0 cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ name: '', status: 'Planning', progress: 0, team: 1, deadline: '' }); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Project Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="At Risk">At Risk</option>
                <option value="Completed">Completed</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Progress (%)" min="0" max="100" required value={formData.progress || 0} onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                <input type="number" placeholder="Team Size" required min="1" value={formData.team || 1} onChange={e => setFormData({...formData, team: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              </div>
              <input type="date" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700">{editingId ? 'Save Changes' : 'Create Project'}</button>
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
            <p className="text-sm text-slate-600 mb-6 font-medium">Are you sure you want to permanently delete this project? This action cannot be undone.</p>
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
