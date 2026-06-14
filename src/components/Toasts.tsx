import React from 'react';
import { useAppContext } from '../store';
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Toasts() {
  const { toasts, removeToast } = useAppContext();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`pointer-events-auto flex items-center p-4 pr-12 rounded-xl shadow-lg border relative min-w-[300px] overflow-hidden ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}
          >
            <div className="mr-3 flex-shrink-0">
              {toast.type === 'success' && <CheckCircle className="text-emerald-500" size={20} />}
              {toast.type === 'error' && <AlertTriangle className="text-rose-500" size={20} />}
              {toast.type === 'info' && <Info className="text-blue-500" size={20} />}
            </div>
            <div className="text-sm font-medium pr-2">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-50 hover:opacity-100 hover:bg-black/5 transition-all text-current"
            >
              <X size={16} />
            </button>
            <div className={`absolute bottom-0 left-0 h-1 bg-current opacity-20 w-full animate-[shrink_4s_linear_forwards]`} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
