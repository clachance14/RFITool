'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, Clock, AlertTriangle, Mail, Search, Filter, Trash2 } from 'lucide-react';
import { NotificationService } from '@/services/notificationService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Notification {
  id: string;
  rfi_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
  rfis?: {
    rfi_number: string;
    subject: string;
    projects: {
      project_name: string;
    };
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'response_received'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getRecentNotifications(100);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (rfiId: string) => {
    try {
      await NotificationService.markNotificationsAsRead(rfiId);
      await loadNotifications();
      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.is_read);
      for (const notification of unreadNotifications) {
        await NotificationService.markNotificationsAsRead(notification.rfi_id);
      }
      await loadNotifications();
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const clearNotification = async (notificationId: string) => {
    try {
      await NotificationService.clearNotification(notificationId);
      await loadNotifications();
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
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }

    try {
      await NotificationService.clearAllNotifications();
      await loadNotifications();
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

  const clearReadNotifications = async () => {
    if (!confirm('Are you sure you want to clear all read notifications? This action cannot be undone.')) {
      return;
    }

    try {
      await NotificationService.clearReadNotifications();
      await loadNotifications();
      toast({
        title: 'Success',
        description: 'All read notifications cleared',
      });
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear read notifications',
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'response_received':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overdue_reminder':
        return <Clock className="w-5 h-5 text-red-600" />;
      case 'status_changed':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'link_generated':
        return <Mail className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'response_received':
        return 'Response Received';
      case 'overdue_reminder':
        return 'Overdue Reminder';
      case 'status_changed':
        return 'Status Changed';
      case 'link_generated':
        return 'Link Generated';
      default:
        return 'Notification';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'unread' && !notification.is_read) ||
      (filter === 'response_received' && notification.type === 'response_received');

    const matchesSearch = 
      searchTerm === '' ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.rfis?.rfi_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.rfis?.subject?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              Stay updated on your RFI responses and project activities
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                Mark All as Read ({unreadCount})
              </Button>
            )}
            {notifications.length > 0 && (
              <>
                <Button onClick={clearReadNotifications} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Read
                </Button>
                <Button onClick={clearAllNotifications} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="response_received">Client Responses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Responses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {notifications.filter(n => n.type === 'response_received').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Unread</p>
                <p className="text-2xl font-semibold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : searchTerm 
                    ? "Try adjusting your search or filter criteria."
                    : "You'll receive notifications here when clients respond to RFIs."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {getNotificationTypeLabel(notification.type)}
                          </span>
                          {!notification.is_read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{getTimeAgo(notification.created_at)}</p>
                      </div>
                      
                      {notification.rfis && (
                        <div className="mt-1">
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer text-left"
                          >
                            RFI {notification.rfis.rfi_number}: {notification.rfis.subject}
                          </button>
                          <p className="text-xs text-gray-500 mt-1">
                            Project: {notification.rfis.projects.project_name}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600 mt-2">{notification.message}</p>
                      
                      {notification.rfis && (
                        <p className="text-xs text-blue-500 mt-1 font-medium">
                          Click RFI title above to view details →
                        </p>
                      )}
                      
                      {notification.metadata && notification.metadata.response_status && (
                        <div className="mt-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notification.metadata.response_status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : notification.metadata.response_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {notification.metadata.response_status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      )}

                      {!notification.is_read && (
                        <div className="mt-4">
                          <Button
                            onClick={() => markAsRead(notification.rfi_id)}
                            variant="outline"
                            size="sm"
                          >
                            Mark as Read
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <Button
                        onClick={() => clearNotification(notification.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Alert */}
        <Alert className="mt-6">
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Notifications are automatically created when clients respond to RFIs, when RFIs become overdue, 
            or when important status changes occur. You'll receive real-time updates to stay informed about your projects.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
} 