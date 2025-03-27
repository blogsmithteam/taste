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
   - Enable Authentication and Firestore
   - Get your Firebase configuration from Project Settings
   - Add the configuration to your `.env` file

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