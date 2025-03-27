import React from 'react';

const Profile: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Profile</h1>
      <div className="max-w-2xl">
        {/* Profile content will go here */}
        <p className="text-lg text-gray-600">Your profile information will appear here.</p>
      </div>
    </div>
  );
};

export default Profile; 