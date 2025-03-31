# How-To Guide

This guide provides detailed instructions for setting up and using the Taste application.

## Setup Instructions

### Development Environment

1. **Node.js and npm**
   - Install Node.js 18 or higher from [nodejs.org](https://nodejs.org/)
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **Firebase Setup**
   - Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication with Email/Password provider
   - Enable Firestore Database
   - Enable Storage for user uploads
   - Get your Firebase configuration from Project Settings
   - Add the configuration to your `.env` file:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
     ```

3. **Project Setup**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/taste.git
   cd taste

   # Install dependencies
   npm install

   # Start development server
   npm run dev
   ```

## Authentication System

The application uses Firebase Authentication with the following features:

1. **User Registration**
   - Email and password registration
   - Display name required
   - Terms and Privacy Policy acceptance
   - Password strength validation
   - Email format validation

2. **User Login**
   - Email and password authentication
   - Remember me functionality
   - Redirect to protected routes
   - State preservation during navigation

3. **Password Reset**
   - Email-based password reset
   - Secure reset link generation
   - Rate limiting for reset attempts

4. **Protected Routes**
   - Automatic redirection to login
   - State preservation
   - Role-based access control

5. **Security Features**
   - Rate limiting for authentication attempts
   - Input validation and sanitization
   - Secure session management
   - Protected API endpoints

### Common Issues and Solutions

1. **Environment Variables Not Loading**
   - Ensure `.env` file is in the root directory
   - Verify all required variables are present
   - Restart the development server

2. **TypeScript Errors**
   - Run `npm run lint` to check for type errors
   - Ensure all dependencies are properly installed
   - Check `tsconfig.json` for correct configuration

3. **Build Issues**
   - Clear the `dist` directory
   - Run `npm run build` with verbose logging
   - Check for any missing dependencies

4. **Firebase Connection Issues**
   - Verify Firebase configuration in `.env`
   - Check Firebase console for any service issues
   - Ensure proper Firebase security rules are set
   - Verify Authentication providers are enabled

5. **Authentication Issues**
   - Check Firebase Authentication console
   - Verify email verification status
   - Check rate limiting status
   - Ensure proper error handling in forms

## Development Workflow

1. **Starting Development**
   ```bash
   npm run dev
   ```

2. **Running Tests**
   ```bash
   npm run test
   ```

3. **Code Quality**
   ```bash
   # Lint code
   npm run lint

   # Format code
   npm run format
   ```

4. **Building for Production**
   ```bash
   npm run build
   npm run preview
   ```

## Best Practices

1. **Component Structure**
   - Use functional components with TypeScript
   - Implement proper prop types
   - Follow the single responsibility principle

2. **State Management**
   - Use React Context for global state
   - Implement proper error boundaries
   - Follow React hooks best practices

3. **Styling**
   - Use Tailwind CSS utility classes
   - Follow mobile-first approach
   - Maintain consistent spacing and colors

4. **Testing**
   - Write unit tests for critical components
   - Test user interactions
   - Maintain good test coverage

5. **Authentication**
   - Always validate user input
   - Implement proper error handling
   - Use secure session management
   - Follow Firebase security best practices

## Deployment

1. **Production Build**
   ```bash
   npm run build
   ```

2. **Preview Production Build**
   ```bash
   npm run preview
   ```

3. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)

## Creating a Recipe Note

To create a recipe note:

1. Navigate to the "Create Note" page
2. Select "Recipe" as the note type
3. In the "Recipe Creator" section:
   - Enter what you made in the "What did you make?" field
   - Add the recipe creator (person, website, or cookbook)
   - Select the creator type
   - If from a website, add the recipe URL (optional)
4. Choose whether to share this recipe with friends (regardless of visibility settings)
5. Add your rating, notes, tags, and photos
6. Save your recipe note

Recipe notes can be shared more widely than other notes if you enable the "Share this recipe with friends" option, which allows friends to view it even when your general note visibility is set to private. 