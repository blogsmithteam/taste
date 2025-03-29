import React from 'react';
import { createTestNotification } from '../../utils/testNotification';

export const TestNotificationButton: React.FC = () => {
  const handleClick = async () => {
    await createTestNotification();
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      Create Test Notification
    </button>
  );
}; 