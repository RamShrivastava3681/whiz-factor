import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { createApiUrl, createWebSocketUrl } from '@/config/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await fetch(createApiUrl('/notifications'));
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data);
          setUnreadCount(data.data.filter((n: Notification) => !n.read).length);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to mock data for demo
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Transaction Pending',
          message: 'Transaction TXN-2026-001 requires approval',
          type: 'info',
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: '/transactions'
        },
        {
          id: '2',
          title: 'Payment Overdue',
          message: 'Invoice INV-2026-005 is 3 days overdue',
          type: 'warning',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: '3',
          title: 'System Maintenance',
          message: 'Scheduled maintenance window tonight 11 PM - 1 AM',
          type: 'info',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          read: true
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(createApiUrl(`/notifications/${notificationId}/read`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      // Fallback for demo
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(createApiUrl('/notifications/mark-all-read'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      // Fallback for demo
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  // Add new notification (for real-time updates)
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default'
    });
  };

  // Clear notification
  const clearNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up WebSocket for real-time notifications
    // Create WebSocket URL based on environment configuration
    const wsUrl = createWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to notification WebSocket');
    };
    
    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('Received real-time notification:', notification);
        
        // Add the notification to the list
        const newNotification: Notification = {
          id: notification.id || Date.now().toString(),
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          timestamp: notification.timestamp || new Date().toISOString(),
          read: false,
          actionUrl: notification.actionUrl
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default'
        });
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('Disconnected from notification WebSocket');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    clearNotification,
    refreshNotifications: fetchNotifications
  };
}