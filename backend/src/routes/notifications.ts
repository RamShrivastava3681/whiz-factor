import express from 'express';
import { ApiResponse } from '../models/index';

const router = express.Router();

// Mock notifications data
let notifications = [
  {
    id: 'notif-1',
    title: 'System Update',
    message: 'System maintenance completed successfully',
    type: 'info',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    userId: 'current-user'
  },
  {
    id: 'notif-2',
    title: 'Transaction Alert',
    message: 'High-value transaction requires approval',
    type: 'warning',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    userId: 'current-user'
  },
  {
    id: 'notif-3',
    title: 'Risk Assessment',
    message: 'Monthly risk assessment report is ready',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    userId: 'current-user'
  }
];

// Get all notifications
router.get('/', (req, res) => {
  try {
    const response: ApiResponse = {
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Mark notification as read
router.patch('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        timestamp: new Date()
      });
    }

    notification.isRead = true;

    const response: ApiResponse = {
      success: true,
      message: 'Notification marked as read',
      data: notification,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', (req, res) => {
  try {
    notifications = notifications.map(n => ({ ...n, isRead: true }));

    const response: ApiResponse = {
      success: true,
      message: 'All notifications marked as read',
      data: notifications,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Create new notification (for internal use)
router.post('/', (req, res) => {
  try {
    const { title, message, type = 'info', userId = 'current-user' } = req.body;
    
    const notification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
      userId
    };

    notifications.push(notification);

    const response: ApiResponse = {
      success: true,
      message: 'Notification created successfully',
      data: notification,
      timestamp: new Date()
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

export default router;