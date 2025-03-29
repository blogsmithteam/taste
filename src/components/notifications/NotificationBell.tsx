import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationList } from './NotificationList';

export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/app/notifications');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
      >
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-80 origin-top-right">
            <div className="bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
              <NotificationList onClose={() => setIsOpen(false)} />
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={handleViewAll}
                  className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 