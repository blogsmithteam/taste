import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsService } from '../../services/notifications';
import { Notification } from '../../types/notifications';
import { format } from 'date-fns';
import { UserIcon } from '@heroicons/react/24/outline';

export const NotificationList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const fetchedNotifications = await notificationsService.getAllNotifications(user.uid);
        setNotifications(fetchedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark the notification as read
      await notificationsService.markAsRead(notification.id);
      
      // Update the local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );

      // Navigate based on notification type
      switch (notification.type) {
        case 'follow':
          navigate(`/app/users/${notification.senderId}`);
          break;
        case 'note_shared':
        case 'note_liked':
        case 'note_commented':
          if (notification.targetId) {
            navigate(`/app/notes/${notification.targetId}`, { state: { from: '/app/notifications' } });
          }
          break;
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await notificationsService.markAllAsRead(user.uid);
      setNotifications(prevNotifications =>
        prevNotifications.map(n => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'follow':
        return (
          <span>
            started following you
          </span>
        );
      case 'follow_request':
        return (
          <span>
            requested to follow you
          </span>
        );
      case 'follow_request_accepted':
        return (
          <span>
            accepted your follow request
          </span>
        );
      case 'follow_request_rejected':
        return (
          <span>
            declined your follow request
          </span>
        );
      case 'note_shared':
        return (
          <span>
            shared a note with you:{' '}
            <span className="font-medium text-gray-900">{notification.title}</span>
          </span>
        );
      case 'note_liked':
        return (
          <span>
            liked your note:{' '}
            <span className="font-medium text-gray-900">{notification.title}</span>
          </span>
        );
      case 'note_commented':
        return (
          <span>
            commented on your note:{' '}
            <span className="font-medium text-gray-900">{notification.title}</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">
          No notifications yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleMarkAllAsRead}
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          Mark all as read
        </button>
      </div>
      <ul role="list" className="-mb-8">
        {notifications.map((notification, notificationIdx) => (
          <li key={notification.id}>
            <div className="relative pb-8">
              {notificationIdx !== notifications.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  {notification.senderProfilePicture ? (
                    <img
                      className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white"
                      src={notification.senderProfilePicture}
                      alt={notification.senderUsername}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ring-8 ring-white">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className={`flex min-w-0 flex-1 justify-between space-x-4 pt-1.5 ${!notification.read ? 'font-semibold' : ''}`}>
                  <div>
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="text-sm text-gray-500 hover:text-indigo-600"
                    >
                      <span className="font-medium text-gray-900">
                        {notification.senderUsername}
                      </span>{' '}
                      {renderNotificationContent(notification)}
                    </button>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    {format(notification.timestamp.toDate(), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}; 