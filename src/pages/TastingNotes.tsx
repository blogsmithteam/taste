import React from 'react';

export const TastingNotes: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Tasting Notes</h1>
      <div className="grid gap-6">
        {/* Note list will go here */}
        <p className="text-lg text-gray-600">Your tasting notes will appear here.</p>
      </div>
    </div>
  );
}; 