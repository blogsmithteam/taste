import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification } from '../../types/notifications';

interface NotificationListProps {
  onClose: () => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'NOTE_SHARED':
      case 'NOTE_COMMENT':
        if (notification.data?.noteId) {
          navigate(`/app/notes/${notification.data.noteId}`);
        }
        break;
      case 'NEW_FOLLOWER':
        if (notification.data?.followerId) {
          navigate(`/app/users/${notification.data.followerId}`);
        }
        break;
      default:
        break;
    }

    onClose();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-medium">Notifications</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => markAllAsRead()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Mark all as read
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {format(notification.createdAt.toDate(), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 