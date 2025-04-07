import React, { ReactNode } from 'react';
import { format } from 'date-fns';
import { ChartBarIcon, BuildingStorefrontIcon, ClockIcon } from '@heroicons/react/24/outline';

interface DashboardStatsProps {
  totalNotes: number;
  notesThisMonth: number;
  totalRestaurants: number;
  totalRecipes: number;
  restaurantPercentage: number;
  averageRating: number;
  lastNoteDate: Date;
}

const StatCard: React.FC<{
  title: string;
  value: string | number | ReactNode;
  subValue?: string;
  icon: React.ElementType;
}> = ({ title, value, subValue, icon: Icon }) => (
  <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-lg font-medium text-[#F28B82]">{title}</p>
        <div className="mt-2">{typeof value === 'string' || typeof value === 'number' ? (
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
        ) : value}</div>
        {subValue && (
          <p className="mt-1 text-sm text-taste-primary/60">{subValue}</p>
        )}
      </div>
      <div className="rounded-lg bg-taste-primary/5 p-3">
        <Icon className="h-6 w-6 text-taste-primary" aria-hidden="true" />
      </div>
    </div>
  </div>
);

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalNotes,
  notesThisMonth,
  totalRestaurants,
  totalRecipes,
  restaurantPercentage,
  averageRating,
  lastNoteDate,
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Notes"
        value={totalNotes}
        subValue={`+${notesThisMonth} this month`}
        icon={ChartBarIcon}
      />
      <StatCard
        title="Restaurants & Recipes"
        value={
          <div className="flex items-center gap-4">
            <div>
              <span className="text-3xl font-semibold text-gray-900">{totalRestaurants}</span>
              <span className="text-sm text-taste-primary/60 ml-1">restaurants</span>
            </div>
            <div>
              <span className="text-3xl font-semibold text-gray-900">{totalRecipes}</span>
              <span className="text-sm text-taste-primary/60 ml-1">recipes</span>
            </div>
          </div>
        }
        subValue={`${averageRating} average rating`}
        icon={BuildingStorefrontIcon}
      />
      <StatCard
        title="Recent Activity"
        value={format(lastNoteDate, 'MMM d')}
        subValue="Last note created"
        icon={ClockIcon}
      />
    </div>
  );
}; 