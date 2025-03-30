# Taste App Style Guide

## Overview
This style guide defines the typography, color system, and component styles for the Taste application. It ensures consistency across all pages and components while maintaining the established design language.

## Typography System

### Headers
- **Primary Headers** (e.g., "Tasting Notes")
  ```css
  font-serif text-5xl font-semibold text-[#E76F51]
  ```
  - Font: Playfair Display (serif)
  - Size: text-5xl
  - Weight: font-semibold
  - Color: Primary Coral (#E76F51)

### Subheaders/Body Text
- **Descriptive Text** (e.g., "Capture and explore...")
  ```css
  text-xl text-black
  ```
  - Font: Inter (sans-serif)
  - Size: text-xl
  - Color: Black

## Color System

### Primary Colors
- **Coral Primary**: `#E76F51` (defined in Tailwind config as `taste-primary`)
  - Full opacity: Main headers and primary buttons
  - 90% opacity (`/90`): Button hover states
  - 70% opacity (`/70`): Secondary text
  - 10% opacity (`/10`): Subtle backgrounds and hover states
  - 5% opacity (`/5`): Very subtle backgrounds

### Background Colors
- **Main Background**: `bg-[#FDF1ED]` (light coral)
- **Card/Container Background**: `bg-white/80` (semi-transparent white)

## Component Styles

### Buttons

#### Primary Button
```css
inline-flex items-center px-4 py-2 bg-[#E76F51] text-white rounded-lg hover:bg-[#E76F51]/90 transition-colors
```
Use for: Main call-to-action buttons (e.g., "Create Note")

#### Secondary Button
```css
bg-[#E76F51]/10 text-[#E76F51] hover:bg-[#E76F51] hover:text-white transition-colors
```
Use for: Less prominent actions (e.g., "Load More")

### Containers

#### Card/Section Container
```css
bg-white/80 rounded-lg shadow-sm border border-[#E76F51]/10 p-6
```
Use for: Content sections, cards, and form containers

### Interactive Elements

#### Card Hover Effects
```css
card-hover
```
Applies:
```css
transition-all duration-200 hover:shadow-md hover:-translate-y-1
```

#### Button Transitions
All buttons should include:
```css
transition-colors
```

### Animation Classes

#### Page Transitions
```css
animate-fade-in
```

#### Loading States
```css
animate-spin
```
Use for loading spinners and indicators

## Layout Guidelines

### Page Container Structure
```jsx
<div className="container mx-auto px-4 py-8 animate-fade-in">
  <div className="max-w-7xl mx-auto">
    {/* Content */}
  </div>
</div>
```

### Grid System
- Default: Single column
- Medium screens: `md:grid-cols-2`
- Large screens: `lg:grid-cols-3`

## Best Practices

### Accessibility
- Maintain WCAG 2.1 compliance
- Ensure sufficient color contrast ratios
- Include proper hover/focus states
- Use semantic HTML elements

### Responsive Design
- Test layouts across all breakpoints
- Ensure text remains readable on mobile
- Maintain proper spacing on all devices

### Performance
- Use Tailwind's JIT compiler
- Minimize custom CSS
- Leverage utility classes when possible

## Example Implementation

```jsx
<div className="container mx-auto px-4 py-8 animate-fade-in">
  <div className="max-w-7xl mx-auto">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="font-serif text-5xl font-semibold text-[#E76F51] mb-2">
          Page Title
        </h1>
        <p className="text-black text-xl">
          Descriptive subtitle text
        </p>
      </div>
      <Button className="inline-flex items-center px-4 py-2 bg-[#E76F51] text-white rounded-lg hover:bg-[#E76F51]/90 transition-colors">
        Action Button
      </Button>
    </div>
    <div className="bg-white/80 rounded-lg shadow-sm border border-[#E76F51]/10 p-6 mb-8">
      {/* Content */}
    </div>
  </div>
</div>
```

## Tailwind Configuration

The following colors should be defined in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      taste: {
        primary: '#E76F51',
        secondary: '#84A98C',
        neutral: '#F4F1DE',
        accent: '#5E548E',
        light: '#FFF8ED'
      }
    }
  }
}
```

## Maintenance

### Adding New Styles
1. Check if existing utilities can be used
2. Ensure new styles follow established patterns
3. Update this style guide when adding new patterns
4. Document any exceptions or special cases

### Code Reviews
- Verify style guide compliance
- Check for consistent class naming
- Ensure responsive design principles are followed
- Validate accessibility requirements

## Resources
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Best Practices](https://reactjs.org/docs/getting-started.html) 