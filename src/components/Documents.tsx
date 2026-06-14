import React, { useRef, useState } from 'react';
import { FileText, Plus, Download, Folder, File, MoreVertical, ExternalLink, Share2, X } from 'lucide-react';
import { useAppContext } from '../store';
import { uploadFileToDrive, shareDriveFile } from '../lib/drive';
import { v4 as uuidv4 } from 'uuid';

export default function Documents() {
  const { documents, setDocuments, syncAction } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [shareDocId, setShareDocId] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFileToDrive(file);
      const newDoc = {
        id: result.id, // Store actual drive ID since we use it to share
        name: file.name,
        type: file.type || 'Document',
        size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
        date: new Date().toISOString().split('T')[0],
        driveLink: result.webViewLink
      };
      setDocuments(prev => [newDoc, ...prev]);
      setTimeout(() => syncAction(), 500);
    } catch (err) {
      alert("Failed to upload document to Google Drive. Check permissions.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDocId || !shareEmail) return;
    setIsSharing(true);
    try {
      await shareDriveFile(shareDocId, shareEmail, 'reader');
      alert(`Successfully shared document with ${shareEmail}`);
      setShareDocId(null);
      setShareEmail('');
    } catch(err) {
      alert('Failed to share document. Check permissions and email address.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Corporate Document Vault</h1>
          <p className="text-slate-500 mt-1 text-sm">Secure storage backed automatically by Google Drive.</p>
        </div>
        <div>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          <button onClick={handleUploadClick} disabled={isUploading} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-70">
            {isUploading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
            <span>{isUploading ? 'Uploading...' : 'Upload to Drive'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-indigo-600 mb-4"><Folder size={32} /></div>
          <h3 className="font-semibold text-slate-900">Legal Contracts</h3>
          <p className="text-xs text-slate-500 mt-1">12 Files</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-emerald-600 mb-4"><Folder size={32} /></div>
          <h3 className="font-semibold text-slate-900">Financial Reports</h3>
          <p className="text-xs text-slate-500 mt-1">45 Files</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-blue-600 mb-4"><Folder size={32} /></div>
          <h3 className="font-semibold text-slate-900">Board Decks</h3>
          <p className="text-xs text-slate-500 mt-1">8 Files</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent Files</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Modified</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 text-slate-400 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <span className="font-medium text-slate-900">{doc.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{doc.type}</td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">{doc.size}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{doc.date}</td>
                <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                  {doc.driveLink && (
                    <>
                      <button onClick={() => setShareDocId(doc.id)} className="text-slate-400 hover:text-indigo-600 p-1 transition-colors" title="Share Document">
                        <Share2 size={16} />
                      </button>
                      <a href={doc.driveLink} target="_blank" rel="noreferrer" title="Open in Google Drive" className="text-slate-400 hover:text-emerald-600 p-1 transition-colors">
                        <ExternalLink size={16} />
                      </a>
                    </>
                  )}
                  <button className="text-slate-400 hover:text-slate-600 p-1 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shareDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Share Document</h2>
              <button onClick={() => { setShareDocId(null); setShareEmail(''); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <p className="text-sm text-slate-500 mb-6">Enter an email address to securely grant view access to this file via Google Drive.</p>
            <form onSubmit={handleShareSubmit} className="space-y-4">
              <input type="email" placeholder="Email Address..." required value={shareEmail} onChange={e => setShareEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setShareDocId(null); setShareEmail(''); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={isSharing} className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2">
                  {isSharing && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  <span>{isSharing ? 'Sharing...' : 'Share Access'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
