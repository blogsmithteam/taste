import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notesService } from '../services/notes';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { ActivityFeed, ActivityItem } from '../components/dashboard/ActivityFeed';
import { Button } from '../components/auth/shared/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalNotes: 0,
    notesThisMonth: 0,
    totalRestaurants: 0,
    restaurantPercentage: 0,
    lastNoteDate: new Date()
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Fetch stats
        const notes = await notesService.getUserNotes(user.uid);
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const restaurantNotes = notes.filter(note => note.type === 'restaurant');
        const notesThisMonth = notes.filter(note => note.date.toDate() >= firstDayOfMonth);
        const lastNote = notes[0]; // Assuming notes are sorted by date desc

        setStats({
          totalNotes: notes.length,
          notesThisMonth: notesThisMonth.length,
          totalRestaurants: restaurantNotes.length,
          restaurantPercentage: Math.round((restaurantNotes.length / notes.length) * 100),
          lastNoteDate: lastNote ? lastNote.date.toDate() : new Date()
        });

        // Fetch recent activities
        const recentActivities: ActivityItem[] = notes
          .slice(0, 3)
          .map(note => ({
            type: 'added',
            item: {
              title: note.title,
              rating: note.rating,
              date: note.date.toDate()
            }
          }));

        setActivities(recentActivities);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDF1ED] flex items-center justify-center">
        <p className="text-taste-primary/60 text-lg">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF1ED]">
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-serif text-5xl font-semibold text-[#E76F51] mb-2">
                Welcome back, {user.displayName?.split(' ')[0] || 'Friend'}
              </h1>
              <p className="text-black text-xl">Your culinary journey at a glance</p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/app/create-note?type=restaurant')}
                variant="secondary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Restaurant Note
              </Button>
              <Button
                onClick={() => navigate('/app/create-note?type=recipe')}
                variant="primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Recipe Note
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-[#E76F51]/5 border border-[#E76F51]/20 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-[#E76F51]">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E76F51]"></div>
            </div>
          ) : (
            <>
              <DashboardStats {...stats} />
              <div className="mt-8">
                <ActivityFeed activities={activities} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 