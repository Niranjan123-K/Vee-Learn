import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Calendar, XCircle, Star } from 'lucide-react';
import { useToastStore } from '../hooks/useSessionNotifications';
import './ToastNotification.css';

const iconMap = {
  new: Calendar,
  confirmed: CheckCircle,
  completed: Star,
  cancelled: XCircle,
};

const colorMap = {
  new: 'var(--accent)',
  confirmed: 'var(--success, #22c55e)',
  completed: 'var(--accent-secondary, #f59e0b)',
  cancelled: 'var(--danger, #ef4444)',
};

export default function ToastNotification() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.action] || Calendar;
          const color = colorMap[toast.action] || 'var(--accent)';

          return (
            <motion.div
              key={toast.id}
              className="toast-item"
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="toast-icon" style={{ color }}>
                <Icon size={20} />
              </div>
              <div className="toast-content">
                <h4 className="toast-title">{toast.title}</h4>
                <p className="toast-message">{toast.message}</p>
              </div>
              <button
                className="toast-close"
                onClick={() => removeToast(toast.id)}
              >
                <X size={14} />
              </button>
              
              {/* Premium Progress Shrink Bar */}
              <div className="toast-progress" style={{ color }} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
