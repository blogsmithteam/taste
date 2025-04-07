import React from 'react';

interface Feature {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

const features: Feature[] = [
  {
    id: 'tasting-notes',
    title: 'Create Tasting Notes',
    description: 'Document your culinary experiences with detailed tasting notes for both restaurant meals and homemade recipes. Rate, describe, and capture every delicious moment.',
    imageSrc: '/images/features/create-note.png',
    imageAlt: 'Create new tasting note interface showing restaurant and recipe options',
  },
  {
    id: 'favorite-restaurants',
    title: 'Favorite Restaurants',
    description: 'Set your favorite restaurants for easily sharing with friends. Keep track of your most-loved dining spots and help others discover great places to eat.',
    imageSrc: '/images/features/favorite-restaurants.png',
    imageAlt: 'Interface showing favorite restaurants list with sharing options',
  },
  {
    id: 'dietary-preferences',
    title: 'Dietary Preferences',
    description: 'Customize your profile with dietary preferences and allergies. Get personalized recommendations and ensure your dining experiences align with your dietary needs.',
    imageSrc: '/images/features/set-preferences.png',
    imageAlt: 'Profile settings interface showing dietary preferences and allergies options',
  },
  {
    id: 'family-management',
    title: 'Family & Friends',
    description: 'Connect with family and friends to see everyone\'s dietary preferences, allergies, and favorites in one place. Makes group meal planning and dining out together effortless and inclusive.',
    imageSrc: '/images/features/set-family.png',
    imageAlt: 'Interface for managing family members and friends with their dietary preferences',
  },
  {
    id: 'browse-bookmark',
    title: 'Browse & Bookmark',
    description: 'Explore a world of culinary experiences through notes shared by friends and the community. Save your favorites as bookmarks to build your own collection of must-try dishes and restaurants.',
    imageSrc: '/images/features/bookmarks.png',
    imageAlt: 'Interface showing shared tasting notes with bookmark functionality',
  },
  {
    id: 'notifications',
    title: 'Stay Connected',
    description: 'Receive notifications about activity from people you follow and when others interact with your notes. Never miss out on new recommendations or feedback from your food-loving community.',
    imageSrc: '/images/features/notifications.png',
    imageAlt: 'Notifications interface showing activity from followed users and interactions',
  },
  // More features can be added here later
];

const FeatureShowcase: React.FC = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-serif font-bold text-taste-primary mb-4">
            Powerful Features for Food Lovers
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Everything you need to document and share your culinary journey
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              {/* Feature Description */}
              <div className={index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}>
                <h3 className="text-3xl font-serif font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Feature Image */}
              <div className={index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}>
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={feature.imageSrc}
                    alt={feature.imageAlt}
                    className="w-full h-auto"
                  />
                  {/* Decorative Elements */}
                  <div className="absolute inset-0 ring-1 ring-inset ring-gray-900/10"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureShowcase; 