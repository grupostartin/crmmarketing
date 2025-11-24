import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { X, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ToastContainer = () => {
  const { toasts, removeToast, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (id: string, type: string) => {
    markAsRead(id);
    removeToast(id);
    
    switch (type) {
      case 'lead_new':
        navigate('/contacts');
        break;
      case 'deal_update':
        navigate('/pipeline');
        break;
      case 'system':
        navigate('/agency');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          onClick={() => handleClick(toast.id, toast.type)}
          className="bg-cardDark border-4 border-black p-4 shadow-pixel w-80 pointer-events-auto animate-slide-in-right flex flex-col gap-2 cursor-pointer hover:bg-white/5 transition-colors group"
        >
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-primary font-display text-sm uppercase tracking-wider group-hover:text-retro-cyan transition-colors">
                 {toast.type === 'lead_new' ? (
                   <CheckCircle size={16} />
                 ) : (
                   <Bell size={16} />
                 )}
                 <span>{toast.title}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                 <X size={16} />
              </button>
           </div>
           <p className="font-body text-white text-lg leading-tight">
             {toast.message}
           </p>
           <div className="h-1 bg-gray-800 mt-2 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-primary animate-shrink-width w-full"></div>
           </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
