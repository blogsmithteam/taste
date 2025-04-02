import React, { useEffect, useState } from 'react';
import { userService } from '../../services/user';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types/user';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface FollowRequest {
  id: string;
  fromUserId: string;
  createdAt: Timestamp;
}

export const PendingFollowRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<(FollowRequest & { requester: User | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.uid) return;

      try {
        const pendingRequests = await userService.getPendingFollowRequests(user.uid);
        
        // Fetch user details for each request
        const requestsWithUsers = await Promise.all(
          pendingRequests.map(async (request) => {
            const requester = await userService.getUserProfile(request.fromUserId);
            return {
              ...request,
              requester
            };
          })
        );

        setRequests(requestsWithUsers);
      } catch (error) {
        console.error('Error fetching follow requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user?.uid]);

  const handleRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!user?.uid) return;

    try {
      await userService.handleFollowRequest(requestId, status);
      // Remove the handled request from the list
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error(`Error ${status === 'accepted' ? 'accepting' : 'rejecting'} follow request:`, error);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return <div className="text-gray-500">No pending follow requests</div>;
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img
                className="h-10 w-10 rounded-full"
                src={request.requester?.photoURL || '/default-avatar.png'}
                alt={`${request.requester?.username || 'User'}'s avatar`}
              />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {request.requester?.username || 'Unknown user'}
              </p>
              <p className="text-sm text-gray-500">
                Requested {format(request.createdAt.toDate(), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleRequest(request.id, 'accepted')}
              className="px-4 py-2 bg-[#E76F51] text-white rounded-md hover:bg-[#E76F51]/90 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => handleRequest(request.id, 'rejected')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}; 