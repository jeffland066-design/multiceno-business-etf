import React, { useState } from 'react';
import { Plus, ListTodo, MoreVertical, Calendar, CheckCircle2, Edit2, Trash2, X, MoveRight, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../store';
import { Task } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function Tasks() {
  const { tasks, setTasks, syncAction } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '', assignee: ''
  });

  const handleEdit = (task: Task) => {
    setFormData(task);
    setEditingId(task.id);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    setTasks(prev => prev.filter(t => t.id !== deleteConfirmId));
    setTimeout(() => syncAction(), 500);
    setDeleteConfirmId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingId) {
      setTasks(prev => prev.map(t => t.id === editingId ? { ...t, ...formData } as Task : t));
    } else {
      setTasks(prev => [...prev, { ...formData, id: 'task-' + Math.floor(Math.random() * 90000) } as Task]);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '', assignee: '' });
    setTimeout(() => syncAction(), 500);
  };

  const moveTask = (id: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    setTimeout(() => syncAction(), 500);
  };

  const Column = ({ title, status }: { title: string, status: Task['status'] }) => (
    <div className="flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200 p-4 min-h-[500px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {tasks.filter(t => t.status === status).length}
        </span>
      </div>
      <div className="space-y-3">
        {tasks.filter(t => t.status === status).map((task) => (
          <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full
                ${task.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                  task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'}`}>
                {task.priority}
              </span>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                {status === 'Todo' && <button onClick={() => moveTask(task.id, 'In Progress')} className="p-1 text-slate-400 hover:text-indigo-600" title="Move to In Progress"><MoveRight size={14}/></button>}
                {status === 'In Progress' && <button onClick={() => moveTask(task.id, 'Done')} className="p-1 text-slate-400 hover:text-emerald-600" title="Move to Done"><CheckCircle2 size={14}/></button>}
                <button onClick={() => handleEdit(task)} className="p-1 text-slate-400 hover:text-indigo-600 bg-transparent border-0 cursor-pointer"><Edit2 size={14}/></button>
                <button onClick={() => setDeleteConfirmId(task.id)} className="p-1 text-slate-400 hover:text-rose-600 bg-transparent border-0 cursor-pointer"><Trash2 size={14}/></button>
              </div>
            </div>
            <h4 className="font-medium text-slate-900 mb-1 leading-tight">{task.title}</h4>
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
              <div className="flex items-center text-xs text-slate-400">
                <Calendar size={12} className="mr-1" />
                {task.dueDate}
              </div>
              {task.assignee && (
                <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold" title={task.assignee}>
                  {task.assignee.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Board</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage tasks and track project progress.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200">
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column title="To Do" status="Todo" />
        <Column title="In Progress" status="In Progress" />
        <Column title="Done" status="Done" />
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '', assignee: '' }); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Task Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <textarea placeholder="Description" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl min-h-[80px]" />
              <div className="grid grid-cols-2 gap-4">
                <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                  <option value="Todo">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                <select required value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <input type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <input type="text" placeholder="Assignee Email" value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700">{editingId ? 'Save Changes' : 'Create Task'}</button>
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
            <p className="text-sm text-slate-600 mb-6 font-medium">Are you sure you want to permanently delete this task? This action cannot be undone.</p>
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
