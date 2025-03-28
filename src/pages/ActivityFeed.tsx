import React from 'react';
import { ActivityFeed as ActivityFeedComponent } from '../components/ActivityFeed';

const ActivityFeedPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Activity Feed
          </h2>
        </div>
      </div>

      <ActivityFeedComponent />
    </div>
  );
};

export default ActivityFeedPage; 