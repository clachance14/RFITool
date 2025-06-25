'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { NotificationService } from '@/services/notificationService';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  rfi_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: {
    performed_by?: string;
    performed_by_name?: string;
    performed_by_email?: string;
    performed_by_type?: 'user' | 'client' | 'system';
    action_details?: string;
    response_status?: string;
    from_status?: string;
    to_status?: string;
    reason?: string;
    [key: string]: any;
  };
  rfis?: {
    rfi_number: string;
    subject: string;
    projects: {
      project_name: string;
    };
    users?: {
      full_name: string;
      email: string;
    };
  };
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  // Periodically check for new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getRecentNotifications(20);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await NotificationService.getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const markAsRead = async (rfiId: string) => {
    try {
      await NotificationService.markNotificationsAsRead(rfiId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const clearNotification = async (notificationId: string) => {
    try {
      await NotificationService.clearNotification(notificationId);
      await loadNotifications();
      await loadUnreadCount();
      toast({
        title: 'Success',
        description: 'Notification cleared',
      });
    } catch (error) {
      console.error('Failed to clear notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear notification',
        variant: 'destructive',
      });
    }
  };

  const clearAllNotifications = async () => {
    try {
      await NotificationService.clearAllNotifications();
      await loadNotifications();
      await loadUnreadCount();
      toast({
        title: 'Success',
        description: 'All notifications cleared',
      });
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear all notifications',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (!notification.is_read) {
        await markAsRead(notification.rfi_id);
      }

      // Close the notification dropdown
      setIsOpen(false);

      // Navigate to RFI detail page
      router.push(`/rfis/${notification.rfi_id}`);
    } catch (error) {
      console.error('Failed to navigate to RFI:', error);
      toast({
        title: 'Error',
        description: 'Failed to open RFI',
        variant: 'destructive',
      });
    }
  };

  const getActionIcon = (type: string, performedByType?: string) => {
    if (performedByType === 'client') {
      return <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-xs font-semibold text-blue-600">C</span>
      </div>;
    }
    
    switch (type) {
      case 'response_received':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'status_changed':
        return <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-semibold text-purple-600">S</span>
        </div>;
      case 'link_generated':
        return <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-semibold text-indigo-600">L</span>
        </div>;
      case 'overdue_reminder':
        return <Clock className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadNotifications();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
        aria-label="View notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          onMouseLeave={handleMouseLeave}
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(notification.type, notification.metadata?.performed_by_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Enhanced header with user information */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.rfis?.rfi_number && (
                            <span className="text-blue-600 hover:text-blue-800">
                              {notification.rfis.rfi_number}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <p className="text-xs text-gray-400">
                            {getTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Who did what - enhanced display */}
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">
                          {notification.message}
                        </p>
                        
                        {/* Enhanced user details */}
                        {notification.metadata && (
                          <div className="mt-2 space-y-1">
                            {notification.metadata.performed_by_name && (
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  notification.metadata.performed_by_type === 'client' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : notification.metadata.performed_by_type === 'system'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-green-100 text-green-800'
                                }`}>
                                  {notification.metadata.performed_by_type === 'client' ? '👤 ' : 
                                   notification.metadata.performed_by_type === 'system' ? '🤖 ' : '👨‍💼 '}
                                  {notification.metadata.performed_by_name}
                                </span>
                                {notification.metadata.performed_by_email && (
                                  <span className="text-xs text-gray-500">
                                    {notification.metadata.performed_by_email}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {notification.metadata.action_details && (
                              <p className="text-xs text-gray-500">
                                📋 {notification.metadata.action_details}
                              </p>
                            )}

                            {/* Status change details */}
                            {notification.type === 'status_changed' && notification.metadata.from_status && notification.metadata.to_status && (
                              <div className="text-xs text-gray-500">
                                🔄 {notification.metadata.from_status} → {notification.metadata.to_status}
                                {notification.metadata.reason && (
                                  <span className="ml-1">({notification.metadata.reason})</span>
                                )}
                              </div>
                            )}

                            {/* Response status for client responses */}
                            {notification.metadata.response_status && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                notification.metadata.response_status === 'approved' 
                                  ? 'bg-green-100 text-green-800'
                                  : notification.metadata.response_status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {notification.metadata.response_status.replace('_', ' ').toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Fallback for legacy notifications without enhanced metadata */}
                        {(!notification.metadata?.performed_by_name) && (
                          <div className="mt-2 space-y-1">
                            {/* Try to extract user info from RFI data or show generic indicators */}
                            {notification.type === 'link_generated' && (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  👨‍💼 System User
                                </span>
                                <span className="text-xs text-gray-500">
                                  📋 Generated secure client access link
                                </span>
                              </div>
                            )}
                            
                            {notification.type === 'response_received' && notification.metadata?.responder_name && (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  👤 {notification.metadata.responder_name}
                                </span>
                                {notification.metadata.client_email && (
                                  <span className="text-xs text-gray-500">
                                    {notification.metadata.client_email}
                                  </span>
                                )}
                              </div>
                            )}

                            {notification.type === 'status_changed' && (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  👨‍💼 Project User
                                </span>
                                <span className="text-xs text-gray-500">
                                  📋 Changed RFI status
                                </span>
                              </div>
                            )}

                            {/* Generic fallback for unknown notification types */}
                            {!['link_generated', 'response_received', 'status_changed'].includes(notification.type) && (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  🤖 System
                                </span>
                                <span className="text-xs text-gray-500">
                                  📋 Automated notification
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {notification.rfis?.projects && (
                        <p className="text-xs text-gray-500 mt-1">
                          📁 Project: {notification.rfis.projects.project_name}
                        </p>
                      )}
                      <p className="text-xs text-blue-500 mt-1 font-medium">
                        Click to view RFI →
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.rfi_id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                          className="text-xs text-red-600 hover:text-red-800 flex items-center space-x-1"
                          title="Clear notification"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  // Navigate to notifications page
                  window.location.href = '/notifications';
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 