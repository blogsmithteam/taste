import React from 'react';
import { ActivityFeed as ActivityFeedComponent } from '../components/ActivityFeed';

const ActivityFeedPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-serif font-bold text-[#0F1419]">
          Activity Feed
        </h1>
        <button className="inline-flex items-center px-4 py-2 rounded-full border border-[#CFD9DE] bg-white text-[15px] font-medium text-[#0F1419] hover:bg-[#F7F9F9] transition-colors">
          Find Friends
        </button>
      </div>
      <ActivityFeedComponent />
    </div>
  );
};

export default ActivityFeedPage; 