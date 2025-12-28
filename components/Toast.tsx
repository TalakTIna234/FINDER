import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-500/20 border-green-500/40 text-green-300',
    error: 'bg-red-500/20 border-red-500/40 text-red-300',
    warning: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
    info: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-[20px] backdrop-blur-2xl border ${colors[type]} shadow-2xl max-w-sm w-[90%] flex items-center gap-3`}
    >
      <Icon size={20} className="flex-shrink-0" />
      <p className="flex-1 text-sm font-semibold leading-tight">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

// Hook per gestire i toast
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex justify-center">
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ delay: index * 0.1 }}
            className="pointer-events-auto"
          >
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return { showToast, removeToast, ToastContainer };
};

