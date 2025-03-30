import React from 'react';
import { ActivityFeed as ActivityFeedComponent } from '../components/ActivityFeed';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const ActivityFeedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(var(--spice))]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="taste-header">Activity Feed</h1>
          <button 
            onClick={() => navigate('/app/discover')}
            className="btn btn-outline inline-flex items-center"
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Find Friends
          </button>
        </div>
        <ActivityFeedComponent />
      </div>
    </div>
  );
};

export default ActivityFeedPage; 