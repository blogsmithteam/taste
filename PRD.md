# Taste - Tasting Notes App PRD

## Project Overview
Taste is a social platform for tracking and sharing tasting notes for both restaurant experiences and recipes. Users can maintain personal tasting journals, share preferences with family and friends, and discover new culinary experiences through their network.

## Key Decisions & Requirements

### User Experience
✅ Private Notes: Users can create notes that are never shared
✅ Permission Levels: 
  - Private (default)
  - Friends (shared with connected users)
  - Public (visible to all users)
✅ Rating System: 5-star rating system (1-5)

### Data Management
✅ Data Retention: User data retained for 1 month after account deletion
✅ Data Export: 
  - Available from launch
  - Export format: CSV/Excel spreadsheet
  - Includes all user notes and preferences
✅ Language Support: English only (initial release)

### Technical Stack
✅ UI Framework: Tailwind CSS
✅ State Management: Context API (initial phase)
  - Redux evaluation deferred to later production phase
✅ Real-time Updates: Deferred to future phase
  - Will be evaluated based on user feedback and performance needs

## Technical Architecture

### Frontend Stack
- React.js with TypeScript
- Tailwind CSS for styling
- React Router v6
- Context API for state management
- Firebase SDK

### Backend Stack
- Firebase
  - Authentication
  - Firestore Database
  - Storage (for images)
  - Hosting
  - Security Rules

### Database Schema

#### Users Collection
```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  username: string;               // Unique username
  email: string;                  // User's email
  profilePicture: string;         // URL to profile picture
  bio: string;                    // User's bio
  dietaryPreferences: string[];   // Array of dietary preferences
  allergies: string[];           // Array of allergies
  followers: string[];           // Array of follower UIDs
  following: string[];           // Array of following UIDs
  createdAt: Timestamp;          // Account creation date
  updatedAt: Timestamp;          // Last update date
  settings: {
    isPrivate: boolean;          // Private account setting
    emailNotifications: boolean; // Email notification preferences
    language: 'en';              // Default language
  }
}
```

#### Notes Collection
```typescript
interface Note {
  id: string;                    // Unique note ID
  userId: string;                // Creator's UID
  type: 'restaurant' | 'recipe'; // Note type
  title: string;                 // Note title
  rating: number;                // 1-5 rating
  date: Timestamp;               // Experience date
  location?: {                   // Optional for recipes
    name: string;
    address: string;
    coordinates: GeoPoint;
  };
  photos: string[];              // Array of photo URLs
  notes: string;                 // Detailed notes
  tags: string[];                // Categorization tags
  improvements: string[];        // Improvement suggestions
  wouldOrderAgain: boolean;      // Would order again?
  visibility: 'private' | 'friends' | 'public';
  sharedWith: string[];         // Array of user UIDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Project Setup
  - [x] Initialize React + TypeScript project
  - [x] Set up Firebase configuration
  - [x] Configure ESLint and Prettier
  - [x] Set up basic routing structure
  - [x] Implement basic layout components with Tailwind CSS

- [x] Authentication System
  - [x] Firebase Auth integration
  - [x] Login/Register forms
  - [x] Password reset flow
  - [x] Protected routes

### Phase 2: Core Features (Weeks 2-3)
- [ ] Note Management
  - [x] Create note form with visibility options
  - [x] Note list view with filtering
  - [x] Individual note view
  - [ ] Edit/Delete functionality
  - [ ] Photo upload integration
  - [ ] Data export functionality

- [ ] User Profiles
  - [ ] Profile creation/editing
  - [ ] Dietary preferences
  - [ ] Allergies management
  - [ ] Privacy settings

### Phase 3: Social Features (Weeks 4-5)
- [ ] Social Interactions
  - [ ] Follow/unfollow system
  - [ ] Note sharing
  - [ ] Activity feed
  - [ ] Notifications

- [ ] Search & Discovery
  - [ ] Search functionality
  - [ ] Filter system
  - [ ] Tag system

### Phase 4: Polish (Weeks 6-7)
- [ ] Performance Optimization
  - [ ] Database query optimization
  - [ ] Image optimization
  - [ ] Caching implementation

- [ ] UX Improvements
  - [ ] Loading states
  - [ ] Error handling
  - [ ] Mobile responsiveness
  - [ ] Accessibility improvements

## Security Considerations
- Implement proper Firebase Security Rules
- Sanitize user input
- Implement rate limiting
- Secure file uploads
- Data encryption at rest
- Regular security audits

## Testing Strategy
- Unit tests for critical components
- Integration tests for main user flows
- E2E tests for critical paths
- Performance testing
- Security testing

## Deployment Strategy
1. Development environment
2. Staging environment
3. Production environment
4. Monitoring setup
5. Backup strategy

## Success Metrics
- Daily Active Users (DAU)
- Note creation rate
- Social interaction metrics
- User retention rate
- App performance metrics
- Error rates

## Future Roadmap
- Mobile app development
- Recipe import integration
- Restaurant API integration
- AI-powered recommendations
- Collaborative features
- Export functionality
- Toast notification system for user feedback
  - Success/error messages for CRUD operations
  - Authentication status updates
  - Real-time updates for social features

## Documentation Requirements
- API documentation
- Component documentation
- Setup instructions
- Deployment guide
- Security guidelines

## Core Features

### User Authentication & Profiles
- User registration and login via Firebase Authentication
- Profile customization including:
  - Profile picture
  - Bio
  - Dietary preferences
  - Allergies and restrictions
  - Privacy settings

### Tasting Notes
- Create notes for:
  - Restaurant experiences
  - Homemade recipes
  - Online recipe links
- Note components:
  - Rating (1-5 stars)
  - Date of experience
  - Location (for restaurants)
  - Photos
  - Detailed notes
  - Tags for easy categorization
  - Improvement suggestions
  - Would order again? (Y/N)

### Social Features
- Follow other users
- Share notes with specific users
- View public notes from followed users
- Like and comment on notes
- Share notes to external platforms

### Search & Discovery
- Search by:
  - Restaurant name
  - Recipe name
  - Tags
  - User
- Filter by:
  - Rating
  - Date
  - Dietary preferences
  - Allergies

## Milestones

### Phase 1: MVP (2-3 weeks)
1. Project Setup
   - Initialize React project
   - Set up Firebase
   - Configure routing
   - Set up basic styling

2. Authentication
   - Implement user registration
   - Implement login/logout
   - Create basic profile page

3. Core Note Features
   - Create note form
   - View notes list
   - Individual note view
   - Basic CRUD operations

### Phase 2: Social Features (2 weeks)
1. User Profiles
   - Profile customization
   - Dietary preferences
   - Allergies

2. Social Interactions
   - Follow/unfollow users
   - Share notes
   - View feed of followed users

### Phase 3: Enhanced Features (2 weeks)
1. Search & Discovery
   - Implement search functionality
   - Add filters
   - Create discovery feed

2. Media & Rich Content
   - Photo upload
   - Rich text editor for notes
   - External recipe link preview

### Phase 4: Polish & Optimization (1-2 weeks)
1. Performance
   - Optimize database queries
   - Implement caching
   - Add loading states

2. UX Improvements
   - Add animations
   - Improve mobile responsiveness
   - Add keyboard shortcuts

## Success Metrics
- User engagement (daily active users)
- Note creation rate
- Social interactions (follows, shares)
- User retention rate
- App performance metrics

## Future Considerations
- Mobile app development
- Recipe import from popular platforms
- Restaurant API integration
- AI-powered recommendations
- Collaborative note-taking
- Export functionality

## Development Guidelines
- Follow React best practices
- Implement proper error handling
- Write unit tests for critical components
- Use TypeScript for better type safety
- Follow accessibility guidelines
- Implement proper security rules in Firebase

## Launch Strategy
1. Beta testing with a small group of users
2. Gather feedback and iterate
3. Soft launch with limited features
4. Gradual feature rollout
5. Marketing campaign focused on food enthusiasts 