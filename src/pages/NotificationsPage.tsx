import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Tab } from '@headlessui/react';
import { CheckIcon, TrashIcon, BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification, NotificationType } from '../types/notifications';

type NotificationFilter = NotificationType | 'all';

const NOTIFICATION_TYPES: { label: string; value: NotificationFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'New Followers', value: 'follow' },
  { label: 'Shared Notes', value: 'note_shared' },
  { label: 'Comments', value: 'note_commented' },
  { label: 'Likes', value: 'note_liked' }
];

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [selectedType, setSelectedType] = useState<NotificationFilter>('all');
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
      case 'note_shared':
      case 'note_commented':
      case 'note_liked':
        if (notification.targetId) {
          navigate(`/app/notes/${notification.targetId}`, { state: { from: '/app/notifications' } });
        }
        break;
      case 'follow':
        if (notification.senderId) {
          navigate(`/app/users/${notification.senderId}`);
        }
        break;
      default:
        break;
    }
  };

  const getNotificationMessage = (notification: Notification): string => {
    switch (notification.type) {
      case 'follow':
        return 'started following you';
      case 'note_shared':
        return `shared a note with you${notification.title ? `: ${notification.title}` : ''}`;
      case 'note_commented':
        return `commented on your note${notification.title ? `: ${notification.title}` : ''}`;
      case 'note_liked':
        return `liked your note${notification.title ? `: ${notification.title}` : ''}`;
      default:
        return '';
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
                    <div className="flex items-center">
                      {notification.senderProfilePicture ? (
                        <img
                          src={notification.senderProfilePicture}
                          alt={notification.senderUsername}
                          className="h-8 w-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <BellIcon className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{notification.senderUsername}</span>{' '}
                          {getNotificationMessage(notification)}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {format(notification.timestamp.toDate(), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
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