import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-taste-light">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-taste-primary/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-taste-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-serif font-bold text-taste-primary">Taste</h1>
              </Link>
            </div>
            
            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-taste-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Log In
              </Link>
              <Link 
                to="/register" 
                className="btn-primary text-sm px-4 py-2 font-medium"
              >
                Sign Up
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-taste-primary focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-taste-primary/10">
              <Link
                to="/login"
                className="text-gray-700 hover:text-taste-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-taste-primary hover:bg-taste-primary hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div id="hero" className="flex flex-col items-center justify-center pt-16 pb-12 px-4 text-center">
        <h1 className="text-6xl font-serif font-bold text-taste-primary mb-6">
          Capture Your Culinary Journey
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mb-10">
          Track and share your restaurant experiences and homemade
          recipes with Taste, the ultimate tasting journal.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link 
            to="/register" 
            className="btn-primary text-lg px-8 py-3 font-medium"
          >
            Get Started
          </Link>
          <Link 
            to="/login" 
            className="text-lg px-8 py-3 font-medium text-taste-primary hover:text-taste-primary/80 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
      
      {/* Popular Tasting Notes Section */}
      <div id="popular-notes" className="max-w-7xl mx-auto px-4 pb-20 pt-4">
        <h2 className="text-4xl font-serif font-bold text-center mb-10">
          Log and Share Your Tasting Notes
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Pizza Card */}
          <div className="card card-hover overflow-hidden">
            <div className="relative w-full h-48 rounded-md overflow-hidden mb-3">
              <img 
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591" 
                alt="Pizza" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex space-x-2">
                <div className="bg-white/90 p-2 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div className="bg-white/90 p-2 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="px-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif font-medium text-xl">Amazing Pizza at Luigi's</h3>
                <div className="flex-shrink-0 bg-taste-primary/10 text-taste-primary px-2 py-1 rounded text-xs font-medium">
                  Restaurant
                </div>
              </div>

              <div className="flex items-center mb-2">
                <div className="star-rating flex mr-2">
                  {[1, 2, 3, 4].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-taste-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <span className="text-taste-primary font-medium">4.0</span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                The margherita pizza had the perfect crispy crust with a delicious tomato sauce. Highly recommend trying their house special with prosciutto!
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-gray-500 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  May 14, 2023
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  New York
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <span className="tag-pill">Italian</span>
                <span className="tag-pill">Pizza</span>
                <span className="tag-pill">Casual</span>
              </div>

              <div className="flex items-center border-t border-gray-100 pt-3 mt-2">
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80" alt="User" className="h-6 w-6 rounded-full mr-2" />
                <span className="text-sm text-gray-600">Emily Johnson</span>
              </div>
            </div>
          </div>

          {/* Pasta Card */}
          <div className="card card-hover overflow-hidden">
            <div className="relative w-full h-48 rounded-md overflow-hidden mb-3">
              <img 
                src="https://images.unsplash.com/photo-1516100882582-96c3a05fe590" 
                alt="Pasta" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex space-x-2">
                <div className="bg-white/90 p-2 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div className="bg-white/90 p-2 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="px-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif font-medium text-xl">Homemade Carbonara Recipe</h3>
                <div className="flex-shrink-0 bg-taste-primary/10 text-taste-primary px-2 py-1 rounded text-xs font-medium">
                  Recipe
                </div>
              </div>

              <div className="flex items-center mb-2">
                <div className="star-rating flex mr-2">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-taste-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-taste-primary font-medium">5.0</span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                The secret to perfect carbonara is using fresh eggs and high-quality pancetta. This recipe creates a silky smooth sauce without using any cream!
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-gray-500 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Jun 21, 2023
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  25 min
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <span className="tag-pill">Italian</span>
                <span className="tag-pill">Pasta</span>
                <span className="tag-pill">Homemade</span>
              </div>

              <div className="flex items-center border-t border-gray-100 pt-3 mt-2">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80" alt="User" className="h-6 w-6 rounded-full mr-2" />
                <span className="text-sm text-gray-600">Michael Thompson</span>
              </div>
            </div>
          </div>

          {/* Sushi Card */}
          <div className="card card-hover overflow-hidden">
            <div className="relative w-full h-48 rounded-md overflow-hidden mb-3">
              <img 
                src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c" 
                alt="Sushi" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex space-x-2">
                <div className="bg-white/90 p-2 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div className="bg-white/90 p-2 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="px-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif font-medium text-xl">Omakase at Sakura</h3>
                <div className="flex-shrink-0 bg-taste-primary/10 text-taste-primary px-2 py-1 rounded text-xs font-medium">
                  Restaurant
                </div>
              </div>

              <div className="flex items-center mb-2">
                <div className="star-rating flex mr-2">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-taste-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-taste-primary font-medium">5.0</span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                The 12-course omakase experience was incredible. The fatty tuna and sea urchin were the standouts. Chef Tanaka's attention to detail is unmatched.
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-gray-500 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Jul 9, 2023
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  San Francisco
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <span className="tag-pill">Japanese</span>
                <span className="tag-pill">Sushi</span>
                <span className="tag-pill">Fine Dining</span>
              </div>

              <div className="flex items-center border-t border-gray-100 pt-3 mt-2">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80" alt="User" className="h-6 w-6 rounded-full mr-2" />
                <span className="text-sm text-gray-600">Sarah Chen</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-10">
          <Link 
            to="/register" 
            className="inline-flex items-center px-5 py-2 bg-taste-primary/10 text-taste-primary font-medium rounded-lg hover:bg-taste-primary hover:text-white transition-colors"
          >
            <span>Explore More Tasting Notes</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Connect & Share Section */}
      <div id="connect-share" className="bg-gradient-to-b from-taste-primary/5 to-taste-primary/10 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-serif font-bold text-center mb-8">
            Dining Together, Made Better
          </h2>
          <p className="text-xl text-gray-700 text-center max-w-3xl mx-auto mb-12">
            Share your food journey with family and friends. From dietary preferences to favorite recipes, 
            Taste makes every dining experience more enjoyable and inclusive.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="bg-taste-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-medium mb-3">Dietary Preferences at a Glance</h3>
              <p className="text-gray-600">
                Easily share and view dietary restrictions, allergies, and preferences within your circle. 
                Make restaurant choices that work for everyone.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="bg-taste-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-medium mb-3">Share Family Recipes</h3>
              <p className="text-gray-600">
                Keep family traditions alive by sharing and preserving cherished recipes. 
                Add your own twists and create new memories together.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link 
              to="/register" 
              className="inline-flex items-center px-6 py-3 bg-taste-primary text-white font-medium rounded-lg hover:bg-taste-primary/90 transition-colors"
            >
              Start Sharing Your Taste
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-serif font-bold text-center mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-taste-light p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif mb-3">Create Detailed Tasting Notes</h3>
              <p className="text-gray-600">
                Document every culinary experience with photos, ratings, and personalized descriptions to build your food journal.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-taste-light p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif mb-3">Track Your Favorite Restaurants</h3>
              <p className="text-gray-600">
                Keep a record of restaurants you've visited, maintain a wishlist, and never forget that amazing dish you tried.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-taste-light p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif mb-3">Connect With Family & Friends</h3>
              <p className="text-gray-600">
                Share your culinary discoveries with loved ones and see their recommendations. Share dietary preferences and allergies.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center mt-12">
            <div className="flex flex-col items-center">
              <div className="bg-taste-light p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif mb-3">Discover New Experiences</h3>
              <p className="text-gray-600">
                Explore public notes from other food enthusiasts to find your next culinary adventure.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-taste-light p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif mb-3">Bookmark Favorites</h3>
              <p className="text-gray-600">
                Save notes and recipes that inspire you for easy access later when you're ready to try them.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-taste-light p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-taste-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif mb-3">Stay Updated</h3>
              <p className="text-gray-600">
                Receive notifications about activity from people you follow and when others interact with your notes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-taste-primary py-16 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-serif font-bold text-white mb-6">
            Ready to Start Your Culinary Journey?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join food enthusiasts documenting and sharing their gastronomic adventures.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center px-8 py-3 bg-white text-taste-primary font-medium rounded-lg hover:bg-white/90 transition-colors text-lg"
          >
            Sign Up Now
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-3xl font-serif font-bold text-white">Taste</h2>
              <p className="text-white/70">Your culinary journey starts here</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-white/70 hover:text-white transition-colors">About</a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Taste. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 