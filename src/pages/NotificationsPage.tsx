import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Tab } from '@headlessui/react';
import { CheckIcon, TrashIcon, BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification, NotificationType } from '../types/notifications';
import { TestNotificationButton } from '../components/notifications/TestNotificationButton';

const NOTIFICATION_TYPES: { label: string; value: NotificationType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'New Followers', value: 'NEW_FOLLOWER' },
  { label: 'Shared Notes', value: 'NOTE_SHARED' },
  { label: 'Comments', value: 'NOTE_COMMENT' },
  { label: 'Mentions', value: 'MENTION' },
  { label: 'Likes', value: 'LIKE' }
];

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    if (showUnreadOnly && notification.read) return false;
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    return true;
  });

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
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <BellSlashIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex items-center space-x-4">
          <TestNotificationButton />
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
              showUnreadOnly
                ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {showUnreadOnly ? (
              <BellSlashIcon className="h-5 w-5 mr-2" />
            ) : (
              <BellIcon className="h-5 w-5 mr-2" />
            )}
            {showUnreadOnly ? 'Show All' : 'Show Unread Only'}
          </button>
          <button
            onClick={() => markAllAsRead()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            Mark All as Read
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Tab.Group>
          <Tab.List className="flex space-x-1 border-b border-gray-200 px-4">
            {NOTIFICATION_TYPES.map((type) => (
              <Tab
                key={type.value}
                className={({ selected }) =>
                  `px-4 py-2 text-sm font-medium border-b-2 focus:outline-none ${
                    selected
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
                onClick={() => setSelectedType(type.value)}
              >
                {type.label}
              </Tab>
            ))}
          </Tab.List>
        </Tab.Group>

        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellSlashIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {showUnreadOnly ? 'No unread notifications to show.' : 'No notifications to show.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
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
                        className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 