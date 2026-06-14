import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { Plus, Calendar, Clock, MapPin, Edit2, Trash2, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { ScheduleEvent } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createCalendarEvent, deleteCalendarEvent, listCalendarEvents } from '../lib/calendar';

export default function Schedules() {
  const { schedules, setSchedules, syncAction } = useAppContext();
  const [activeTab, setActiveTab] = useState<'local' | 'google'>('local');
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ScheduleEvent>>({
    title: '', date: '', time: '', type: 'Meeting', attendees: []
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; calId?: string } | null>(null);

  const loadGoogleEvents = async () => {
    setIsLoadingGoogle(true);
    setGoogleError('');
    try {
      const items = await listCalendarEvents();
      setGoogleEvents(items);
    } catch (e: any) {
      setGoogleError('Could not sync with Google Calendar. Please ensure you are logged in and have approved Calendar access.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  useEffect(() => {
    loadGoogleEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let calId = undefined;
      // Delete old if editing
      if (editingId) {
        const oldEvt = schedules.find(s => s.id === editingId);
        if (oldEvt?.calendarEventId) {
          try { await deleteCalendarEvent(oldEvt.calendarEventId); } catch(ex) {}
        }
      }
      
      // Create new event
      try {
        calId = await createCalendarEvent(
          formData.title || 'Untitled', 
          formData.date || new Date().toISOString().split('T')[0], 
          formData.time || '09:00', 
          formData.attendees || []
        );
      } catch (err) {
        alert("Event updated in agenda. However, Google Calendar sync failed. Check your permissions.");
      }

      if (editingId) {
        setSchedules(prev => prev.map(s => s.id === editingId ? { ...s, ...formData, calendarEventId: calId } as ScheduleEvent : s).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      } else {
        setSchedules(prev => [...prev, { ...formData, id: uuidv4(), calendarEventId: calId } as ScheduleEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ title: '', date: '', time: '', type: 'Meeting', attendees: [] });
      setTimeout(() => syncAction(), 500);
      loadGoogleEvents();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (event: ScheduleEvent) => {
    setFormData(event);
    setEditingId(event.id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, calId } = deleteConfirm;
    if (calId) {
      try {
        await deleteCalendarEvent(calId);
      } catch(e) {
        console.warn("Failed to delete event from Google Calendar.", e);
      }
    }
    setSchedules(prev => prev.filter(s => s.id !== id));
    setTimeout(() => syncAction(), 500);
    setDeleteConfirm(null);
    loadGoogleEvents();
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Schedule & Calendars</h1>
          <p className="text-slate-500 mt-1 text-sm">Synchronize corporate agendas with Google Calendar in real-time.</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'google' && (
            <button 
              onClick={loadGoogleEvents} 
              disabled={isLoadingGoogle}
              className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm disabled:opacity-50 transition-all"
              title="Refresh Google Calendar Feed"
            >
              <RefreshCw size={18} className={isLoadingGoogle ? 'animate-spin' : ''} />
            </button>
          )}
          <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm border-0 cursor-pointer">
            <Plus size={16} />
            <span>New Agenda Event</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('local')}
          className={`px-5 py-3 border-b-2 font-medium text-sm transition-colors border-0 bg-transparent cursor-pointer ${
            activeTab === 'local' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          CEO Corporate Agenda ({schedules.length})
        </button>
        <button
          onClick={() => { setActiveTab('google'); loadGoogleEvents(); }}
          className={`px-5 py-3 border-b-2 font-medium text-sm transition-colors border-0 bg-transparent cursor-pointer ${
            activeTab === 'google' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Google Calendar Feed
        </button>
      </div>

      {activeTab === 'local' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 divide-y divide-slate-100">
          {schedules.map(event => (
            <div key={event.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between first:pt-0 last:pb-0 gap-4">
              <div className="flex-1 flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-600 flex-shrink-0">
                  <span className="text-xs font-semibold">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-lg font-bold leading-none mt-0.5">{new Date(event.date).toLocaleDateString('en-US', { day: '2-digit' })}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{event.title}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center text-xs text-slate-500">
                      <Clock size={12} className="mr-1" /> {event.time}
                    </div>
                    <div className="flex items-center text-xs text-slate-500">
                      <MapPin size={12} className="mr-1" /> Main Boardroom / Remote Meeting
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold uppercase tracking-wider">
                    {event.type}
                  </span>
                  <button onClick={() => handleEdit(event)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors bg-transparent border-0">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteConfirm({ id: event.id, calId: event.calendarEventId })} className="p-1 text-slate-400 hover:text-rose-600 transition-colors bg-transparent border-0">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="text-xs text-slate-500 font-medium">Attendees: {event.attendees.join(', ')}</div>
              </div>
            </div>
          ))}
          {schedules.length === 0 && <div className="text-center py-10 text-slate-500">No upcoming agenda events. Use the button to schedule one!</div>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Google Calendar Events</span>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">Active Sync Mode</span>
          </div>

          {isLoadingGoogle ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Fetching active calendar feeds...</p>
            </div>
          ) : googleError ? (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-rose-700 text-sm">
              {googleError}
            </div>
          ) : googleEvents.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No calendar events found on Google Calendar. Create an agenda event to populate it.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {googleEvents.map(event => {
                const dateStr = event.start?.dateTime || event.start?.date || '';
                const dateObj = dateStr ? new Date(dateStr) : null;
                return (
                  <div key={event.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between first:pt-0 last:pb-0 gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-600 flex-shrink-0 font-mono">
                        <span className="text-xs font-bold">{dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short' }) : 'N/A'}</span>
                        <span className="text-md font-bold leading-none mt-0.5">{dateObj ? dateObj.getDate() : '--'}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{event.summary || 'Untitled Event'}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {dateObj ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'All Day'} • Primary Google Calendar
                        </p>
                      </div>
                    </div>
                    {event.htmlLink && (
                      <a 
                        href={event.htmlLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-slate-200"
                      >
                        View in GCal
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 animate-fade-in">
            <div className="flex items-center space-x-2 text-rose-600 font-bold mb-3">
              <AlertTriangle size={20} />
              <span>Are you sure?</span>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              This action will permanently delete this event from the local corporate agenda and Google Calendar.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setDeleteConfirm(null)} 
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Event' : 'Add Schedule Event'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 font-bold"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <input type="text" placeholder="Event Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              </div>
              <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                <option value="Meeting">Strategic Meeting</option>
                <option value="Review">Performance Review</option>
                <option value="Operation">Operational Milestone</option>
              </select>
              <input type="text" placeholder="Attendees (comma separated)" value={(formData.attendees || []).join(', ')} onChange={e => setFormData({...formData, attendees: e.target.value.split(',').map(s => s.trim())})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium border-0 bg-transparent cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700 disabled:opacity-50 border-0 cursor-pointer">{isSaving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Event')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
