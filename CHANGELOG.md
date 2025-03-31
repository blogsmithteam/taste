# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with React 18 and TypeScript
- Vite configuration for fast development
- Tailwind CSS for styling
- Basic project structure and routing
- ESLint and Prettier configuration
- Firebase configuration template
- Basic component structure (Layout, Navigation)
- Generic tasting notes functionality for food and beverages
- Authentication system with Firebase Auth
  - Login and registration forms with validation
  - Password reset functionality
  - Protected routes with state preservation
  - Authentication context for state management
  - Loading states and error handling
  - Terms and Privacy Policy acceptance
  - Form validation and accessibility features
- Note creation functionality
  - Create note form with validation
  - Support for restaurant and recipe notes
  - Visibility options (private, friends, public)
  - Rating system (1-5 stars)
  - Location details for restaurants
  - Notes and improvements fields
  - Would order again option
  - Firebase integration for data persistence
- Enhanced recipe functionality in the Create Note form
- Added prominent "Recipe Creator" section with "What did you make?" field
- Added optional Recipe URL field to link to original recipes
- Added ability to share recipes with friends regardless of visibility settings

### Changed
- Updated project description to reflect generic tasting notes functionality
- Restructured routing to include authentication flows
- Enhanced form components with accessibility improvements
- Updated navigation to include create note functionality
- Improved mobile responsiveness of navigation
- Planned: Toast notification system for improved user feedback

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- Implemented secure authentication with Firebase Auth
- Added protected routes for authenticated content
- Implemented proper form validation and sanitization
- Added rate limiting for authentication attempts
- Implemented proper Firestore security rules for notes 