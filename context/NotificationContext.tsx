import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAgency } from './AgencyContext';

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'lead_new' | 'deal_update' | 'system';
  read: boolean;
  created_at: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  toasts: Notification[];
  removeToast: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { agency } = useAgency();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!agency?.id) return;

    // Fetch existing notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data as Notification[]);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `agency_id=eq.${agency.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Add to toasts to show popup
          setToasts(prev => [...prev, newNotification]);
          
          // Auto remove toast after 5 seconds
          setTimeout(() => {
             removeToast(newNotification.id);
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [agency?.id]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead,
      toasts,
      removeToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
