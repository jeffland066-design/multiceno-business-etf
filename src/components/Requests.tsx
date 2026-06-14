import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Plus, Send, Download, FileText, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import { ApprovalRequest } from '../types';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../lib/gmail';

export default function Requests() {
  const { requests, setRequests, syncAction, addToast, logAction } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ApprovalRequest>>({
    title: '', description: '', recipientEmail: '', priority: 'Medium'
  });

  const exportToPDF = (req: ApprovalRequest) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MULTICENO Executive Request", 20, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Request ID: ${req.id}`, 20, 35);
    doc.text(`Date Issued: ${req.date}`, 20, 42);
    
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);

    doc.setFont("helvetica", "bold");
    doc.text(`Title: ${req.title}`, 20, 60);
    doc.text(`Recipient: ${req.recipientEmail}`, 20, 67);
    doc.text(`Priority: ${req.priority}`, 20, 74);
    
    doc.setFont("helvetica", "normal");
    doc.text("Description / Scope of Work:", 20, 88);
    
    const splitDesc = doc.splitTextToSize(req.description, 170);
    doc.text(splitDesc, 20, 95);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Electronically generated and timestamped via MULTICENO System.", 20, 280);

    doc.save(`Request_${req.id}.pdf`);
  };

  const handleApprove = (id: string, newStatus: 'Approved' | 'Rejected') => {
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
      addToast(`Workflow Update: Request ${newStatus}`, newStatus === 'Approved' ? 'success' : 'info');
      logAction('Decision Authenticated', 'Approvals', `Executive request specified as ${id} has been ${newStatus.toUpperCase()}.`);
      setTimeout(() => syncAction(), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: ApprovalRequest = {
      ...formData,
      id: `REQ-${uuidv4().substring(0, 8).toUpperCase()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    } as ApprovalRequest;

    setRequests(prev => [newReq, ...prev]);
    setIsModalOpen(false);
    logAction('Request Commissioned', 'Approvals', `Issued request ${newReq.id} for "${newReq.title}" requiring ${newReq.recipientEmail} approval.`);
    
    setTimeout(() => syncAction(), 500);

    try {
      const approvalLink = `${window.location.origin}/?approve=${newReq.id}`;
      const emailBody = `
        <h2>New Approval Request: ${newReq.title}</h2>
        <p><strong>Priority:</strong> ${newReq.priority}</p>
        <p><strong>Description:</strong> ${newReq.description}</p>
        <br/>
        <a href="${approvalLink}" style="padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Approve Request Logging in</a>
        <br/><br/>
        <p>Alternatively, log into the MULTICENO platform to approve or reject this request.</p>
      `;

      await sendEmail(newReq.recipientEmail!, `Approval Required: ${newReq.title}`, emailBody);
      alert(`System Notification: Sophisticated request ${newReq.id} has been transmitted via email to ${newReq.recipientEmail}`);
    } catch(err) {
      alert("Failed to send the email notification. The request was saved but no email was sent.");
    }

    setFormData({ title: '', description: '', recipientEmail: '', priority: 'Medium' });
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    setRequests(prev => prev.filter(r => r.id !== deleteConfirmId));
    setTimeout(() => syncAction(), 500);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Requests & Approvals</h1>
          <p className="text-slate-500 mt-1 text-sm">Issue mandates, sophisticated requests, and track sign-offs.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm">
          <Plus size={16} />
          <span>Issue New Request</span>
        </button>
      </div>

      <div className="space-y-4">
        {requests.map((req, index) => (
          <div key={`${req.id}-${index}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                  req.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' :
                  req.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {req.priority} Priority
                </span>
                <span className="text-xs font-mono text-slate-400">ID: {req.id}</span>
                <span className="text-xs font-medium text-slate-400">{req.date}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{req.title}</h3>
              <p className="text-sm text-slate-600 mb-3">{req.description}</p>
              <div className="flex items-center space-x-2">
                <Send size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Sent to: {req.recipientEmail}</span>
              </div>
            </div>
            <div className="flex flex-col space-y-2 min-w-[140px] items-end">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                req.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                req.status === 'Pending' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                Status: {req.status}
              </span>
              <button onClick={() => exportToPDF(req)} className="flex items-center space-x-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mt-2">
                <FileText size={16} />
                <span>Download PDF</span>
              </button>
              <button onClick={() => setDeleteConfirmId(req.id)} className="flex items-center space-x-2 text-sm font-medium text-rose-600 hover:text-rose-800 transition-colors mt-2 bg-transparent border-0 cursor-pointer">
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
              {req.status === 'Pending' && (
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => handleApprove(req.id, 'Approved')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200" title="Approve">
                    <CheckCircle size={18} />
                  </button>
                  <button onClick={() => handleApprove(req.id, 'Rejected')} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200" title="Reject">
                    <XCircle size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="text-center py-12 text-slate-500">No active requests.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Issue Sophisticated Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Request Title</label>
                <input type="text" placeholder="e.g. Server Migration Approval" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Recipient Email</label>
                <input type="email" placeholder="manager@omni.co" required value={formData.recipientEmail} onChange={e => setFormData({...formData, recipientEmail: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Detailed Description</label>
                <textarea rows={4} placeholder="Define the scope, deliverables, and expectations..." required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Priority Level</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50">
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Mandate</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700 flex items-center">
                  <Send size={16} className="mr-2"/> Dispatch & Gen PDF
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
            <p className="text-sm text-slate-600 mb-6 font-medium">Are you sure you want to permanently delete this request? This action cannot be undone.</p>
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
