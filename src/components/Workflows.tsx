import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Plus, Edit2, Trash2, PlayCircle, PauseCircle, Activity } from 'lucide-react';
import { WorkflowAlert } from '../types';

export default function Workflows() {
  const { workflows, setWorkflows, syncAction, addToast } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<WorkflowAlert>>({});

  const handleSave = async () => {
    if (editingId) {
      setWorkflows(prev => prev.map(w => w.id === editingId ? { ...w, ...formData } as WorkflowAlert : w));
      addToast(`Updated workflow: ${formData.name}`, 'info');
    } else {
      const newWorkflow = {
        ...formData,
        id: `w-${Date.now()}`,
        status: formData.status || 'Active',
        lastRun: 'Never'
      } as WorkflowAlert;
      setWorkflows(prev => [...prev, newWorkflow]);
      addToast(`New workflow activated: ${newWorkflow.name}`, 'success');
    }
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
    await syncAction();
  };

  const handleDelete = async (id: string) => {
    const wName = workflows.find(w => w.id === id)?.name;
    setWorkflows(prev => prev.filter(w => w.id !== id));
    if (wName) addToast(`Workflow deleted: ${wName}`, 'error');
    await syncAction();
  };

  const toggleStatus = async (id: string) => {
    const w = workflows.find(wf => wf.id === id);
    if (!w) return;
    const newStatus = w.status === 'Active' ? 'Paused' : 'Active';
    setWorkflows(prev => prev.map(wf => wf.id === id ? { ...wf, status: newStatus } : wf));
    addToast(`Workflow ${w.name} ${newStatus}`, newStatus === 'Active' ? 'success' : 'info');
    await syncAction();
  };

  const triggers = ['Invoice Overdue', 'Inventory < 5', 'New Client Added', 'Project Delayed', 'New Request Pending'];
  const actions = ['Send Email', 'Create Task', 'Notify Slack', 'SMS Alert'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
            <Activity className="text-indigo-600" />
            <span>Automatic Workflows & Alerts</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">Automate business processes, set up alerts, and keep your team informed.</p>
        </div>
        <button 
          onClick={() => { setFormData({ trigger: triggers[0], action: actions[0], status: 'Active' }); setIsAdding(true); }}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          <span>New Workflow</span>
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">{editingId ? 'Edit Workflow' : 'New Workflow Rule'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-1 md:col-span-2">
               <label className="text-xs font-semibold text-slate-500 uppercase">Rule Name</label>
               <input type="text" placeholder="e.g. Notify sales on new client" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            
            <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500 uppercase text-indigo-600">WHEN (Trigger)</label>
               <select value={formData.trigger || triggers[0]} onChange={e => setFormData({...formData, trigger: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all outline-none">
                 {triggers.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
            </div>
            
            <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500 uppercase text-purple-600">THEN (Action)</label>
               <select value={formData.action || actions[0]} onChange={e => setFormData({...formData, action: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-100 transition-all outline-none">
                 {actions.map(a => <option key={a} value={a}>{a}</option>)}
               </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button onClick={handleSave} disabled={!formData.name} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Save Rule</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map(workflow => (
          <div key={workflow.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col relative group">
            <div className={`absolute top-0 right-0 w-full h-1 rounded-t-2xl ${workflow.status === 'Active' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
            
            <div className="flex justify-between items-start mb-4">
               <h3 className="font-semibold text-slate-800 pr-8">{workflow.name}</h3>
               <button onClick={() => toggleStatus(workflow.id)} className={`p-1.5 rounded-full ${workflow.status === 'Active' ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'}`} title={workflow.status === 'Active' ? 'Pause' : 'Activate'}>
                 {workflow.status === 'Active' ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
               </button>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">When</div>
                <div className="text-sm font-medium text-slate-700">{workflow.trigger}</div>
              </div>
              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white border-2 border-indigo-100 rounded-full p-1 text-indigo-400">
                  <Activity size={12} />
                </div>
              </div>
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-50">
                <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Then</div>
                <div className="text-sm font-medium text-indigo-700">{workflow.action}</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
               <div className="text-xs text-slate-500">
                 Last Run: <span className="font-medium">{workflow.lastRun}</span>
               </div>
               <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => { setFormData(workflow); setEditingId(workflow.id); setIsAdding(false); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                   <Edit2 size={14} />
                 </button>
                 <button onClick={() => handleDelete(workflow.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                   <Trash2 size={14} />
                 </button>
               </div>
            </div>
          </div>
        ))}

        {workflows.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
             <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl mb-3">
               <Activity size={24} />
             </div>
             <h3 className="text-lg font-medium text-slate-800 mb-1">No Active Workflows</h3>
             <p className="text-sm text-slate-500 max-w-md mx-auto">Create rules to automate repetitive tasks and set up alerts for key events in your business.</p>
          </div>
        )}
      </div>
    </div>
  );
}
