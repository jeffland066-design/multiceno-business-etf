import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Save, Shield, User as UserIcon, Share2, AlertTriangle, Trash2, X } from 'lucide-react';
import { shareDriveFile } from '../lib/drive';

export default function Settings() {
  const { currentUser, setCurrentUser, resetAllData } = useAppContext();
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email || '',
    password: '',
    confirmPassword: ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);

  // Reset Data Modal State
  const [isResetModelOpen, setIsResetModelOpen] = useState(false);
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (resetConfirmPass !== 'password123') {
      setResetError('Incorrect security key. Access Denied.');
      return;
    }
    
    setIsResetting(true);
    try {
      await resetAllData();
      alert('Operational Database has been factory reset successfully!');
      setIsResetModelOpen(false);
      setResetConfirmPass('');
    } catch (err) {
      setResetError('Failed to erase spreadsheet data.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setCurrentUser(prev => ({ ...prev, name: formData.name, email: formData.email }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const sid = localStorage.getItem('multiceno_sheet_id');
    if (!sid) {
      alert("Data system not fully initialized yet.");
      return;
    }
    try {
      setSharing(true);
      await shareDriveFile(sid, shareEmail, 'writer');
      alert(`Successfully granted access to ${shareEmail} for the operational Google Sheet database.`);
      setShareEmail('');
    } catch(err) {
      alert("Failed to share access. Please check network and permissions.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Profile</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your CEO account credentials and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-medium text-sm border border-indigo-100 flex items-center space-x-2">
            <UserIcon size={16} /> <span>Account Profile</span>
          </button>
          <button className="w-full text-left px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium text-sm flex items-center space-x-2 transition-colors">
            <Shield size={16} /> <span>Security</span>
          </button>
        </div>

        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Personal Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 block">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 block">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 pt-6">Security (Update Password)</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 block">New Password</label>
                  <input 
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 block">Confirm Password</label>
                  <input 
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <button type="submit" className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 font-medium transition-colors">
                  <Save size={16} />
                  <span>{isSaved ? "Saved Successfully" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Data Delegation</h2>
            <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-100">Grant team members direct access to the operational Google Sheet database.</p>
            
            <form onSubmit={handleShare} className="flex space-x-4">
              <input 
                type="email"
                placeholder="Enter colleague's email..."
                required
                value={shareEmail}
                onChange={e => setShareEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm"
              />
              <button 
                type="submit" 
                disabled={sharing || !shareEmail}
                className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
              >
                <Share2 size={16} />
                <span>{sharing ? 'Granting...' : 'Grant Access'}</span>
              </button>
            </form>
          </div>

          <div className="bg-red-50 rounded-2xl border border-red-200 shadow-sm p-8 mt-8">
            <h2 className="text-lg font-bold text-red-900 mb-2 flex items-center space-x-2">
              <span className="p-1 rounded bg-red-100 text-red-600 block">
                <Trash2 size={20} />
              </span>
              <span>Danger Zone</span>
            </h2>
            <p className="text-sm text-red-700 bg-transparent mb-6 pb-4 border-b border-red-100">
              Permanently erase all data on the platform, including finances, employee records, inventory assets, schedules, invoices, and projects. This resets the corporate workspace to a completely fresh state.
            </p>
            
            <button 
              type="button"
              onClick={() => setIsResetModelOpen(true)}
              className="flex items-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-sm transition-colors"
            >
              <Trash2 size={16} />
              <span>Full Factory Reset</span>
            </button>
          </div>

          {isResetModelOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-red-600 font-bold">
                    <AlertTriangle size={20} />
                    <span>Authorize Factory Reset</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setIsResetModelOpen(false); setResetConfirmPass(''); setResetError(''); }} 
                    className="text-slate-400 hover:text-slate-600 bg-transparent border-0 font-bold"
                  >
                    <X size={20}/>
                  </button>
                </div>
                
                <form onSubmit={handleResetData} className="space-y-4">
                  <p className="text-sm text-slate-600">
                    This action will clear all databases and sync a blank state to Google Sheets. To authorize this action, please input your secure CEO security key:
                  </p>
                  <p className="text-xs font-mono bg-slate-100 p-2 rounded text-slate-500 text-center">
                    (Hint: password123)
                  </p>
                  
                  <input 
                    type="password" 
                    placeholder="Enter CEO password to confirm" 
                    required 
                    value={resetConfirmPass} 
                    onChange={e => setResetConfirmPass(e.target.value)} 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all text-sm text-slate-800" 
                  />

                  {resetError && (
                    <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                      {resetError}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 mt-6">
                    <button 
                      type="button" 
                      onClick={() => { setIsResetModelOpen(false); setResetConfirmPass(''); setResetError(''); }} 
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm border-0"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isResetting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm font-medium text-sm disabled:opacity-50 flex items-center space-x-2 border-0 cursor-pointer"
                    >
                      {isResetting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Erasing...</span>
                        </>
                      ) : (
                        <span>Confirm Reset</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
