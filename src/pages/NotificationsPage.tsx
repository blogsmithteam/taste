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
  { label: 'Follow Requests', value: 'follow_request' },
  { label: 'Request Responses', value: 'follow_request_accepted' },
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
      case 'follow_request':
        navigate('/app/friends', { state: { showRequests: true } });
        break;
      default:
        break;
    }
  };

  const getNotificationMessage = (notification: Notification): string => {
    switch (notification.type) {
      case 'follow':
        return 'started following you';
      case 'follow_request':
        return 'requested to follow you';
      case 'follow_request_accepted':
        return 'accepted your follow request';
      case 'follow_request_rejected':
        return 'declined your follow request';
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
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-taste-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 rounded-lg shadow-sm border border-red-100 p-4">
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-5xl font-semibold text-taste-primary mb-2">
              Notifications
            </h1>
            <p className="text-xl text-black">
              Stay updated with your tasting community
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showUnreadOnly
                  ? 'bg-taste-primary text-white hover:bg-taste-primary/90'
                  : 'bg-taste-primary/10 text-taste-primary hover:bg-taste-primary hover:text-white'
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
              className="inline-flex items-center px-4 py-2 bg-taste-primary/10 text-taste-primary hover:bg-taste-primary hover:text-white transition-colors rounded-lg text-sm font-medium"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Mark All as Read
            </button>
          </div>
        </div>

        <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 overflow-hidden">
          <Tab.Group>
            <Tab.List className="flex space-x-1 border-b border-taste-primary/10 px-4">
              {NOTIFICATION_TYPES.map((type) => (
                <Tab
                  key={type.value}
                  className={({ selected }) =>
                    `px-4 py-2 text-sm font-medium border-b-2 focus:outline-none transition-colors ${
                      selected
                        ? 'border-taste-primary text-taste-primary'
                        : 'border-transparent text-taste-primary/70 hover:text-taste-primary hover:border-taste-primary/20'
                    }`
                  }
                  onClick={() => setSelectedType(type.value)}
                >
                  {type.label}
                </Tab>
              ))}
            </Tab.List>
          </Tab.Group>

          <div className="divide-y divide-taste-primary/10">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellSlashIcon className="mx-auto h-12 w-12 text-taste-primary/40" />
                <h3 className="mt-2 text-xl font-medium text-taste-primary">No notifications</h3>
                <p className="mt-1 text-taste-primary/70">
                  {showUnreadOnly ? 'No unread notifications to show.' : 'No notifications to show.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-taste-primary/5 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-taste-primary/10' : ''
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
                            className="h-8 w-8 rounded-full border border-taste-primary/10 mr-3"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-taste-primary/5 border border-taste-primary/10 flex items-center justify-center mr-3">
                            <BellIcon className="h-5 w-5 text-taste-primary/70" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-black">
                            <span className="font-medium">{notification.senderUsername}</span>{' '}
                            {getNotificationMessage(notification)}
                          </p>
                          <p className="mt-1 text-xs text-taste-primary/70">
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
                          className="p-1 text-taste-primary hover:text-taste-primary/90 rounded-full hover:bg-taste-primary/10 transition-colors"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 text-taste-primary/70 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
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
    </div>
  );
}; 