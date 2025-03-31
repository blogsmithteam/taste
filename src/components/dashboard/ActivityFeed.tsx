import React from 'react';
import { format } from 'date-fns';
import { StarIcon } from '@heroicons/react/24/solid';
import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';

export interface ActivityItem {
  type: 'added' | 'updated';
  item: {
    title: string;
    rating: number;
    date: Date;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
      <div className="flow-root">
        <ul role="list" className="-mb-8">
          {activities.map((activity, activityIdx) => (
            <li key={activityIdx}>
              <div className="relative pb-8">
                {activityIdx !== activities.length - 1 ? (
                  <span
                    className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <div className={`
                      h-10 w-10 rounded-full flex items-center justify-center
                      ${activity.type === 'added' ? 'bg-green-100' : 'bg-blue-100'}
                    `}>
                      {activity.type === 'added' ? (
                        <PlusIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <PencilIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {activity.type === 'added' ? 'Added new note' : 'Updated note'}
                      </span>
                    </div>
                    <div className="mt-2 bg-white rounded-lg border border-gray-100 p-4 transition-all duration-200 hover:border-taste-primary/20 hover:shadow-sm">
                      <h3 className="font-medium text-gray-900 group-hover:text-taste-primary transition-colors">
                        {activity.item.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <time dateTime={activity.item.date.toISOString()}>
                          {format(activity.item.date, 'MMM d, yyyy')}
                        </time>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, index) => (
                            <StarIcon
                              key={index}
                              className={`h-4 w-4 ${
                                index < activity.item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 