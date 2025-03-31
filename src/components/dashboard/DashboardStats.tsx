import React from 'react';
import { format } from 'date-fns';
import { ChartBarIcon, BuildingStorefrontIcon, ClockIcon } from '@heroicons/react/24/outline';

interface DashboardStatsProps {
  totalNotes: number;
  notesThisMonth: number;
  totalRestaurants: number;
  restaurantPercentage: number;
  lastNoteDate: Date;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
}> = ({ title, value, subValue, icon: Icon }) => (
  <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-taste-primary/70">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
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
  restaurantPercentage,
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
        title="Restaurants"
        value={totalRestaurants}
        subValue={`${restaurantPercentage}% of total`}
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