import React from 'react';
import { format } from 'date-fns';
import { StarIcon } from '@heroicons/react/24/solid';
import { PencilIcon, PlusIcon, BuildingStorefrontIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export interface ActivityItem {
  type: 'added' | 'updated';
  item: {
    id: string;
    title: string;
    rating: number;
    date: Date;
    itemType: 'restaurant' | 'recipe';
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const navigate = useNavigate();

  const handleNoteClick = (noteId: string) => {
    navigate(`/app/notes/${noteId}`);
  };

  return (
    <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h2>
      <p className="text-sm text-gray-600 mb-6">Your latest culinary adventures</p>

      <div className="overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th scope="col" className="text-left text-sm font-medium text-gray-500 pb-3 w-1/4">Activity</th>
              <th scope="col" className="text-left text-sm font-medium text-gray-500 pb-3 w-2/4">Item</th>
              <th scope="col" className="text-left text-sm font-medium text-gray-500 pb-3 w-1/6">Rating</th>
              <th scope="col" className="text-left text-sm font-medium text-gray-500 pb-3 w-1/6">Date</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr 
                key={index} 
                onClick={() => handleNoteClick(activity.item.id)}
                className="group hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              >
                <td className="py-4">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900">
                      {activity.type === 'added' ? 'Added new note' : 'Updated note'}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {activity.item.itemType === 'restaurant' ? (
                      <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 group-hover:text-taste-primary transition-colors" />
                    ) : (
                      <BookOpenIcon className="h-5 w-5 text-gray-400 group-hover:text-taste-primary transition-colors" />
                    )}
                    <span className="text-sm font-medium text-gray-900 group-hover:text-taste-primary transition-colors">
                      {activity.item.title}
                    </span>
                  </div>
                </td>
                <td className="py-4">
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
                </td>
                <td className="py-4">
                  <div className="text-sm text-gray-600">
                    {format(activity.item.date, 'MMM d, yyyy')}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 