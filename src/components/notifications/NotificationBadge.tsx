import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsService } from '../../services/notifications';

export const NotificationBadge: React.FC = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;

      try {
        const unreadNotifications = await notificationsService.getUnreadNotifications(user.uid);
        setUnreadCount(unreadNotifications.length);
      } catch (error) {
        console.error('Error fetching unread notifications:', error);
      }
    };

    fetchUnreadCount();

    // Set up an interval to check for new notifications every minute
    const intervalId = setInterval(fetchUnreadCount, 60000);

    return () => clearInterval(intervalId);
  }, [user]);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}; 